/**
 * @jest-environment node
 */

jest.mock('@/core/telemetry/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

// backend-role.ts imports measurementStart/elapsedMs from ./utils, which
// imports jose (pure ESM, unparseable by Jest's default transform) — see
// token-refresh.test.ts for the same mock and rationale.
jest.mock('jose', () => ({
  decodeJwt: jest.fn(() => ({ sub: 'user-1', realm_access: { roles: [] } })),
}));

import { fetchUserRoleFromBackend } from '@/lib/auth/backend-role';
import { BackendRoleErrorCode } from '@/lib/auth/types';
import { logger } from '@/core/telemetry/logger';

describe('fetchUserRoleFromBackend', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('returns the role from data.role when present', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { role: 'seller' } }),
    }) as unknown as typeof fetch;

    const result = await fetchUserRoleFromBackend('token');
    expect(result).toEqual({ role: 'SELLER' });
  });

  it('falls back to top-level role when data.role is absent', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ role: 'buyer' }),
    }) as unknown as typeof fetch;

    const result = await fetchUserRoleFromBackend('token');
    expect(result).toEqual({ role: 'BUYER' });
  });

  it('rejects a malformed response (wrong-typed role) instead of trusting it blindly', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { role: 12345 } }), // role should be a string
    }) as unknown as typeof fetch;

    const result = await fetchUserRoleFromBackend('token');

    expect(result).toEqual({ role: null, error: BackendRoleErrorCode.FETCH_FAILED });
    expect(logger.error).toHaveBeenCalledWith(
      '[Auth] Malformed response from backend role endpoint',
      expect.any(Object)
    );
  });

  it('returns FETCH_FAILED on a non-OK HTTP status', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    }) as unknown as typeof fetch;

    const result = await fetchUserRoleFromBackend('token');
    expect(result).toEqual({ role: null, error: BackendRoleErrorCode.FETCH_FAILED });
  });

  it('returns NETWORK_ERROR on a fetch exception', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('ECONNRESET')) as unknown as typeof fetch;

    const result = await fetchUserRoleFromBackend('token');
    expect(result).toEqual({ role: null, error: BackendRoleErrorCode.NETWORK_ERROR });
  });
});
