// ============================================================
// features/auth/services/auth-service.interface.ts
// Public contract for the AuthService.
// All consumers depend on this interface, not the implementation.
//
// Segregated into focused sub-interfaces (ISP) so a consumer that only
// needs one slice — e.g. a <RoleGate> component needing IPermissionService
// only — can depend on and mock just that surface, rather than the full
// AuthService contract. IAuthService composes all of them for the single
// DI/injection point the implementation and singleton actually use.
// ============================================================

import type { NormalizedSession, UserRole } from '@/domains/auth/contracts/auth.types';
import type { AuthResult } from './auth-result.types';
import type { AuthProvider } from './auth.constants';

// ─── Session ────────────────────────────────────────────────

export interface ISessionService {
  /**
   * Returns the validated, normalized current user session.
   * Returns null if no session exists or validation fails.
   * Never throws.
   */
  getNormalizedSession(): Promise<NormalizedSession | null>;

  /**
   * Clears the in-memory session cache immediately, forcing the next
   * getNormalizedSession() call to fetch fresh rather than serve a
   * (potentially stale) cached value. Also broadcasts to other open tabs.
   * initiateLogout() already calls this internally; exposed publicly for
   * callers that mutate session-affecting state through a path other than
   * this service (e.g. a role/profile update) and need to force a
   * re-fetch before the TTL naturally expires.
   */
  invalidateSession(): void;
}

// ─── Auth Flows ─────────────────────────────────────────────

export interface IAuthFlowService {
  /**
   * Initiates the sign-in flow for the given provider.
   * Returns AuthResult — success or typed failure, never throws.
   *
   * "Success" means the pre-redirect exchange with the auth provider
   * completed without error and the browser is now being navigated to
   * either the IdP's login page or the resolved callback URL — not that
   * authentication has fully completed (that's only observable after the
   * user returns from the IdP and a fresh session is fetched).
   *
   * @param idpHint - Requests a specific upstream identity provider
   *   brokered through Keycloak (e.g. 'google'), via Keycloak's
   *   `kc_idp_hint` authorization parameter. This is how social/platform
   *   logins (Google, etc.) are requested in this app — NOT via the
   *   `provider` param, which stays 'keycloak' either way. See
   *   AUTH_PROVIDERS in auth.constants.ts for why.
   */
  initiateLogin(callbackUrl?: string, provider?: AuthProvider, idpHint?: string): Promise<AuthResult>;

  /**
   * Initiates the sign-out flow with optional redirect.
   * Returns AuthResult — success or typed failure, never throws.
   * See initiateLogin() for what "success" guarantees.
   */
  initiateLogout(callbackUrl?: string): Promise<AuthResult>;
}

// ─── Permission Checks ──────────────────────────────────────

/**
 * ⚠️ UI-GATING ONLY. These checks run entirely client-side against
 * client-visible role data and are trivially bypassable (devtools, a
 * fabricated array, editing component state). They exist to show/hide UI,
 * never to enforce it. Every protected action or API route MUST enforce
 * authorization independently, server-side — never rely on these as the
 * actual trust boundary.
 */
export interface IPermissionService {
  /**
   * Returns true if user has AT LEAST ONE required role (OR logic).
   * Returns true when requiredRoles is empty.
   */
  checkPermissions(userRoles: UserRole[], requiredRoles: UserRole[]): boolean;

  /**
   * Returns true if user has ALL required roles (AND logic).
   * Returns true when requiredRoles is empty.
   */
  checkAllPermissions(userRoles: UserRole[], requiredRoles: UserRole[]): boolean;

  /**
   * Returns true if user has NONE of the denied roles (NOT logic).
   * Returns true (allow) when deniedRoles is empty.
   */
  checkDeniedPermissions(userRoles: UserRole[], deniedRoles: UserRole[]): boolean;
}

// ─── Routing ────────────────────────────────────────────────

export interface IRoutingService {
  /**
   * Resolves the highest-priority dashboard route for given roles.
   * Returns DEFAULT_DASHBOARD_ROUTE when no roles match — see that
   * constant's docs in role-dashboard-map.ts before calling this FROM the
   * page DEFAULT_DASHBOARD_ROUTE itself points at; doing so self-redirects.
   */
  resolveDashboardRoute(roles: UserRole[]): string;
}

// ─── Composed Contract ──────────────────────────────────────

/**
 * Public contract for authentication operations.
 *
 * Design principles:
 * - All async methods return AuthResult — never throw to callers
 * - Permission parameters are strictly typed as UserRole[]
 * - Provider is injectable per call (see AUTH_PROVIDERS in auth.constants.ts);
 *   there is deliberately no provider-discovery method since this app only
 *   ever configures/uses a single provider (Keycloak) end-to-end today
 */
export interface IAuthService
  extends ISessionService,
    IAuthFlowService,
    IPermissionService,
    IRoutingService {}
