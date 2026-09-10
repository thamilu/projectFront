/**
 * @jest-environment node
 */

jest.mock('@/core/telemetry/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock('@/lib/auth/utils', () => ({
  isTokenValid: jest.fn(),
  extractUserFromToken: jest.fn(),
  healTokenIdentity: jest.fn((token) => token),
  createErrorToken: jest.fn((error) => ({
    error,
    accessToken: '',
    refreshToken: '',
    expiresAt: 0,
    roles: [],
    userId: '',
    sub: '',
    firstName: '',
    lastName: '',
    name: '',
    email: '',
  })),
}));

jest.mock('@/lib/auth/backend-role', () => ({
  fetchUserRoleWithRetry: jest.fn(),
  mergeBackendRole: jest.fn((token) => token),
}));

jest.mock('@/lib/auth/token-refresh', () => ({
  refreshAccessTokenWithLock: jest.fn(),
}));

import type { Account, Session } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import {
  handleInitialSignIn,
  handleUpdateTrigger,
  handleTokenRefreshIfNeeded,
  resolveSessionIdentity,
  buildSessionUser,
} from '@/lib/auth/handlers';
import { AuthErrorCode } from '@/lib/auth/types';
import type { ExtendedJWT } from '@/lib/auth/types';
import { isTokenValid, extractUserFromToken, healTokenIdentity } from '@/lib/auth/utils';
import { fetchUserRoleWithRetry, mergeBackendRole } from '@/lib/auth/backend-role';
import { refreshAccessTokenWithLock } from '@/lib/auth/token-refresh';
import { logger } from '@/core/telemetry/logger';

const mockIsTokenValid = isTokenValid as jest.Mock;
const mockExtractUserFromToken = extractUserFromToken as jest.Mock;
const mockHealTokenIdentity = healTokenIdentity as jest.Mock;
const mockFetchUserRoleWithRetry = fetchUserRoleWithRetry as jest.Mock;
const mockMergeBackendRole = mergeBackendRole as jest.Mock;
const mockRefreshAccessTokenWithLock = refreshAccessTokenWithLock as jest.Mock;

function makeToken(overrides: Partial<ExtendedJWT> = {}): ExtendedJWT {
  return {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    expiresAt: 9_999_999_999,
    roles: [],
    userId: 'user-1',
    sub: 'user-1',
    firstName: 'Jane',
    lastName: 'Doe',
    name: 'Jane Doe',
    email: 'jane@example.com',
    ...overrides,
  };
}

afterEach(() => {
  jest.clearAllMocks();
  mockHealTokenIdentity.mockImplementation((token) => token);
  mockMergeBackendRole.mockImplementation((token) => token);
});

describe('handleInitialSignIn', () => {
  it('returns an error token when Keycloak omits required account fields', async () => {
    const account = { access_token: undefined } as unknown as Account;
    const result = await handleInitialSignIn(account, {} as JWT);
    expect(result.error).toBe(AuthErrorCode.INVALID_KEYCLOAK_RESPONSE);
    expect(logger.error).toHaveBeenCalled();
  });

  it('builds an ExtendedJWT from the account and merges the backend role', async () => {
    const account = {
      access_token: 'kc-access',
      refresh_token: 'kc-refresh',
      expires_at: 1_700_000_000,
      id_token: 'kc-id',
    } as unknown as Account;

    mockExtractUserFromToken.mockReturnValue({
      roles: ['CUSTOMER'],
      userId: 'user-1',
      sub: 'user-1',
      firstName: 'Jane',
      lastName: 'Doe',
      name: 'Jane Doe',
      email: 'jane@example.com',
    });
    mockFetchUserRoleWithRetry.mockResolvedValue({ role: 'SELLER' });
    mockMergeBackendRole.mockImplementation((token) => ({ ...token, roles: ['SELLER'] }));

    const result = await handleInitialSignIn(account, { sub: 'user-1' } as JWT);

    expect(result.accessToken).toBe('kc-access');
    expect(result.refreshToken).toBe('kc-refresh');
    expect(result.expiresAt).toBe(1_700_000_000);
    expect(result.roles).toEqual(['SELLER']);
    expect(mockFetchUserRoleWithRetry).toHaveBeenCalledWith('kc-access');
  });

  it('logs a warning when the token carries neither email nor name', async () => {
    const account = {
      access_token: 'kc-access',
      refresh_token: 'kc-refresh',
      expires_at: 1_700_000_000,
    } as unknown as Account;

    mockExtractUserFromToken.mockReturnValue({ roles: [], userId: 'user-1', sub: 'user-1' });
    mockFetchUserRoleWithRetry.mockResolvedValue({ role: null });

    await handleInitialSignIn(account, { sub: 'user-1' } as JWT);

    expect(logger.warn).toHaveBeenCalledWith(
      '[Auth] Keycloak token missing expected identity claims',
      expect.any(Object)
    );
  });
});

describe('handleUpdateTrigger', () => {
  it('returns the token unchanged if it already has an error', async () => {
    const token = makeToken({ error: AuthErrorCode.REFRESH_TOKEN_ERROR });
    const result = await handleUpdateTrigger(token);
    expect(result).toBe(token);
    expect(mockHealTokenIdentity).not.toHaveBeenCalled();
  });

  it('returns the token unchanged if there is no refresh token', async () => {
    const token = makeToken({ refreshToken: '' });
    const result = await handleUpdateTrigger(token);
    expect(result).toBe(token);
  });

  it('refreshes an expired token, then refetches and merges the backend role', async () => {
    const token = makeToken();
    mockIsTokenValid.mockReturnValue(false);
    const refreshed = makeToken({ accessToken: 'new-access' });
    mockRefreshAccessTokenWithLock.mockResolvedValue(refreshed);
    mockFetchUserRoleWithRetry.mockResolvedValue({ role: 'SELLER' });
    mockMergeBackendRole.mockImplementation((t) => ({ ...t, roles: ['SELLER'] }));

    const result = await handleUpdateTrigger(token);

    expect(mockRefreshAccessTokenWithLock).toHaveBeenCalledWith(token);
    expect(mockFetchUserRoleWithRetry).toHaveBeenCalledWith('new-access');
    expect(result.roles).toEqual(['SELLER']);
    // Healed on the way in and on the way out.
    expect(mockHealTokenIdentity).toHaveBeenCalledTimes(2);
  });

  it('skips refresh and role refetch when the token is still valid but keeps healing it', async () => {
    const token = makeToken();
    mockIsTokenValid.mockReturnValue(true);
    mockFetchUserRoleWithRetry.mockResolvedValue({ role: 'SELLER' });

    await handleUpdateTrigger(token);

    expect(mockRefreshAccessTokenWithLock).not.toHaveBeenCalled();
    expect(mockFetchUserRoleWithRetry).toHaveBeenCalledWith(token.accessToken);
  });

  it('does not refetch the backend role if refresh left the token in an error state', async () => {
    const token = makeToken();
    mockIsTokenValid.mockReturnValue(false);
    mockRefreshAccessTokenWithLock.mockResolvedValue(
      makeToken({ error: AuthErrorCode.REFRESH_TOKEN_ERROR, accessToken: '' })
    );

    await handleUpdateTrigger(token);

    expect(mockFetchUserRoleWithRetry).not.toHaveBeenCalled();
  });
});

describe('handleTokenRefreshIfNeeded', () => {
  it('returns the token unchanged if it already has an error', async () => {
    const token = makeToken({ error: AuthErrorCode.REFRESH_TOKEN_ERROR });
    const result = await handleTokenRefreshIfNeeded(token);
    expect(result).toBe(token);
  });

  it('returns the token unchanged if there is no refresh token', async () => {
    const token = makeToken({ refreshToken: '' });
    const result = await handleTokenRefreshIfNeeded(token);
    expect(result).toBe(token);
  });

  it('delegates to refreshAccessTokenWithLock when the token has expired', async () => {
    const token = makeToken();
    mockIsTokenValid.mockReturnValue(false);
    const refreshed = makeToken({ accessToken: 'new-access' });
    mockRefreshAccessTokenWithLock.mockResolvedValue(refreshed);

    const result = await handleTokenRefreshIfNeeded(token);

    expect(mockRefreshAccessTokenWithLock).toHaveBeenCalled();
    expect(result).toBe(refreshed);
  });

  it('heals a valid token missing firstName/email exactly once via identityHealAttempted', async () => {
    const token = makeToken({ firstName: '', email: '', identityHealAttempted: false });
    mockIsTokenValid.mockReturnValue(true);
    mockExtractUserFromToken.mockReturnValue({
      firstName: 'Healed',
      lastName: 'Name',
      name: 'Healed Name',
      email: 'healed@example.com',
    });

    const result = await handleTokenRefreshIfNeeded(token);

    expect(mockExtractUserFromToken).toHaveBeenCalledWith(token.accessToken, token);
    expect(result.firstName).toBe('Healed');
    expect(result.email).toBe('healed@example.com');
    expect(result.identityHealAttempted).toBe(true);
  });

  it('does not re-attempt healing once identityHealAttempted is already true', async () => {
    const token = makeToken({ firstName: '', email: '', identityHealAttempted: true });
    mockIsTokenValid.mockReturnValue(true);

    const result = await handleTokenRefreshIfNeeded(token);

    expect(mockExtractUserFromToken).not.toHaveBeenCalled();
    expect(result).toBe(token);
  });

  it('does not attempt healing when the token already has firstName and email', async () => {
    const token = makeToken();
    mockIsTokenValid.mockReturnValue(true);

    await handleTokenRefreshIfNeeded(token);

    expect(mockExtractUserFromToken).not.toHaveBeenCalled();
  });
});

describe('resolveSessionIdentity', () => {
  it('returns the userId and any existing error when userId is present', () => {
    const token = makeToken({ error: AuthErrorCode.CALLBACK_ERROR });
    const result = resolveSessionIdentity(token);
    expect(result).toEqual({ sessionError: AuthErrorCode.CALLBACK_ERROR, userIdVal: 'user-1' });
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('falls back to sub when userId is an empty string', () => {
    // Matches extractUserFromToken's identical mutual-fallback pattern
    // (`fallback?.userId || fallback?.sub`) — `||` treats an empty-string
    // userId as absent just like a null/undefined one, unlike the `??` this
    // line previously used, which only caught the latter and silently never
    // recovered via sub for the former.
    const token = makeToken({ userId: '', sub: 'sub-fallback' });
    const result = resolveSessionIdentity(token);
    expect(result.userIdVal).toBe('sub-fallback');
  });

  it('logs an error and returns MISSING_USER_ID when identity is missing with no prior error', () => {
    const token = makeToken({ userId: '', sub: '' });
    const result = resolveSessionIdentity(token);
    expect(result).toEqual({ sessionError: AuthErrorCode.MISSING_USER_ID, userIdVal: '' });
    expect(logger.error).toHaveBeenCalledWith(
      '[Auth] Session created without userId',
      expect.any(Object)
    );
  });

  it('does not log when identity is missing but a more specific error already explains it', () => {
    const token = makeToken({ userId: '', sub: '', error: AuthErrorCode.REFRESH_TOKEN_ERROR });
    const result = resolveSessionIdentity(token);
    expect(result).toEqual({ sessionError: AuthErrorCode.REFRESH_TOKEN_ERROR, userIdVal: '' });
    expect(logger.error).not.toHaveBeenCalled();
  });
});

describe('buildSessionUser', () => {
  it('prefers token fields over the base session user', () => {
    const token = makeToken({ roles: ['SELLER'] });
    const result = buildSessionUser(
      { name: 'Old Name', email: 'old@example.com' } as unknown as Session['user'],
      token,
      'user-1'
    );
    expect(result).toEqual({
      name: 'Jane Doe',
      email: 'jane@example.com',
      id: 'user-1',
      roles: ['SELLER'],
      firstName: 'Jane',
      lastName: 'Doe',
    });
  });

  it('falls back to the base session user fields when the token lacks them', () => {
    const token = makeToken({ name: '', email: '', roles: [] });
    const result = buildSessionUser(
      { name: 'Base Name', email: 'base@example.com' } as unknown as Session['user'],
      token,
      'user-1'
    );
    expect(result.name).toBe('Base Name');
    expect(result.email).toBe('base@example.com');
  });
});
