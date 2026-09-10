import { env } from '@/env';

// ─── Token Refresh Configuration ──────────────────────────────────────────────
// Sourced from validated env vars (see env.ts) rather than hardcoded, so
// resilience tuning (e.g. a slower Keycloak instance needing a longer
// timeout, or a stricter SLA wanting fewer retries) is a deployment
// configuration change, not a code change. Defaults match this module's
// previous hardcoded values exactly — no behavior change unless the env
// vars are explicitly set.

// WORST-CASE LATENCY (default values): handleTokenRefreshIfNeeded calls
// refreshAccessToken synchronously and inline as part of the jwt() callback,
// which auth() awaits — so a request that lands mid-refresh blocks on this
// budget with no partial feedback to the user:
//   attempt 0 (times out)         up to TIMEOUT_MS            = 5,000ms
//   backoff before attempt 1      BASE_DELAY_MS*2^0 + jitter  =   500-1,500ms
//   attempt 1, last (times out)   up to TIMEOUT_MS            = 5,000ms
//   ------------------------------------------------------------------
//   total worst case                                          ~10.5-11.5s
// This is a deliberate latency-vs-reliability tradeoff, not an oversight —
// re-run this calculation before changing MAX_RETRIES or TIMEOUT_MS, since
// it compounds quickly. Values are runtime-configurable specifically so
// this budget can be tightened during a live Keycloak degradation without a
// redeploy. See __tests__/unit/lib/config-latency-budget.test.ts, which
// fails if a future change silently blows this budget.
export const REFRESH_CONFIG = {
  /** Maximum retry attempts for token refresh */
  MAX_RETRIES: env.AUTH_REFRESH_MAX_RETRIES,
  /** Base delay for exponential backoff (milliseconds) */
  BASE_DELAY_MS: env.AUTH_REFRESH_BASE_DELAY_MS,
  /** Per-request timeout (milliseconds) */
  TIMEOUT_MS: env.AUTH_REFRESH_TIMEOUT_MS,
  /** Proactive refresh buffer before expiry (seconds) */
  BUFFER_SECONDS: env.AUTH_REFRESH_BUFFER_SECONDS,
} as const;

// ─── Backend API Configuration ────────────────────────────────────────────────
// Mirrors REFRESH_CONFIG's shape (TIMEOUT_MS/MAX_RETRIES/BASE_DELAY_MS) even
// though today's values differ substantially — fetchUserRoleWithRetry in
// backend-role.ts previously hardcoded its own MAX_RETRIES/RETRY_DELAY_MS
// constants instead of sourcing them from here, despite this file being the
// established single location for this module's tunable resilience
// parameters. Centralized here for the same reason as REFRESH_CONFIG:
// so this is the one place to look, and the one place to change.

export const BACKEND_CONFIG = {
  /** Timeout for backend role fetch (milliseconds) */
  TIMEOUT_MS: env.AUTH_BACKEND_ROLE_TIMEOUT_MS,
  /** Maximum retry attempts for backend role fetch */
  MAX_RETRIES: env.AUTH_BACKEND_ROLE_MAX_RETRIES,
  /** Base delay between backend role fetch retries (milliseconds) */
  BASE_DELAY_MS: env.AUTH_BACKEND_ROLE_BASE_DELAY_MS,
} as const;

// ─── Distributed Refresh Lock Configuration ──────────────────────────────────
// See token-refresh.ts's getUpstashRedis()/refreshAccessTokenDistributed():
// UPSTASH_REDIS_REST_URL/TOKEN being set to a syntactically-valid-but-
// unreachable value (Zod's z.string().url() can't distinguish a real
// endpoint from a placeholder one) previously meant every request paid the
// underlying HTTP client's own default timeout — far longer than acceptable
// on jwt()'s hot path. This is a request-level bound applied around each
// Redis call, independent of whatever timeout (or lack of one) the SDK
// itself defaults to.
export const DIST_LOCK_CONFIG = {
  /** Per-request timeout for each individual Redis call (milliseconds) */
  REQUEST_TIMEOUT_MS: env.AUTH_DIST_LOCK_TIMEOUT_MS,
} as const;
