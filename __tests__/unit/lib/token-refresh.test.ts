/**
 * @jest-environment node
 *
 * token-refresh.ts now has its own runtime server-only guard (throws if
 * `window` is defined) independent of lib/auth/index.ts's guard — jsdom
 * (the default test environment) defines `window` globally, which would
 * trip that guard on import. This file tests pure server-side logic with
 * no DOM dependency, so running it under node is also the more accurate
 * environment, not just a workaround.
 */

// jose ships pure ESM, which Jest's default CommonJS transform can't parse.
// extractUserFromToken() (used internally on a successful refresh) already
// falls back gracefully if decodeJwt throws/misbehaves, so a minimal stub is
// sufficient here — this test is exercising the lock's concurrency behavior,
// not JWT claim decoding.
jest.mock('jose', () => ({
  decodeJwt: jest.fn(() => ({ sub: 'user-1', realm_access: { roles: [] } })),
}));

// The real logger forwards every log call through fetch('/api/logs', ...)
// whenever a `window` global is present (see core/telemetry/logger.ts) —
// true in this jsdom test environment. Without this mock, every
// logger.debug/warn/error call inside refreshAccessToken would also hit our
// mocked global.fetch, inflating the call counts these tests assert on with
// log-forwarding requests that have nothing to do with the lock itself.
jest.mock('@/core/telemetry/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import { refreshAccessTokenWithLock } from '@/lib/auth/token-refresh';
import type { ExtendedJWT } from '@/lib/auth/types';

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

describe('refreshAccessTokenWithLock', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('coalesces concurrent refreshes for the same user into a single network call', async () => {
    let resolveResponse!: (value: unknown) => void;
    const pendingResponse = new Promise((resolve) => {
      resolveResponse = resolve;
    });
    const fetchMock = jest.fn().mockReturnValue(pendingResponse);
    global.fetch = fetchMock as unknown as typeof fetch;

    const token = makeToken({ userId: 'user-1' });

    // Two "simultaneous" refresh attempts for the SAME user, e.g. two
    // concurrent requests hitting the JWT callback at the token-expiry
    // boundary — this is exactly the "refresh stampede" the lock exists
    // to prevent (see the docstring on refreshAccessTokenWithLock).
    const first = refreshAccessTokenWithLock(token);
    const second = refreshAccessTokenWithLock(token);

    // Let both calls reach the fetch() call before resolving it.
    await Promise.resolve();
    await Promise.resolve();

    expect(fetchMock).toHaveBeenCalledTimes(1);

    resolveResponse(mockKeycloakTokenResponse());
    const [firstResult, secondResult] = await Promise.all([first, second]);

    expect(firstResult).toBe(secondResult);
    expect(firstResult.accessToken).toBe('new-access-token');
  });

  it('does not serialize refreshes for different users (per-user lock, not global)', async () => {
    const fetchMock = jest.fn().mockResolvedValue(mockKeycloakTokenResponse());
    global.fetch = fetchMock as unknown as typeof fetch;

    const tokenA = makeToken({ userId: 'user-a' });
    const tokenB = makeToken({ userId: 'user-b' });

    await Promise.all([refreshAccessTokenWithLock(tokenA), refreshAccessTokenWithLock(tokenB)]);

    // A global lock would have coalesced these into one call; a correctly
    // per-user-scoped lock issues one network call per distinct user.
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('releases the lock after completion so a later refresh issues a new request', async () => {
    const fetchMock = jest.fn().mockResolvedValue(mockKeycloakTokenResponse());
    global.fetch = fetchMock as unknown as typeof fetch;

    const token = makeToken({ userId: 'user-1' });

    await refreshAccessTokenWithLock(token);
    await refreshAccessTokenWithLock(token);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('fails fast on a non-JSON 4xx response instead of exhausting retries', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => {
        throw new SyntaxError('Unexpected token < in JSON');
      },
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const token = makeToken({ userId: 'user-fast-fail' });
    const result = await refreshAccessTokenWithLock(token);

    // A WAF/proxy returning an HTML error page for a terminal 4xx must not
    // be misclassified as a retryable failure — exactly one attempt, not
    // REFRESH_CONFIG.MAX_RETRIES worth of backed-off retries.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.error).toBe('RefreshAccessTokenError');
  });

  it('rejects a malformed 200 response instead of producing a NaN expiry', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ access_token: 'new-access-token' }), // expires_in missing
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const token = makeToken({ userId: 'user-malformed' });
    const result = await refreshAccessTokenWithLock(token);

    expect(result.error).toBe('RefreshAccessTokenError');
    expect(Number.isNaN(result.expiresAt)).toBe(false);
    expect(result.expiresAt).toBe(token.expiresAt); // Original token untouched, not corrupted
  });

  it('falls back to a refresh-token-derived lock key when userId is absent', async () => {
    let resolveResponse!: (value: unknown) => void;
    const pendingResponse = new Promise((resolve) => {
      resolveResponse = resolve;
    });
    const fetchMock = jest.fn().mockReturnValue(pendingResponse);
    global.fetch = fetchMock as unknown as typeof fetch;

    const token = makeToken({ userId: '', refreshToken: 'shared-refresh-token-abcdefgh' });

    const first = refreshAccessTokenWithLock(token);
    const second = refreshAccessTokenWithLock({ ...token });

    await Promise.resolve();
    await Promise.resolve();

    expect(fetchMock).toHaveBeenCalledTimes(1);

    resolveResponse(mockKeycloakTokenResponse());
    await Promise.all([first, second]);
  });
});
