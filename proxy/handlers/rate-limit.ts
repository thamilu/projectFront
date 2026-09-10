import type { NextRequest, NextResponse } from 'next/server';
import { NextResponse as NR } from 'next/server';
import { getTrustedIp } from '@/proxy/utils/ip';
import { logger } from '@/shared/utils/logger.edge';
import type { Ratelimit } from '@upstash/ratelimit';

/**
 * Handles rate limiting logic for the incoming request.
 * If the limit is exceeded, returns a 429 response with Retry-After headers.
 * Rejects requests with unknown origins in production with 400.
 */
export async function applyRateLimit(
  req: NextRequest,
  ratelimit: Ratelimit,
  pathname: string,
  identifierType: 'ip' | 'ip+path'
): Promise<NextResponse | null> {
  const ip = getTrustedIp(req);

  if (ip === 'unknown') {
    logger.warn('Request with unknown IP — rejecting origin', {
      component: 'proxy:rateLimit',
    });
    return NR.json(
      { code: 'ORIGIN_UNKNOWN', message: 'Unable to verify request origin' },
      { status: 400 }
    );
  }

  // Define the tracking identifier key (differentiate auth routes with ip+path)
  const identifier = identifierType === 'ip+path' ? `${ip}:${pathname}` : ip;

  try {
    const { success, limit, remaining, reset } = await ratelimit.limit(identifier);

    if (!success) {
      const resetDiffMs = reset - Date.now();
      const retryAfterSeconds = Math.max(1, Math.ceil(resetDiffMs / 1000));

      return NR.json(
        { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
            'Retry-After': retryAfterSeconds.toString(),
          },
        }
      );
    }
    return null;
  } catch (error: unknown) {
    logger.error('Rate limiter unavailable — failing open', {
      component: 'proxy:rateLimit',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    // Explicit fail-open to ensure service uptime when Upstash is down/unreachable
    return null;
  }
}
