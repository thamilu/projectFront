import { z } from 'zod';
import { env } from '@/env';
import { logger } from '@/core/telemetry/logger';
import { REFRESH_CONFIG, DIST_LOCK_CONFIG } from './config';
import { AuthErrorCode } from './types';
import type { ExtendedJWT } from './types';
import { measurementStart, elapsedMs, sleep, extractUserFromToken, withTimeout } from './utils';

// Runtime-validated at this trust boundary — Keycloak's token endpoint is an
// external system (and may sit behind a proxy/WAF that can alter the
// response), so a TypeScript interface alone doesn't guarantee the parsed
// JSON actually matches KeycloakTokenResponse. This directly closes the
// failure mode where an unvalidated data.expires_in becomes NaN in
// expiresAt, which isTokenValid() would then treat as permanently expired —
// triggering a refresh attempt on every subsequent request for that user.
const KeycloakTokenResponseSchema = z.object({
  access_token: z.string().min(1),
  expires_in: z.number(),
  refresh_token: z.string().optional(),
  id_token: z.string().optional(),
  token_type: z.string().optional(),
  error: z.string().optional(),
  error_description: z.string().optional(),
});

// ─── Security Guard ────────────────────────────────────────────────────────────
// This file directly references env.KEYCLOAK_CLIENT_SECRET. Relying solely on
// lib/auth/index.ts's own guard means nothing here stops a future accidental
// import from a client boundary. The 'server-only' package isn't installed in
// this project (see lib/auth/index.ts's guard comment for why), so this is
// the same runtime backstop applied independently, per-file, to every module
// that directly touches a secret — not just at the single entry point.
if (typeof window !== 'undefined') {
  throw new Error(
    '[SECURITY] Token refresh module must only run on the server. ' +
      'Do not import lib/auth/token-refresh in client components.'
  );
}

// ─── Concurrent Refresh Lock (Process-Local) ─────────────────────────────────

const refreshLocks = new Map<string, Promise<ExtendedJWT>>();

// ─── Token Refresh ────────────────────────────────────────────────────────────

/**
 * Refreshes Keycloak access token using refresh token.
 *
 * Implements resilience patterns (see REFRESH_CONFIG in config.ts for the
 * live values — deliberately not restated as numbers here, since a hardcoded
 * count/duration in a docstring silently goes stale the moment the config
 * changes, which is exactly what happened to this comment previously):
 * - Exponential backoff with jitter, up to REFRESH_CONFIG.MAX_RETRIES attempts
 * - REFRESH_CONFIG.TIMEOUT_MS timeout per request via AbortController
 * - Only retries on 5xx server errors; 4xx errors are terminal
 * - Sanitized error logging (no PII)
 *
 * @param token - Current JWT token with refresh token
 * @returns Refreshed token or error state
 */
async function refreshAccessToken(token: ExtendedJWT): Promise<ExtendedJWT> {
  if (token.error || !token.refreshToken) {
    return {
      ...token,
      accessToken: '',
      refreshToken: '',
      expiresAt: 0,
      error: token.error || AuthErrorCode.REFRESH_TOKEN_ERROR,
    };
  }

  const startTime = measurementStart();
  const url = `${env.KEYCLOAK_ISSUER}/protocol/openid-connect/token`;

  for (let attempt = 0; attempt < REFRESH_CONFIG.MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REFRESH_CONFIG.TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: env.KEYCLOAK_CLIENT_ID,
          client_secret: env.KEYCLOAK_CLIENT_SECRET,
          grant_type: 'refresh_token',
          refresh_token: token.refreshToken,
        }),
        signal: controller.signal,
      });

      // Classify by HTTP status first, independent of whether the body parses
      // as JSON — an intermediary proxy/WAF/CDN returning an HTML error page
      // during an infrastructure incident would otherwise throw a SyntaxError
      // here, fall into the generic catch below, and consume a full retry
      // cycle with backoff before reaching the same terminal outcome a
      // status-first check would have reached immediately.
      let rawBody: unknown;
      try {
        rawBody = await response.json();
      } catch (parseError) {
        logger.warn('[Auth] Non-JSON response from Keycloak token endpoint', {
          status: response.status,
          error: parseError instanceof Error ? parseError.message : String(parseError),
        });
        if (response.status >= 400 && response.status < 500) {
          return { ...token, error: AuthErrorCode.REFRESH_TOKEN_ERROR };
        }
        throw new Error(`Keycloak returned non-JSON response: ${response.status}`);
      }

      if (!response.ok) {
        // Error-response bodies only need two optional string fields read —
        // no strict schema required for this branch (unlike the success
        // path below, nothing here drives a numeric expiry computation).
        const errorBody = rawBody as { error?: unknown; error_description?: unknown };

        // Don't retry client errors (invalid refresh token, revoked session, etc.)
        if (response.status >= 400 && response.status < 500) {
          logger.warn('[Auth] Token refresh rejected by Keycloak', {
            status: response.status,
            error: errorBody.error,
          });
          return {
            ...token,
            accessToken: '',
            refreshToken: '',
            expiresAt: 0,
            error: AuthErrorCode.REFRESH_TOKEN_ERROR,
          };
        }

        // Retry server errors
        throw new Error(`Keycloak returned ${response.status}: ${errorBody.error_description}`);
      }

      // A 200 status is not proof the body matches the expected shape — an
      // unvalidated expires_in would become NaN in expiresAt below, which
      // isTokenValid() would then treat as always-expired, triggering a
      // refresh attempt (and a Keycloak call) on every subsequent request
      // for this user until the refresh token is separately invalidated.
      const parsed = KeycloakTokenResponseSchema.safeParse(rawBody);
      if (!parsed.success) {
        logger.error('[Auth] Malformed success response from Keycloak token endpoint', {
          issues: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
        });
        return { ...token, error: AuthErrorCode.REFRESH_TOKEN_ERROR };
      }
      const data = parsed.data;

      if (!data.refresh_token) {
        logger.warn(
          '[Auth] Keycloak did not return rotated refresh token — token rotation may be disabled'
        );
      }

      // Success — extract user data from new token
      const userData = extractUserFromToken(data.access_token, token);

      const refreshed: ExtendedJWT = {
        ...token,
        ...userData,
        sub: userData.userId ?? token.sub, // Ensure sub is preserved/updated
        accessToken: data.access_token,
        refreshToken: data.refresh_token ?? token.refreshToken,
        expiresAt: Math.floor(Date.now() / 1000) + data.expires_in,
        idToken: data.id_token,
        error: undefined, // Clear any previous errors
        identityHealAttempted: false, // New access token — give it a fresh heal attempt
      };

      logger.debug('[Auth] Token refreshed successfully', {
        durationMs: elapsedMs(startTime),
        expiresIn: data.expires_in,
        roleCount: refreshed.roles?.length ?? 0,
      });

      return refreshed;
    } catch (error: unknown) {
      const isLastAttempt = attempt === REFRESH_CONFIG.MAX_RETRIES - 1;

      if (error instanceof Error && error.name === 'AbortError') {
        logger.warn('[Auth] Token refresh timeout', { attempt: attempt + 1 });
      } else {
        logger.error('[Auth] Token refresh failed', {
          attempt: attempt + 1,
          error: error instanceof Error ? error.message : String(error),
        });
      }

      if (isLastAttempt) {
        return { ...token, error: AuthErrorCode.REFRESH_TOKEN_ERROR };
      }

      // Exponential backoff with jitter
      const delay = REFRESH_CONFIG.BASE_DELAY_MS * Math.pow(2, attempt) + Math.random() * 1000;

      await sleep(delay);
    } finally {
      clearTimeout(timeout);
    }
  }

  return { ...token, error: AuthErrorCode.REFRESH_TOKEN_ERROR };
}

// ─── Distributed Lock (Optional, Upstash Redis) ──────────────────────────────
/**
 * Extends the process-local lock below across multiple instances (Vercel
 * serverless functions, Kubernetes pods) when Upstash Redis is configured.
 * Dynamically imported and entirely optional — silently falls back to
 * process-local-only coalescing if UPSTASH_REDIS_REST_URL/TOKEN aren't set,
 * matching the graceful-degradation pattern already established in
 * shared/utils/rate-limit.ts (dynamic import, `unknown`-cast surface —
 * this project's local @upstash/redis type stub doesn't declare the
 * NX/PX-option overload of `set`, so it's cast the same way here).
 *
 * Design: acquire a short-lived mutex (SET NX PX) keyed per-user before
 * calling Keycloak. An instance that loses the race polls a short-lived
 * result cache instead of racing Keycloak with the same refresh token —
 * which would otherwise fail with invalid_grant once the winning instance's
 * call consumes it (Keycloak refresh-token rotation is single-use). If the
 * wait times out or yields nothing, it falls back to refreshing
 * independently rather than hanging indefinitely.
 *
 * SECURITY: the refreshed token (including the new access/refresh tokens)
 * is cached in Redis for DIST_RESULT_TTL_MS only, purely so a losing
 * instance can read it instead of making its own Keycloak call. Upstash is
 * already trusted infrastructure in this codebase (see
 * shared/utils/rate-limit.ts); the TTL is kept short to minimize the
 * exposure window for those secrets sitting in Redis.
 */
interface DistributedLockClient {
  set: (key: string, value: string, opts: { px: number; nx?: true }) => Promise<'OK' | null>;
  get: (key: string) => Promise<string | null>;
  del: (key: string) => Promise<number>;
}

const DIST_LOCK_TTL_MS = REFRESH_CONFIG.TIMEOUT_MS * REFRESH_CONFIG.MAX_RETRIES + 3_000;
const DIST_RESULT_TTL_MS = 10_000;
const DIST_WAIT_POLL_MS = 150;

let upstashRedis: DistributedLockClient | null | undefined = undefined; // undefined = not attempted yet

async function getUpstashRedis(): Promise<DistributedLockClient | null> {
  if (upstashRedis !== undefined) return upstashRedis;

  try {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (
      !url ||
      !token ||
      url.includes('placeholder') ||
      token.includes('placeholder') ||
      url.includes('example.com')
    ) {
      upstashRedis = null;
      return null;
    }

    const { Redis } = await import('@upstash/redis');
    const client = new (Redis as unknown as {
      new (opts: { url: string; token: string }): unknown;
    })({ url, token });

    const typedClient = client as unknown as {
      set: (k: string, v: string, o: { px: number; nx?: true }) => Promise<'OK' | null>;
      get: (k: string) => Promise<string | null>;
      del: (...keys: string[]) => Promise<number>;
    };

    const resolved: DistributedLockClient = {
      set: typedClient.set.bind(typedClient),
      get: typedClient.get.bind(typedClient),
      del: (key: string) => typedClient.del(key),
    };
    upstashRedis = resolved;
    return resolved;
  } catch (err) {
    logger.warn(
      '[Auth] Upstash Redis unavailable for distributed refresh lock — using process-local lock only',
      { error: err instanceof Error ? err.message : String(err) }
    );
    upstashRedis = null;
    return null;
  }
}

const distLockKey = (lockKey: string) => `auth:refresh:lock:${lockKey}`;
const distResultKey = (lockKey: string) => `auth:refresh:result:${lockKey}`;

async function waitForDistributedResult(
  redis: DistributedLockClient,
  lockKey: string,
  deadline: number
): Promise<ExtendedJWT | null> {
  while (Date.now() < deadline) {
    await sleep(DIST_WAIT_POLL_MS);
    try {
      const cached = await withTimeout(
        redis.get(distResultKey(lockKey)),
        DIST_LOCK_CONFIG.REQUEST_TIMEOUT_MS,
        'Redis get(result) timed out'
      );
      if (cached) return JSON.parse(cached) as ExtendedJWT;

      // Lock released with no result cached means the winning instance
      // failed (or its write raced past the TTL) — stop waiting rather
      // than spinning until our own deadline.
      const stillLocked = await withTimeout(
        redis.get(distLockKey(lockKey)),
        DIST_LOCK_CONFIG.REQUEST_TIMEOUT_MS,
        'Redis get(lock) timed out'
      );
      if (!stillLocked) return null;
    } catch {
      return null; // Redis hiccup mid-wait — fall back to an independent refresh
    }
  }
  return null;
}

async function refreshAccessTokenDistributed(
  redis: DistributedLockClient,
  lockKey: string,
  token: ExtendedJWT
): Promise<ExtendedJWT> {
  let acquired = false;
  // Distinguishes "we positively confirmed via Redis that another instance
  // holds the lock" from "we couldn't even ask Redis" — set(nx) resolving
  // successfully with a non-'OK' result is the former; set(nx) throwing
  // (timeout, unreachable host, e.g. a placeholder UPSTASH_REDIS_REST_URL
  // that passes env validation but isn't a real endpoint) is the latter.
  // Only the former is a real signal that waiting for a result could ever
  // pay off — the latter has no such signal, since a subsequent get() call
  // against the same broken Redis would itself just fail after burning
  // another full DIST_LOCK_CONFIG.REQUEST_TIMEOUT_MS for nothing.
  let lockCheckFailed = false;
  try {
    const res = await withTimeout(
      redis.set(distLockKey(lockKey), '1', { nx: true, px: DIST_LOCK_TTL_MS }),
      DIST_LOCK_CONFIG.REQUEST_TIMEOUT_MS,
      'Redis set(lock) timed out'
    );
    acquired = res === 'OK';
  } catch (err) {
    lockCheckFailed = true;
    logger.warn('[Auth] Distributed lock acquisition failed — refreshing independently', {
      lockKey,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  if (!acquired && !lockCheckFailed) {
    logger.info('[Auth] Another instance is refreshing this token — waiting for its result', {
      lockKey,
    });
    const result = await waitForDistributedResult(redis, lockKey, Date.now() + DIST_LOCK_TTL_MS);
    if (result) return result;
    logger.warn(
      '[Auth] Distributed lock wait timed out or yielded no result — refreshing independently',
      { lockKey }
    );
  }

  try {
    const result = await refreshAccessToken(token);
    if (acquired && !result.error) {
      try {
        await withTimeout(
          redis.set(distResultKey(lockKey), JSON.stringify(result), {
            px: DIST_RESULT_TTL_MS,
          }),
          DIST_LOCK_CONFIG.REQUEST_TIMEOUT_MS,
          'Redis set(result) timed out'
        );
      } catch (err) {
        logger.warn('[Auth] Failed to publish refresh result to distributed cache', {
          lockKey,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
    return result;
  } finally {
    if (acquired) {
      try {
        await withTimeout(
          redis.del(distLockKey(lockKey)),
          DIST_LOCK_CONFIG.REQUEST_TIMEOUT_MS,
          'Redis del(lock) timed out'
        );
      } catch {
        // Best-effort — the lock's own PX TTL guarantees eventual release
      }
    }
  }
}

// ─── Lock-Protected Refresh ───────────────────────────────────────────────────

/**
 * Coalesces concurrent token refreshes into a single result.
 *
 * This prevents the "refresh stampede" where multiple simultaneous requests
 * each attempt to refresh the same token independently. When Keycloak's
 * refresh token rotation is enabled (single-use tokens), a stampede causes
 * N-1 refreshes to fail with `invalid_grant`.
 *
 * Two layers: a process-local in-memory Map (always active, coalesces
 * concurrent calls within one Node.js process for free) and, when
 * UPSTASH_REDIS_REST_URL/TOKEN are configured, a distributed mutex + result
 * cache (see refreshAccessTokenDistributed above) that extends the same
 * protection across multiple instances (Kubernetes pods, Vercel serverless
 * functions). Without Redis configured, only the process-local layer
 * applies — see that function's docstring for the multi-instance failure
 * mode this closes.
 */
export async function refreshAccessTokenWithLock(token: ExtendedJWT): Promise<ExtendedJWT> {
  if (token.error || !token.refreshToken) {
    return token;
  }

  const lockKey = token.userId || token.refreshToken.slice(-8);

  const inflight = refreshLocks.get(lockKey);
  if (inflight) {
    logger.info('[Auth] Reusing concurrent token refresh operation', { lockKey });
    return inflight;
  }

  // No `await` between the get() check above and the set() below — the
  // Redis lookup happens inside resolveRefresh's own async body instead of
  // here, so this function's synchronous prefix runs to completion (get →
  // build promise → set) without yielding to the event loop. That's what
  // makes the process-local coalescing atomic: a "concurrent" caller can
  // only ever observe the Map either before this entry exists or after,
  // never mid-write.
  const refreshPromise = resolveRefresh(lockKey, token).finally(() => {
    refreshLocks.delete(lockKey);
  });

  refreshLocks.set(lockKey, refreshPromise);
  return refreshPromise;
}

async function resolveRefresh(lockKey: string, token: ExtendedJWT): Promise<ExtendedJWT> {
  const redis = await getUpstashRedis();
  return redis ? refreshAccessTokenDistributed(redis, lockKey, token) : refreshAccessToken(token);
}
