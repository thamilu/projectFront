// Forces initUpstashIfNeeded()'s try/catch to fail construction, so every
// test in this file deterministically exercises the in-memory fallback
// path rather than attempting a real network call to the mocked
// UPSTASH_REDIS_REST_URL from __tests__/setup.ts.
jest.mock('@upstash/redis', () => ({
  Redis: class {
    constructor() {
      throw new Error('Redis unavailable in test environment');
    }
  },
}));
jest.mock('@upstash/ratelimit', () => ({
  Ratelimit: class {
    constructor() {
      throw new Error('Ratelimit unavailable in test environment');
    }
  },
}));

import { limit } from '@/shared/utils/rate-limit';

describe('shared/utils/rate-limit (in-memory fallback)', () => {
  it('allows the first request for a fresh key', async () => {
    const result = await limit('test-key-fresh');
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(9);
  });

  it('decrements remaining on each subsequent call for the same key', async () => {
    const key = 'test-key-decrement';
    const first = await limit(key);
    const second = await limit(key);
    const third = await limit(key);

    expect(first.remaining).toBe(9);
    expect(second.remaining).toBe(8);
    expect(third.remaining).toBe(7);
  });

  it('blocks once the max request count is exceeded', async () => {
    const key = 'test-key-exhausted';
    let last;
    for (let i = 0; i < 10; i++) {
      last = await limit(key);
    }
    expect(last?.success).toBe(true);
    expect(last?.remaining).toBe(0);

    const blocked = await limit(key);
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it('tracks independent counters per key', async () => {
    const a = await limit('test-key-independent-a');
    const b = await limit('test-key-independent-b');

    expect(a.remaining).toBe(9);
    expect(b.remaining).toBe(9);
  });

  it('returns a reset timestamp in the future', async () => {
    const before = Date.now();
    const result = await limit('test-key-reset');
    expect(result.reset).toBeGreaterThan(before);
  });
});
