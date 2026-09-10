// ============================================================
// features/auth/hooks/use-auth.ts
// React hook consuming IAuthService with AuthResult handling.
// Provides loading, error, and session state to components.
//
// Context-backed: AuthStateProvider computes AuthState ONCE and every
// useAuth() call reads that single shared instance, rather than each of
// the app's ~10 consumers independently deriving it (and, more importantly,
// independently owning isLoggingIn/loginError/etc. — auth actions are
// singleton by nature, since only one sign-in/sign-out flow can actually be
// in flight at a time; two independent button instances racing their own
// local state could both fire login() concurrently with no knowledge of
// each other). AuthStateProvider is mounted in
// core/providers/provider-registry.tsx, inside NextAuthProvider.
// ============================================================

'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { UserRole } from '@/domains/auth/contracts/auth.types';
import { useSession } from 'next-auth/react';
import { logger } from '@/core/telemetry/logger';

import { authService as defaultAuthService } from '../services/auth-service';
import { AUTH_SERVICE_CONFIG } from '../services/auth-service.config';
import { isAuthFailure } from '../services/auth-result.types';
import type { AuthError } from '../services/auth-result.types';
import type { AuthProvider as AuthProviderId } from '../services/auth.constants';
import type { IAuthService } from '../services/auth-service.interface';
import { sanitizeCallbackUrl } from '../utils/sanitize-callback-url';
import { AuthErrorCode } from '@/lib/auth/types';

// ─── Session-Level Error Messages ──────────────────────────────
//
// session.error (AuthErrorCode) is this app's own enum, set by the
// JWT/session callbacks when something goes wrong on an otherwise-active
// session (e.g. token refresh failing) — a different mechanism, and a
// different point in time, than the NextAuth redirect-flow ?error= codes
// NEXT_AUTH_ERROR_MESSAGES/useErrorMessage already handle (lib/auth/constants.ts).
// Without this map, the raw enum value (e.g. "RefreshAccessTokenError")
// would flow straight into the combined `error` string below and out to
// whatever renders it — ModernAuthUI.tsx does exactly that, unsanitized,
// via a toast. (Also worth knowing: core/providers/NextAuthProvider.tsx's
// SessionErrorHandler already force-signs-out the moment session.error
// appears, so this message is typically only visible for the brief window
// before that redirect completes — still worth translating correctly.)

const SESSION_ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  [AuthErrorCode.REFRESH_TOKEN_ERROR]: 'Your session has expired. Please sign in again.',
  [AuthErrorCode.INVALID_KEYCLOAK_RESPONSE]:
    'There was a problem communicating with the authentication server. Please try again.',
  [AuthErrorCode.MISSING_USER_ID]: 'Your account could not be identified. Please sign in again.',
  [AuthErrorCode.CALLBACK_ERROR]: 'Something went wrong while completing sign-in. Please try again.',
  [AuthErrorCode.MALFORMED_TOKEN]: 'Your session is invalid. Please sign in again.',
  [AuthErrorCode.INTERNAL_SERVER_ERROR]: 'An unexpected error occurred. Please try again.',
};

const DEFAULT_SESSION_ERROR_MESSAGE = 'An authentication error occurred. Please sign in again.';

/**
 * Explicit public contract for useAuth() — reviewed and versioned as an
 * API, not left to type inference. Consumers can import this directly for
 * prop typing, context typing, or mock construction in tests.
 */
export interface AuthState {
  readonly user: ReturnType<typeof useSession>['data'] extends { user: infer U } | null
    ? U | null
    : null;
  readonly isLoading: boolean;
  readonly isAuthenticated: boolean;

  /**
   * Initiates login. Never throws — observe the return value and/or
   * `loginError` for failure details.
   * @returns true on success, false on failure.
   */
  readonly login: (
    callbackUrl?: string,
    provider?: AuthProviderId,
    idpHint?: string
  ) => Promise<boolean>;
  /**
   * Initiates logout. Never throws — observe the return value and/or
   * `logoutError` for failure details. Matches login()'s contract.
   * @returns true on success, false on failure.
   */
  readonly logout: (callbackUrl?: string) => Promise<boolean>;
  /**
   * Forces a server round-trip that re-runs the session callback (picking
   * up a refreshed access token, updated roles, etc.) AND updates this
   * tab's own session state. Deduplicates concurrent calls.
   *
   * @param data - Optional custom payload forwarded to next-auth's
   *   `update()`, reaching the JWT callback as `trigger === 'update'` with
   *   this as its `session` argument — e.g. useSellerSessionSync passes
   *   `{ forceSync: true, timestamp }` to force a role re-sync after a
   *   seller application is approved. Omit for a plain "get me a fresh
   *   session."
   * @returns true if a session was returned, false otherwise.
   */
  readonly refreshSession: (data?: Record<string, unknown>) => Promise<boolean>;

  readonly hasRole: (role: UserRole | string) => boolean;
  readonly hasAnyRole: (roles: readonly (UserRole | string)[]) => boolean;
  readonly isSeller: boolean;
  readonly isCustomer: boolean;
  readonly isDeliveryAgent: boolean;

  /** Combined convenience message — never a raw provider/internal error code, always curated text. */
  readonly error: string | null;
  readonly loginError: AuthError | null;
  readonly logoutError: AuthError | null;

  readonly isLoggingIn: boolean;
  readonly isLoggingOut: boolean;
  readonly clearLoginError: () => void;
  readonly clearLogoutError: () => void;

  /** Epoch-derived expiry of the current session, or null if unknown/unauthenticated. */
  readonly sessionExpiresAt: Date | null;
  /** True once within AUTH_SERVICE_CONFIG.sessionExpiryWarningBufferSeconds of expiry. */
  readonly isSessionExpiring: boolean;
  /** True once sessionExpiresAt has passed. */
  readonly isSessionExpired: boolean;
}

/**
 * Core implementation — computes AuthState from useSession() + the given
 * IAuthService. Not exported: AuthStateProvider is the only intended
 * caller in production (once, at the provider boundary); tests call it
 * indirectly too, via AuthStateProvider's serviceOverride prop, not by
 * importing this function directly.
 */
function useAuthInternal(service: IAuthService = defaultAuthService): AuthState {
  const { data: session, status, update } = useSession();

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [loginError, setLoginError] = useState<AuthError | null>(null);
  const [logoutError, setLogoutError] = useState<AuthError | null>(null);
  const isRefreshingRef = useRef(false);

  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';
  const user = session?.user || null;

  // Single source of truth for roles. session.user.roles and session.roles
  // are always the same value in this app — both are populated from the
  // same extToken.roles in lib/auth/index.ts's session() callback and
  // lib/auth/handlers.ts's buildSessionUser() — so reading only
  // session.roles isn't a fallback gap, just the one real source instead
  // of a confusing "check two places" pattern.
  const sessionRoles = useMemo(() => session?.roles ?? [], [session]);

  const login = useCallback(
    // idpHint: requests a specific social/platform IdP brokered through
    // Keycloak (e.g. 'google') — see IAuthFlowService.initiateLogin's docs.
    async (callbackUrl?: string, provider?: AuthProviderId, idpHint?: string): Promise<boolean> => {
      // Read the current path imperatively at call time rather than via a
      // reactive usePathname() subscription — the hook only needs this as
      // a default value for THIS call, not for every render on every
      // navigation in the app (usePathname() would re-render every
      // consumer of useAuth() on every route change for no benefit here).
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
      // Sanitized here, not just trusted from the caller — ModernAuthUI.tsx
      // already proved a caller can apply sanitizeCallbackUrl to one use of
      // a value (its post-auth router.push target) and forget it for
      // another (this login() call) using the very same prop. This is the
      // single enforced choke point regardless of what callers remember.
      const safeCallbackUrl = sanitizeCallbackUrl(callbackUrl, currentPath);

      setIsLoggingIn(true);
      setLoginError(null);
      try {
        const result = await service.initiateLogin(safeCallbackUrl, provider, idpHint);
        if (isAuthFailure(result)) {
          setLoginError(result.error);
          return false;
        }
        return true;
      } finally {
        setIsLoggingIn(false);
      }
    },
    [service]
  );

  const logout = useCallback(
    async (callbackUrl?: string): Promise<boolean> => {
      setIsLoggingOut(true);
      setLogoutError(null);
      try {
        const result = await service.initiateLogout(callbackUrl);
        if (isAuthFailure(result)) {
          setLogoutError(result.error);
          return false;
        }
        return true;
      } finally {
        setIsLoggingOut(false);
      }
    },
    [service]
  );

  const hasRole = useCallback(
    (role: UserRole | string) => sessionRoles.includes(role),
    [sessionRoles]
  );

  const hasAnyRole = useCallback(
    (roles: readonly (UserRole | string)[]) => roles.some((r) => sessionRoles.includes(r)),
    [sessionRoles]
  );

  const isSeller = useMemo(() => sessionRoles.includes(UserRole.SELLER), [sessionRoles]);
  const isCustomer = useMemo(() => sessionRoles.includes(UserRole.CUSTOMER), [sessionRoles]);
  const isDeliveryAgent = useMemo(
    () => sessionRoles.includes(UserRole.DELIVERY_AGENT),
    [sessionRoles]
  );

  const clearLoginError = useCallback(() => setLoginError(null), []);
  const clearLogoutError = useCallback(() => setLogoutError(null), []);

  /**
   * Forces a server round-trip that re-runs the session callback and
   * updates THIS tab's own session state.
   *
   * Deliberately calls next-auth's update(), not getSession(): both hit
   * the same /api/auth/session endpoint and both trigger the server-side
   * refresh, but getSession() only broadcasts to OTHER tabs — it does not
   * update the current tab's own useSession() state (verified against
   * next-auth's SessionProvider implementation), so a component reading
   * `session` right after calling it would still see stale data. update()
   * updates this tab's context state directly.
   */
  const refreshSession = useCallback(
    async (data?: Record<string, unknown>): Promise<boolean> => {
      if (isRefreshingRef.current) {
        logger.debug('Session refresh already in progress — skipping duplicate call');
        return false;
      }
      isRefreshingRef.current = true;
      try {
        const updated = await update(data);
        return updated != null;
      } catch (error) {
        logger.error('Session refresh failed', {
          error: error instanceof Error ? error.message : String(error),
        });
        return false;
      } finally {
        isRefreshingRef.current = false;
      }
    },
    [update]
  );

  const sessionErrorMessage = session?.error
    ? (SESSION_ERROR_MESSAGES[session.error] ?? DEFAULT_SESSION_ERROR_MESSAGE)
    : null;

  const sessionExpiresAt = session?.expiresAt ? new Date(session.expiresAt * 1000) : null;
  const msUntilExpiry = sessionExpiresAt ? sessionExpiresAt.getTime() - Date.now() : null;
  const isSessionExpired = msUntilExpiry !== null && msUntilExpiry <= 0;
  const isSessionExpiring =
    msUntilExpiry !== null &&
    msUntilExpiry > 0 &&
    msUntilExpiry < AUTH_SERVICE_CONFIG.sessionExpiryWarningBufferSeconds * 1000;

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    hasRole,
    hasAnyRole,
    // Never a raw provider/internal error code — sessionErrorMessage is
    // pre-translated above; loginError.message is already curated by
    // auth-service.ts's AR.fail() call sites.
    error: sessionErrorMessage ?? loginError?.message ?? null,
    isSeller,
    isCustomer,
    isDeliveryAgent,
    refreshSession,
    isLoggingIn,
    isLoggingOut,
    loginError,
    logoutError,
    clearLoginError,
    clearLogoutError,
    sessionExpiresAt,
    isSessionExpiring,
    isSessionExpired,
  };
}

// ─── Context ────────────────────────────────────────────────

const AuthContext = createContext<AuthState | undefined>(undefined);

export interface AuthStateProviderProps {
  children: ReactNode;
  /**
   * Overrides the real authService singleton — for tests only (render this
   * provider directly in a test's `wrapper`, injecting a mocked
   * IAuthService, instead of `jest.mock()`-ing the whole module). Never
   * pass this in production code; omitting it uses the real singleton,
   * which is correct for every real page.
   */
  serviceOverride?: IAuthService;
}

/**
 * Computes AuthState ONCE and shares it via context. Mount near the app
 * root — see core/providers/provider-registry.tsx, positioned right after
 * NextAuthProvider (this depends on useSession(), which depends on
 * next-auth's own SessionProvider being an ancestor).
 */
export function AuthStateProvider({ children, serviceOverride }: AuthStateProviderProps) {
  const state = useAuthInternal(serviceOverride);
  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

/**
 * Enterprise Authentication Hook (Business Abstraction)
 *
 * This hook is the single source of truth for authentication state across the application.
 * It provides a domain-friendly API while abstracting away NextAuth/Keycloak specifics.
 *
 * Requires <AuthStateProvider> as an ancestor (mounted once at the app
 * root — see provider-registry.tsx). Throws immediately, rather than
 * silently computing an unshared local instance, if that's missing: a
 * silent fallback would mean two different components could each get
 * their own independent isLoggingIn/loginError state and race each other
 * into calling login() concurrently with no knowledge of one another —
 * exactly the failure mode this Provider exists to prevent. A missing
 * provider is a wiring bug that should fail loudly in development, not
 * degrade quietly into working-but-wrong behavior.
 */
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error(
      'useAuth() must be used within <AuthStateProvider>. ' +
        'AuthStateProvider is mounted in core/providers/provider-registry.tsx — ' +
        "if you're seeing this, check that the calling component actually " +
        "renders inside the app's root <Providers> tree (app/providers.tsx), " +
        "e.g. it isn't rendered via a portal outside React's tree."
    );
  }
  return ctx;
}
