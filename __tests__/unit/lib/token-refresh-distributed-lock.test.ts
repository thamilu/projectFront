/**
 * @jest-environment node
 *
 * Dedicated file (rather than folded into token-refresh.test.ts): the
 * module caches its Upstash Redis resolution in a module-level variable
 * after the first call (getUpstashRedis), so exercising both "Redis
 * configured" and "Redis absent" behavior requires jest.resetModules() +
 * a fresh dynamic import() per test to get an unmemoized module instance.
 */

jest.mock('jose', () => ({
  decodeJwt: jest.fn(() => ({ sub: 'user-1', realm_access: { roles: [] } })),
}));

jest.mock('@/core/telemetry/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import type { ExtendedJWT } from '@/lib/auth/types';
import { REFRESH_CONFIG } from '@/lib/auth/config';

const DIST_LOCK_TTL_MS = REFRESH_CONFIG.TIMEOUT_MS * REFRESH_CONFIG.MAX_RETRIES + 3_000;

function makeToken(overrides: Partial<ExtendedJWT> = {}): ExtendedJWT {
  return {
    accessToken: 'old-access-token',
    refreshToken: 'old-refresh-token',
    expiresAt: 0,
    roles: [],
    userId: 'user-1',
    sub: 'user-1',
    firstName: '',
    lastName: '',
    name: '',
    email: '',
    ...overrides,
  } as ExtendedJWT;
}

function mockKeycloakTokenResponse(overrides: Record<string, unknown> = {}) {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token',
      expires_in: 300,
      token_type: 'Bearer',
      ...overrides,
    }),
  };
}

function mockRedisModule(store: Map<string, string>) {
  const set = jest.fn(async (key: string, value: string, opts?: { nx?: true }) => {
    if (opts?.nx && store.has(key)) return null;
    store.set(key, value);
    return 'OK';
  });
  const get = jest.fn(async (key: string) => store.get(key) ?? null);
  const del = jest.fn(async (key: string) => {
    const existed = store.delete(key);
    return existed ? 1 : 0;
  });

  jest.doMock('@upstash/redis', () => ({
    Redis: jest.fn().mockImplementation(() => ({ set, get, del })),
  }));

  return { set, get, del };
}

describe('refreshAccessTokenWithLock — distributed lock (Upstash Redis)', () => {
  const originalEnv = { ...process.env };
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.resetModules();
    process.env.UPSTASH_REDIS_REST_URL = 'https://example.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    global.fetch = originalFetch;
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('acquires the lock, refreshes once, caches the result, and releases the lock', async () => {
    const store = new Map<string, string>();
    const { set, del } = mockRedisModule(store);

    const fetchMock = jest.fn().mockResolvedValue(mockKeycloakTokenResponse());
    global.fetch = fetchMock as unknown as typeof fetch;

    const { refreshAccessTokenWithLock } = await import('@/lib/auth/token-refresh');
    const token = makeToken({ userId: 'user-dist-1' });

    const result = await refreshAccessTokenWithLock(token);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.accessToken).toBe('new-access-token');
    expect(set).toHaveBeenCalledWith(
      'auth:refresh:lock:user-dist-1',
      '1',
      expect.objectContaining({ nx: true })
    );
    expect(del).toHaveBeenCalledWith('auth:refresh:lock:user-dist-1');
    // Lock released, but the result stays cached for any late-arriving
    // losing instance until its own short TTL expires.
    expect(store.has('auth:refresh:lock:user-dist-1')).toBe(false);
    expect(store.has('auth:refresh:result:user-dist-1')).toBe(true);
  });

  it('a losing instance polls the result cache instead of calling Keycloak itself', async () => {
    const store = new Map<string, string>();
    store.set('auth:refresh:lock:user-dist-2', '1'); // Another instance already holds the lock
    mockRedisModule(store);

    const fetchMock = jest.fn().mockResolvedValue(mockKeycloakTokenResponse());
    global.fetch = fetchMock as unknown as typeof fetch;

    const { refreshAccessTokenWithLock } = await import('@/lib/auth/token-refresh');
    const token = makeToken({ userId: 'user-dist-2' });

    const resultPromise = refreshAccessTokenWithLock(token);

    // Simulate the winning instance publishing its result shortly after.
    await new Promise((resolve) => setTimeout(resolve, 200));
    store.set(
      'auth:refresh:result:user-dist-2',
      JSON.stringify({ ...token, accessToken: 'winner-access-token', error: undefined })
    );

    const result = await resultPromise;

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.accessToken).toBe('winner-access-token');
  }, 10_000);

  it('falls back to an independent refresh when the distributed wait times out', async () => {
    jest.useFakeTimers({ doNotFake: ['nextTick'] });

    const store = new Map<string, string>();
    store.set('auth:refresh:lock:user-dist-3', '1'); // Held for the entire test — never resolved
    mockRedisModule(store);

    const fetchMock = jest.fn().mockResolvedValue(mockKeycloakTokenResponse());
    global.fetch = fetchMock as unknown as typeof fetch;

    const { refreshAccessTokenWithLock } = await import('@/lib/auth/token-refresh');
    const token = makeToken({ userId: 'user-dist-3' });

    const resultPromise = refreshAccessTokenWithLock(token);
    await jest.advanceTimersByTimeAsync(DIST_LOCK_TTL_MS + 500);
    const result = await resultPromise;

    // Never acquired the lock, no cached result ever appeared — must fall
    // back to refreshing independently rather than hanging forever.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.accessToken).toBe('new-access-token');
  }, 20_000);

  it('falls back to an independent refresh when a Redis call hangs past AUTH_DIST_LOCK_TIMEOUT_MS', async () => {
    // Regression test: UPSTASH_REDIS_REST_URL/TOKEN pointing at a
    // syntactically-valid-but-unreachable host (e.g. a placeholder value
    // that still passes env validation) must fail fast, not hang for as
    // long as the underlying HTTP client's own default timeout.
    jest.useFakeTimers({ doNotFake: ['nextTick'] });
    process.env.AUTH_DIST_LOCK_TIMEOUT_MS = '2000';

    jest.doMock('@upstash/redis', () => ({
      Redis: jest.fn().mockImplementation(() => ({
        set: jest.fn(() => new Promise(() => {})), // never resolves — simulates an unreachable host
        get: jest.fn(() => new Promise(() => {})),
        del: jest.fn(() => new Promise(() => {})),
      })),
    }));

    const fetchMock = jest.fn().mockResolvedValue(mockKeycloakTokenResponse());
    global.fetch = fetchMock as unknown as typeof fetch;

    const { refreshAccessTokenWithLock } = await import('@/lib/auth/token-refresh');
    const token = makeToken({ userId: 'user-dist-timeout' });

    const resultPromise = refreshAccessTokenWithLock(token);
    await jest.advanceTimersByTimeAsync(2_100);
    const result = await resultPromise;

    // The hung lock acquisition must be abandoned well before it would
    // ever resolve, falling back to an independent (non-distributed)
    // refresh rather than blocking the request indefinitely.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.accessToken).toBe('new-access-token');
  }, 20_000);

  it('skips waiting for another instance\'s result when the lock check itself failed, not just when the lock is genuinely held', async () => {
    // Regression test: previously, a set(nx) call that *threw* (Redis
    // unreachable) was treated identically to one that *resolved* with a
    // non-'OK' result (lock genuinely held by another instance) — both fell
    // into the same "wait for another instance's result" branch. But an
    // errored lock-check has no signal that anyone else holds anything, so
    // waiting only wasted an entire extra DIST_LOCK_CONFIG.REQUEST_TIMEOUT_MS
    // cycle polling the same broken Redis before falling back anyway. This
    // asserts the wait is skipped entirely in that case: the independent
    // refresh happens well before DIST_LOCK_CONFIG.REQUEST_TIMEOUT_MS would
    // have elapsed a second time.
    jest.useFakeTimers({ doNotFake: ['nextTick'] });
    process.env.AUTH_DIST_LOCK_TIMEOUT_MS = '2000';

    const getSpy = jest.fn(() => new Promise(() => {})); // must never be called
    jest.doMock('@upstash/redis', () => ({
      Redis: jest.fn().mockImplementation(() => ({
        set: jest.fn(() => Promise.reject(new Error('ECONNREFUSED'))), // fails fast, not a hang
        get: getSpy,
        del: jest.fn(() => new Promise(() => {})),
      })),
    }));

    const fetchMock = jest.fn().mockResolvedValue(mockKeycloakTokenResponse());
    global.fetch = fetchMock as unknown as typeof fetch;

    const { refreshAccessTokenWithLock } = await import('@/lib/auth/token-refresh');
    const token = makeToken({ userId: 'user-dist-fail-fast' });

    const resultPromise = refreshAccessTokenWithLock(token);
    // Only enough virtual time for microtask/promise-rejection resolution —
    // deliberately far short of a second REQUEST_TIMEOUT_MS cycle, so this
    // would hang (and the test would time out) if the wait weren't skipped.
    await jest.advanceTimersByTimeAsync(50);
    const result = await resultPromise;

    expect(getSpy).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.accessToken).toBe('new-access-token');
  }, 10_000);

  it('falls back to process-local-only locking when the Upstash module is unavailable', async () => {
    jest.doMock('@upstash/redis', () => {
      throw new Error('module not resolvable in this test');
    });

    const fetchMock = jest.fn().mockResolvedValue(mockKeycloakTokenResponse());
    global.fetch = fetchMock as unknown as typeof fetch;

    const { refreshAccessTokenWithLock } = await import('@/lib/auth/token-refresh');
    const token = makeToken({ userId: 'user-dist-4' });

    const result = await refreshAccessTokenWithLock(token);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.accessToken).toBe('new-access-token');
  });
});
