// ============================================================
// features/auth/services/auth-service.ts
// Enterprise-grade AuthService implementation.
//
// Design contracts:
// - Never throws to consumers (AuthResult pattern)
// - Validates session shape at runtime (Zod)
// - Retries on transient failures (exponential backoff)
// - Injects browser dependencies (IBrowserLocation)
// - Pre-sorted routing priorities (O(N) lookup)
// - Structured logging (createServiceLogger)
// ============================================================

import 'client-only';

import type { IAuthService } from './auth-service.interface';
import type { AuthProvider } from './auth.constants';
import type { AuthResult } from './auth-result.types';
import type { IBrowserLocation } from './browser-location.provider';

import type { NormalizedSession } from '@/domains/auth/contracts/auth.types';
import { UserRole } from '@/domains/auth/contracts/auth.types';
import { getSession, signIn, signOut } from 'next-auth/react';
import { createServiceLogger } from '@/core/telemetry/logger.factory';
import { serializeError } from '../utils/error-serializer';
import { mapUserRole } from '../utils/role-mapper';
import { withRetry, withTimeout } from '../utils/retry.util';
import { RawSessionSchema } from './session.schema';
import { AUTH_SERVICE_CONFIG } from './auth-service.config';
import { AuthErrorCode, AR } from './auth-result.types';
import { defaultBrowserLocation } from './browser-location.provider';
import { ROLE_DASHBOARD_MAP, DEFAULT_DASHBOARD_ROUTE } from './role-dashboard-map';

// ─── Dependency Shape ─────────────────────────────────────────

export interface AuthServiceDeps {
  browserLocation: IBrowserLocation;
}

// ─── Implementation ───────────────────────────────────────────

class AuthService implements IAuthService {
  private readonly log = createServiceLogger('AuthService');
  private sessionCache: NormalizedSession | null = null;
  private cacheExpiry = 0;
  private activeSessionPromise: Promise<NormalizedSession | null> | null = null;

  constructor(
    private readonly deps: AuthServiceDeps = {
      browserLocation: defaultBrowserLocation,
    }
  ) {
    this.subscribeToCrossTabInvalidation();
  }

  /**
   * Listens for this-service-originated invalidation signals from other
   * browser tabs (see broadcastInvalidation()). The 5s TTL cache is
   * per-tab/per-instance; without this, a logout in Tab A would leave Tab
   * B's cache serving a stale authenticated session for up to 5s after the
   * user is actually signed out.
   */
  private subscribeToCrossTabInvalidation(): void {
    if (typeof window === 'undefined') return;
    window.addEventListener('storage', (event: StorageEvent) => {
      if (event.key === AUTH_SERVICE_CONFIG.crossTabInvalidationStorageKey) {
        this.invalidateCache();
      }
    });
  }

  /**
   * Clears this tab's cache AND signals every other open tab to clear
   * theirs, via a localStorage write (fires the native `storage` event in
   * other tabs only, never this one — see subscribeToCrossTabInvalidation).
   * Use this at every point session state actually changed; use the
   * private, local-only invalidateCache() for "this fetch attempt failed,"
   * which isn't a real state change other tabs need to know about.
   */
  private broadcastInvalidation(): void {
    this.invalidateCache();
    if (typeof window === 'undefined') return;
    try {
      // Value must change on every call — browsers do not fire the storage
      // event when a key is set to the same value it already had.
      window.localStorage.setItem(
        AUTH_SERVICE_CONFIG.crossTabInvalidationStorageKey,
        `${Date.now()}-${Math.random().toString(36).slice(2)}`
      );
    } catch (error) {
      // localStorage can throw (e.g. Safari private browsing quota) — this
      // must degrade to local-only invalidation, never break the caller.
      this.log.warn('Failed to broadcast cross-tab session invalidation', {
        error: serializeError(error),
      });
    }
  }

  // ─── Session ─────────────────────────────────────────────

  /**
   * Fetches, validates, and normalizes the current NextAuth session.
   *
   * Resilience & Performance:
   * - Client-side caching with a 5-second TTL prevents redundant session fetches.
   * - Active promise deduplication ensures simultaneous requests share the same fetch.
   * - Retries on network failure with exponential backoff.
   * - Validates session shape via Zod before domain ingestion.
   * - Returns null (never throws) on any failure path.
   */
  async getNormalizedSession(): Promise<NormalizedSession | null> {
    const nowMs = Date.now();
    if (this.sessionCache !== null && nowMs < this.cacheExpiry) {
      return this.sessionCache;
    }

    if (this.activeSessionPromise) {
      return this.activeSessionPromise;
    }

    this.activeSessionPromise = (async () => {
      try {
        const raw = await withTimeout(
          withRetry(() => getSession(), {
            retries: AUTH_SERVICE_CONFIG.sessionFetchRetries,
            delayMs: AUTH_SERVICE_CONFIG.sessionFetchRetryDelayMs,
            backoff: AUTH_SERVICE_CONFIG.sessionFetchRetryBackoff,
          }),
          AUTH_SERVICE_CONFIG.sessionFetchTimeoutMs,
          'getSession() timed out'
        );

        if (!raw) {
          this.invalidateCache();
          return null;
        }

        // Runtime schema validation — guard against malformed sessions
        const parsed = RawSessionSchema.safeParse(raw);
        if (!parsed.success) {
          this.log.error('Session schema validation failed', {
            errors: parsed.error.flatten(),
          });
          this.invalidateCache();
          return null;
        }

        const { user: rawUser, roles, expiresAt } = parsed.data;
        // Captured after the (possibly retried, possibly slow) fetch
        // resolves, not before — using the pre-fetch timestamp here would
        // understate elapsed time by however long retries took, skewing
        // isExpired/isExpiringSoon toward "still fine" right when accuracy
        // matters most.
        const now = Math.floor(Date.now() / 1000);
        const buffer = AUTH_SERVICE_CONFIG.sessionExpiryWarningBufferSeconds;

        if (!rawUser) {
          this.invalidateCache();
          return null;
        }

        // Map and clean up raw string roles to domain UserRole enums, filtering out nulls (unrecognized roles)
        const mappedRoles = roles
          .map((role) => mapUserRole(role))
          .filter((r): r is UserRole => r !== null);

        // ⚠️ user.roles below is the RAW, unmapped string[] straight from the
        // IdP — required as-is because shared/types/next-auth.d.ts declares
        // Session['user'].roles as string[] app-wide (the single source of
        // truth for NextAuth's own type; do not redeclare it here). It is
        // NOT the validated domain model — that's the sibling `roles` field
        // on NormalizedSession itself (UserRole[], filtered via mapUserRole).
        // Authorization decisions must always read NormalizedSession.roles,
        // never session.user.roles — the latter can contain unrecognized/
        // unmapped strings that mapUserRole deliberately dropped.
        const user = {
          // Schema-guaranteed non-empty (SessionUserSchema requires it) —
          // no fallback needed; a session without an id fails validation
          // above and returns null instead of reaching this point.
          id: rawUser.id,
          name: rawUser.name ?? '',
          email: rawUser.email ?? '',
          image: rawUser.image ?? null,
          firstName: rawUser.firstName ?? '',
          lastName: rawUser.lastName ?? '',
          phone: rawUser.phone ?? undefined,
          roles: roles,
        };

        this.sessionCache = {
          user,
          roles: mappedRoles,
          expiresAt,
          isExpired: expiresAt != null ? now > expiresAt : false,
          isExpiringSoon: expiresAt != null ? now > expiresAt - buffer : false,
        };

        this.cacheExpiry = Date.now() + 5000; // 5-second TTL
        return this.sessionCache;
      } catch (error) {
        this.log.error('Failed to get normalized session after all retries', {
          error: serializeError(error),
        });
        this.invalidateCache();
        return null;
      } finally {
        this.activeSessionPromise = null;
      }
    })();

    return this.activeSessionPromise;
  }

  /** Clears the in-memory session cache, forcing the next read to fetch fresh. */
  invalidateSession(): void {
    this.broadcastInvalidation();
  }

  private invalidateCache(): void {
    this.sessionCache = null;
    this.cacheExpiry = 0;
  }

  // ─── Auth Flows ──────────────────────────────────────────

  /**
   * Initiates the OAuth sign-in flow.
   * Returns AuthResult — success or typed failure, never throws.
   *
   * Calls next-auth's signIn() with redirect: false and performs the
   * navigation ourselves via the injected IBrowserLocation, rather than
   * letting next-auth do it internally. With the default redirect: true,
   * next-auth calls `window.location.href = url` and returns — the
   * resulting promise settles in the brief window before the browser
   * actually unloads the page, so any await on it is racing an imminent
   * navigation and cannot reliably be used to drive UI feedback. Making the
   * navigation an explicit, injected step keeps the "returns AuthResult,
   * never throws" contract meaningful and makes the success path testable
   * (with redirect: true there is nothing observable to assert against).
   * The target URL is computed identically by the same NextAuth route
   * either way, so this changes nothing about the actual redirect target.
   *
   * idpHint requests a specific upstream IdP brokered through Keycloak
   * (e.g. 'google') via Keycloak's own `kc_idp_hint` authorization
   * parameter — it does NOT change `provider`, which is always 'keycloak'
   * for that case. See AUTH_PROVIDERS in auth.constants.ts.
   */
  async initiateLogin(
    callbackUrl?: string,
    provider: AuthProvider = AUTH_SERVICE_CONFIG.defaultProvider,
    idpHint?: string
  ): Promise<AuthResult> {
    const resolvedUrl = callbackUrl ?? this.deps.browserLocation.getPathname();

    this.log.info('Initiating login flow', {
      callbackUrl: resolvedUrl,
      provider,
      idpHint,
    });

    try {
      const authorizationParams = idpHint ? { kc_idp_hint: idpHint } : undefined;
      const res = await signIn(
        provider,
        { callbackUrl: resolvedUrl, redirect: false },
        authorizationParams
      );
      if (res?.error) {
        this.log.error('Login flow failed', {
          error: res.error,
          callbackUrl: resolvedUrl,
          provider,
          idpHint,
        });
        return AR.fail(AuthErrorCode.LOGIN_FAILED, 'Authentication failed. Please try again.', res.error);
      }
      this.deps.browserLocation.navigate(res?.url ?? resolvedUrl);
      return AR.ok(undefined);
    } catch (error) {
      this.log.error('Login flow failed', {
        error: serializeError(error),
        callbackUrl: resolvedUrl,
        provider,
        idpHint,
      });
      return AR.fail(AuthErrorCode.LOGIN_FAILED, 'Authentication failed. Please try again.', error);
    }
  }

  /**
   * Initiates the sign-out flow.
   * Returns AuthResult — success or typed failure, never throws.
   * See initiateLogin()'s docs for why redirect: false + explicit
   * navigation is used instead of next-auth's default redirect: true.
   */
  async initiateLogout(callbackUrl?: string): Promise<AuthResult> {
    const resolvedUrl = callbackUrl ?? AUTH_SERVICE_CONFIG.defaultLogoutUrl;

    this.log.info('Initiating logout flow', { callbackUrl: resolvedUrl });

    // Invalidate immediately, before the request even completes — closes
    // the window where a concurrent getNormalizedSession() call (e.g. from
    // another component re-rendering mid-logout, in this tab or another)
    // could serve the still-cached, now-stale authenticated session for up
    // to the 5s TTL. Broadcasts to other tabs too, not just this one.
    this.broadcastInvalidation();

    try {
      const data = await signOut({ callbackUrl: resolvedUrl, redirect: false });
      this.deps.browserLocation.navigate(data?.url ?? resolvedUrl);
      return AR.ok(undefined);
    } catch (error) {
      this.log.error('Logout flow failed', {
        error: serializeError(error),
        callbackUrl: resolvedUrl,
      });
      return AR.fail(AuthErrorCode.LOGOUT_FAILED, 'Sign-out failed. Please try again.', error);
    }
  }

  // ─── Permission Checks ───────────────────────────────────
  //
  // ⚠️ UI-GATING ONLY. These three checks run entirely client-side against
  // client-visible role data and are trivially bypassable (devtools, a
  // fabricated array, editing component state). They exist to show/hide UI,
  // never to enforce it. Every protected action or API route MUST enforce
  // authorization independently, server-side — never rely on these as the
  // actual trust boundary.

  /**
   * AT LEAST ONE required role must be present (OR logic).
   * Returns true when requiredRoles is empty (no restriction).
   */
  checkPermissions(userRoles: UserRole[], requiredRoles: UserRole[]): boolean {
    if (requiredRoles.length === 0) return true;
    return requiredRoles.some((role) => userRoles.includes(role));
  }

  /**
   * ALL required roles must be present (AND logic).
   * Returns true when requiredRoles is empty (no restriction).
   */
  checkAllPermissions(userRoles: UserRole[], requiredRoles: UserRole[]): boolean {
    if (requiredRoles.length === 0) return true;
    return requiredRoles.every((role) => userRoles.includes(role));
  }

  /**
   * NONE of the denied roles must be present (NOT logic).
   * Returns true (allow) when deniedRoles is empty.
   */
  checkDeniedPermissions(userRoles: UserRole[], deniedRoles: UserRole[]): boolean {
    if (deniedRoles.length === 0) return true;
    return !deniedRoles.some((role) => userRoles.includes(role));
  }

  // ─── Routing ─────────────────────────────────────────────

  /**
   * Resolves dashboard route by highest-priority matching role.
   * ROLE_DASHBOARD_MAP is pre-sorted at module load — O(N) here.
   *
   * Multi-role contract: in this app CUSTOMER is the base role every
   * registered user starts with — becoming a seller or delivery agent
   * REQUIRES already being a customer, so `roles` legitimately contains
   * more than one value (e.g. [CUSTOMER, SELLER]) far more often than not.
   * When multiple roles are present, the LOWEST-priority-number entry in
   * ROLE_DASHBOARD_MAP wins (SELLER=1 beats DELIVERY_AGENT=2), regardless
   * of the order roles appear in the input array. CUSTOMER never wins this
   * way since it has no map entry — see role-dashboard-map.ts.
   */
  resolveDashboardRoute(roles: UserRole[]): string {
    const matched = ROLE_DASHBOARD_MAP.find(({ role }) => roles.includes(role));
    return matched?.route ?? DEFAULT_DASHBOARD_ROUTE;
  }
}

// ─── Factory & Singleton ──────────────────────────────────────

/**
 * Creates a new AuthService instance with optional dependency overrides.
 * Use this in unit tests to inject mock dependencies.
 *
 * @example
 * const service = createAuthService({
 *   browserLocation: createMockBrowserLocation('/checkout'),
 * });
 */
export function createAuthService(deps?: Partial<AuthServiceDeps>): IAuthService {
  return new AuthService({
    browserLocation: deps?.browserLocation ?? defaultBrowserLocation,
  });
}

/**
 * Application singleton — use this in all production code.
 * Swap via createAuthService() in tests.
 */
export const authService: IAuthService = createAuthService();
