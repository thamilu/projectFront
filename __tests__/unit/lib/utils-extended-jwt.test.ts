/**
 * @jest-environment node
 */

jest.mock('@/core/telemetry/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock('jose', () => ({
  decodeJwt: jest.fn(),
}));

import { isExtendedJWT, asExtendedJWT } from '@/lib/auth/utils';
import { AuthErrorCode } from '@/lib/auth/types';
import { logger } from '@/core/telemetry/logger';

const validToken = {
  accessToken: 'access',
  refreshToken: 'refresh',
  expiresAt: 1234567890,
  roles: [],
  userId: 'user-1',
  sub: 'user-1',
  firstName: '',
  lastName: '',
  name: '',
  email: '',
};

describe('isExtendedJWT', () => {
  it('accepts a well-formed token', () => {
    expect(isExtendedJWT(validToken)).toBe(true);
  });

  it('rejects a token with a non-array roles field, even if the key is present', () => {
    expect(isExtendedJWT({ ...validToken, roles: 'not-an-array' })).toBe(false);
  });

  it('rejects a NaN expiresAt (present, but not a valid number)', () => {
    expect(isExtendedJWT({ ...validToken, expiresAt: NaN })).toBe(false);
  });

  it('rejects a non-string accessToken, even if the key is present', () => {
    expect(isExtendedJWT({ ...validToken, accessToken: 42 })).toBe(false);
  });

  it('rejects null and non-object values', () => {
    expect(isExtendedJWT(null)).toBe(false);
    expect(isExtendedJWT(undefined)).toBe(false);
    expect(isExtendedJWT('a string')).toBe(false);
  });
});

describe('asExtendedJWT', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns a well-formed token unchanged', () => {
    expect(asExtendedJWT(validToken)).toBe(validToken);
  });

  it('degrades a malformed token to a MALFORMED_TOKEN error token, in every environment', () => {
    const result = asExtendedJWT({ someUnexpectedShape: true });

    expect(result.error).toBe(AuthErrorCode.MALFORMED_TOKEN);
    expect(result.accessToken).toBe('');
    expect(result.expiresAt).toBe(0);
    expect(logger.error).toHaveBeenCalledWith(
      '[Auth] Token does not match ExtendedJWT shape — forcing re-authentication',
      expect.any(Object)
    );
  });

  it('degrades even in a production-like environment (not dev-only)', () => {
    const originalEnv = process.env.NODE_ENV;
    // @ts-expect-error — test-only override of a normally-readonly env var
    process.env.NODE_ENV = 'production';

    try {
      const result = asExtendedJWT({ roles: [] }); // missing accessToken/expiresAt
      expect(result.error).toBe(AuthErrorCode.MALFORMED_TOKEN);
    } finally {
      // @ts-expect-error — restoring the same test-only override
      process.env.NODE_ENV = originalEnv;
    }
  });
});
