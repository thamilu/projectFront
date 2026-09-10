// ============================================================
// features/auth/services/auth-service.config.ts
// Single source of truth for all AuthService configuration.
// Override via environment variables in production deployments.
// ============================================================

import { APP_ROUTES } from '@/shared/routes';
import { AUTH_PROVIDERS } from './auth.constants';
import type { AuthProvider } from './auth.constants';

export interface AuthServiceConfig {
  /** OAuth provider used for sign-in flows */
  readonly defaultProvider: AuthProvider;
  /** Seconds before expiry to flag session as expiring soon */
  readonly sessionExpiryWarningBufferSeconds: number;
  /** Default redirect URL after logout */
  readonly defaultLogoutUrl: string;
  /** Number of retry attempts for getSession() on failure */
  readonly sessionFetchRetries: number;
  /** Initial delay in milliseconds before first retry */
  readonly sessionFetchRetryDelayMs: number;
  /** Exponential backoff multiplier between retries */
  readonly sessionFetchRetryBackoff: number;
  /**
   * Upper-bound ceiling (ms) for the entire getSession() + retries sequence.
   * Bounds the "hung request that never rejects" failure mode, which retry
   * count/backoff alone cannot — those only bound the "fails fast" mode.
   */
  readonly sessionFetchTimeoutMs: number;
  /**
   * localStorage key used to broadcast session-cache invalidation across
   * browser tabs. Writing to this key fires the native `storage` event in
   * every OTHER open tab (never the writing tab, per spec), which each
   * tab's AuthService instance listens for to clear its own local cache.
   * Deliberately not tied to NextAuth's own internal broadcast channel,
   * which is undocumented/unstable across versions — this is a fully
   * independent, standard-API mechanism scoped to this service's cache only.
   */
  readonly crossTabInvalidationStorageKey: string;
}

export const AUTH_SERVICE_CONFIG: AuthServiceConfig = {
  defaultProvider: AUTH_PROVIDERS.KEYCLOAK,
  sessionExpiryWarningBufferSeconds: 60,
  defaultLogoutUrl: APP_ROUTES.HOME,
  sessionFetchRetries: 2,
  sessionFetchRetryDelayMs: 300,
  sessionFetchRetryBackoff: 2,
  sessionFetchTimeoutMs: 8000,
  crossTabInvalidationStorageKey: 'eshop:auth-service:session-invalidated',
} as const;
