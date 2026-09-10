/**
 * Distributed idempotency for at-least-once event delivery.
 *
 * Payment providers guarantee *at-least-once* webhook delivery: Stripe retries
 * on any non-2xx response, on a timeout, and occasionally on a successful
 * delivery it failed to record. A handler that is not idempotent will therefore
 * eventually double-apply — marking an order paid twice, or applying a refund
 * twice. That is not a hypothetical; it is the documented delivery contract.
 *
 * This module provides a claim-based guard backed by Upstash Redis. The claim
 * is atomic (`SET key value NX EX ttl`), so two concurrent deliveries of the
 * same event cannot both win, even across separate serverless instances — the
 * property an in-memory `Set` cannot provide and the reason one is not used.
 *
 * @module shared/api/idempotency
 */

import { env } from '@/env';
import { logger } from '@/core/telemetry/logger';

/**
 * How long a processed event id is remembered.
 *
 * Comfortably exceeds Stripe's retry schedule, which backs off over roughly
 * three days, so a retry can never outlive the record of its first delivery.
 */
const DEFAULT_TTL_SECONDS = 4 * 24 * 60 * 60; // 4 days

/** Bounds a Redis round trip so a slow store cannot stall a webhook response. */
const REDIS_TIMEOUT_MS = 2_000;

/** Outcome of attempting to claim an event for processing. */
export type IdempotencyClaim =
  /** First time this id has been seen — the caller should process the event. */
  | { outcome: 'claimed'; release: () => Promise<void> }
  /** Already processed (or in flight elsewhere) — the caller must skip. */
  | { outcome: 'duplicate' }
  /**
   * The store is unavailable, so uniqueness could not be established.
   *
   * The caller is expected to process anyway and accept at-least-once
   * semantics. Refusing instead would convert a cache outage into dropped
   * payment events — strictly worse than a rare double-apply against a
   * backend that should itself be tolerant of replays. The degradation is
   * logged at `warn` so it is alertable.
   */
  | { outcome: 'unavailable' };

/** Minimal surface used from the Upstash client, kept dependency-light. */
interface RedisLike {
  set(
    key: string,
    value: string,
    opts: { nx: true; ex: number }
  ): Promise<string | null>;
  del(key: string): Promise<number>;
}

let redisPromise: Promise<RedisLike | null> | undefined;

/**
 * Lazily construct the Redis client, once per process.
 *
 * Returns `null` — permanently, for this process — when Upstash is not
 * configured, so an unconfigured deployment does not pay an import cost on
 * every event.
 */
function getRedis(): Promise<RedisLike | null> {
  if (redisPromise) return redisPromise;

  redisPromise = (async () => {
    const url = env.UPSTASH_REDIS_REST_URL;
    const token = env.UPSTASH_REDIS_REST_TOKEN;

    // `placeholder` values appear in the committed .env.example; treating them
    // as configured would produce a confusing connection error per event.
    if (!url || !token || url.includes('placeholder') || token.includes('placeholder')) {
      return null;
    }

    try {
      const { Redis } = await import('@upstash/redis');
      return new Redis({ url, token }) as unknown as RedisLike;
    } catch (error) {
      logger.error('[Idempotency] Failed to initialise Redis client', {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  })();

  return redisPromise;
}

/** Reject a promise that outlives `ms`, so a hung store cannot block a response. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Redis operation timed out after ${ms}ms`)), ms)
    ),
  ]);
}

/**
 * Attempt to claim `eventId` for exclusive processing.
 *
 * @param namespace Logical event source, e.g. `stripe`. Keeps ids from
 *                  different providers from colliding in one keyspace.
 * @param eventId   Provider-assigned unique event id.
 * @param ttlSeconds How long to remember the id.
 *
 * @example
 * const claim = await claimEvent('stripe', event.id);
 * if (claim.outcome === 'duplicate') return acknowledge();
 * try {
 *   await process(event);
 * } catch (error) {
 *   // Release so the provider's retry is allowed to try again.
 *   if (claim.outcome === 'claimed') await claim.release();
 *   throw error;
 * }
 */
export async function claimEvent(
  namespace: string,
  eventId: string,
  ttlSeconds: number = DEFAULT_TTL_SECONDS
): Promise<IdempotencyClaim> {
  const redis = await getRedis();

  if (!redis) {
    logger.warn('[Idempotency] Store unavailable — processing without a uniqueness guarantee', {
      namespace,
      eventId,
    });
    return { outcome: 'unavailable' };
  }

  const key = `idempotency:${namespace}:${eventId}`;

  try {
    // `NX` makes this a compare-and-set: it succeeds only if the key is
    // absent, which is what makes concurrent deliveries safe.
    const result = await withTimeout(
      redis.set(key, new Date().toISOString(), { nx: true, ex: ttlSeconds }),
      REDIS_TIMEOUT_MS
    );

    if (result === null) {
      return { outcome: 'duplicate' };
    }

    return {
      outcome: 'claimed',
      /**
       * Drop the claim so a provider retry may reprocess.
       *
       * Called when processing fails: holding the claim would suppress every
       * subsequent retry and strand the event permanently — exactly the
       * silent-failure mode this module exists to prevent.
       */
      release: async () => {
        try {
          await withTimeout(redis.del(key), REDIS_TIMEOUT_MS);
        } catch (error) {
          // Non-fatal: the key expires on its own. Logged because until it
          // does, retries of this event will be skipped as duplicates.
          logger.error('[Idempotency] Failed to release claim; retries will be suppressed', {
            namespace,
            eventId,
            ttlSeconds,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      },
    };
  } catch (error) {
    logger.warn('[Idempotency] Claim failed — processing without a uniqueness guarantee', {
      namespace,
      eventId,
      error: error instanceof Error ? error.message : String(error),
    });
    return { outcome: 'unavailable' };
  }
}

/** Test seam: forget the memoised client so a new one is built on next use. */
export function __resetIdempotencyClientForTests(): void {
  redisPromise = undefined;
}
