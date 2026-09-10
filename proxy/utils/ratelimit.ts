import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { env } from '@/env';
import { logger } from '@/shared/utils/logger.edge';
import { RATE_LIMIT_RULES } from '../config/rate-limit.config';

const limiters = new Map<string, Ratelimit>();

// Logged at most once per runtime instance so an unconfigured deployment
// doesn't spam every unauthenticated request into the logs/Sentry.
let warnedUnconfigured = false;

function isUpstashConfigured(): boolean {
  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;
  const configured = !!(
    url &&
    token &&
    !url.includes('placeholder') &&
    !token.includes('placeholder')
  );

  // `scripts/validate-env.ts` (check:env) fails the build in production/staging
  // when this is unconfigured, unless explicitly overridden via
  // ALLOW_UNRATELIMITED_DEPLOY=true. This is a runtime backstop for any
  // deployment path that skips check:env — silence here previously meant
  // /api/auth and /seller/register had zero brute-force protection with no
  // signal anywhere that it had happened.
  if (!configured && !warnedUnconfigured) {
    warnedUnconfigured = true;
    logger.warn('Rate limiting is disabled — Upstash Redis is not configured', {
      component: 'proxy:ratelimit',
      environment: env.NODE_ENV,
    });
  }

  return configured;
}

/**
 * Retrieves the appropriate rate limiter instance for the given request pathname.
 * Automatically initializes and caches the limiter based on the configured rate limits.
 */
export function getRatelimitForPath(
  pathname: string
): { limiter: Ratelimit; identifierType: 'ip' | 'ip+path' } | null {
  const rule = RATE_LIMIT_RULES.find((r) => pathname.startsWith(r.prefix));
  if (!rule || !isUpstashConfigured()) return null;

  const key = `${rule.requests}:${rule.window}`;
  if (!limiters.has(key)) {
    try {
      const redisInstance = Redis.fromEnv();
      const slidingWindowLimiter = (
        Ratelimit as unknown as {
          slidingWindow: (requests: number, window: string) => unknown;
        }
      ).slidingWindow(rule.requests, rule.window) as ConstructorParameters<
        typeof Ratelimit
      >[0]['limiter'];

      const ratelimitInstance = new Ratelimit({
        redis: redisInstance,
        limiter: slidingWindowLimiter,
        analytics: true,
        prefix: `ratelimit:${key}`,
      });
      limiters.set(key, ratelimitInstance);
    } catch (error) {
      logger.error('Rate limiter initialization failed', {
        component: 'proxy:ratelimit-initializer',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  return {
    limiter: limiters.get(key)!,
    identifierType: rule.identifier,
  };
}
