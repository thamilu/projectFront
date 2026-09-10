/**
 * @jest-environment node
 */

jest.mock('@/core/telemetry/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const decodeJwtMock = jest.fn();
jest.mock('jose', () => ({
  decodeJwt: (...args: unknown[]) => decodeJwtMock(...args),
}));

import { extractUserFromToken } from '@/lib/auth/utils';
import { logger } from '@/core/telemetry/logger';

describe('extractUserFromToken', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('extracts and maps well-formed claims', () => {
    decodeJwtMock.mockReturnValue({
      sub: 'user-1',
      email: 'jane@example.com',
      given_name: 'Jane',
      family_name: 'Doe',
      name: 'Jane Doe',
      realm_access: { roles: [] },
    });

    const result = extractUserFromToken('token');

    expect(result.userId).toBe('user-1');
    expect(result.email).toBe('jane@example.com');
    expect(result.firstName).toBe('Jane');
  });

  it('degrades to the fallback instead of throwing when a claim is wrong-typed', () => {
    // realm_access.roles as a string instead of an array — decodeJwt() itself
    // wouldn't reject this (it only checks the token is well-formed
    // base64url/JSON), so this is exactly the class of bug the schema in
    // extractUserFromToken exists to catch before `.map()` would throw.
    decodeJwtMock.mockReturnValue({
      sub: 'user-1',
      realm_access: { roles: 'not-an-array' },
    });

    const fallback = { roles: ['CUSTOMER'], firstName: 'Cached', email: 'cached@example.com' };
    const result = extractUserFromToken('token', fallback);

    expect(result.roles).toEqual(fallback.roles);
    expect(result.firstName).toBe('Cached');
    expect(logger.warn).toHaveBeenCalledWith(
      '[Auth] Decoded JWT claims did not match the expected shape — using safe defaults',
      expect.any(Object)
    );
  });

  it('falls back gracefully when decodeJwt itself throws', () => {
    decodeJwtMock.mockImplementation(() => {
      throw new Error('invalid token');
    });

    const fallback = { firstName: 'Cached' };
    const result = extractUserFromToken('bad-token', fallback);

    expect(result).toEqual(fallback);
    expect(logger.error).toHaveBeenCalledWith(
      '[Auth] Failed to decode JWT',
      expect.any(Object)
    );
  });
});
