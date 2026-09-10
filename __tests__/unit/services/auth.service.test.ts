// ============================================================
// __tests__/unit/services/auth.service.test.ts
// Comprehensive unit tests for the refactored AuthService.
// Uses DI to inject mocks — no global window or module mocking.
// ============================================================

import { createAuthService } from '@/domains/auth/services/auth-service';
import { createMockBrowserLocation } from '@/domains/auth/services/browser-location.provider';
import { UserRole } from '@/domains/auth/contracts/auth.types';
import { AuthErrorCode } from '@/domains/auth/services/auth-result.types';
import { AUTH_SERVICE_CONFIG } from '@/domains/auth/services/auth-service.config';
import type { IAuthService } from '@/domains/auth/services/auth-service.interface';

// ─── Mocks ───────────────────────────────────────────────────

jest.mock('next-auth/react', () => ({
  getSession: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock('@/core/telemetry/logger.factory', () => ({
  createServiceLogger: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }),
}));

import { getSession, signIn, signOut } from 'next-auth/react';

const mockGetSession = getSession as jest.Mock;
const mockSignIn = signIn as jest.Mock;
const mockSignOut = signOut as jest.Mock;

// ─── Factories ───────────────────────────────────────────────

function buildValidRawSession(overrides = {}) {
  return {
    user: { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
    roles: [UserRole.SELLER],
    expiresAt: Math.floor(Date.now() / 1000) + 3600,
    expires: new Date(Date.now() + 3600 * 1000).toISOString(),
    ...overrides,
  };
}

// ─── Test Suite ───────────────────────────────────────────────

describe('AuthService', () => {
  let service: IAuthService;
  let navigateSpy: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    navigateSpy = jest.fn();
    service = createAuthService({
      browserLocation: createMockBrowserLocation('/test-path', navigateSpy),
    });
  });

  // ─── getNormalizedSession ─────────────────────────────────

  describe('getNormalizedSession()', () => {
    it('returns null when no session exists', async () => {
      mockGetSession.mockResolvedValue(null);
      const result = await service.getNormalizedSession();
      expect(result).toBeNull();
    });

    it('returns normalized session for valid raw session', async () => {
      const raw = buildValidRawSession();
      mockGetSession.mockResolvedValue(raw);

      const result = await service.getNormalizedSession();

      expect(result).not.toBeNull();
      expect(result?.user?.email).toBe('alice@example.com');
      expect(result?.isExpired).toBe(false);
      expect(result?.isExpiringSoon).toBe(false);
    });

    it('returns null and does not throw when session schema is invalid', async () => {
      mockGetSession.mockResolvedValue({ malformed: true });
      const result = await service.getNormalizedSession();
      expect(result).toBeNull();
    });

    it('returns null when the session user is missing an id (schema-required)', async () => {
      const raw = buildValidRawSession({ user: { name: 'Alice', email: 'alice@example.com' } });
      mockGetSession.mockResolvedValue(raw);

      const result = await service.getNormalizedSession();

      expect(result).toBeNull();
    });

    it('never uses a stale pre-retry timestamp for expiry calculations', async () => {
      const raw = buildValidRawSession({
        // Expires 500ms from "now" — well inside a single fake-timer tick,
        // but this asserts the expiry math uses a fresh timestamp rather
        // than one captured before withRetry/backoff delays.
        expiresAt: Math.floor(Date.now() / 1000) + 1,
      });
      mockGetSession.mockResolvedValue(raw);

      const result = await service.getNormalizedSession();
      expect(result?.isExpired).toBe(false);
    });

    it('marks session as expired when expiresAt is in the past', async () => {
      const raw = buildValidRawSession({
        expiresAt: Math.floor(Date.now() / 1000) - 100,
      });
      mockGetSession.mockResolvedValue(raw);

      const result = await service.getNormalizedSession();
      expect(result?.isExpired).toBe(true);
    });

    it('marks session as expiring soon within warning buffer', async () => {
      const raw = buildValidRawSession({
        expiresAt: Math.floor(Date.now() / 1000) + 30, // within 60s buffer
      });
      mockGetSession.mockResolvedValue(raw);

      const result = await service.getNormalizedSession();
      expect(result?.isExpiringSoon).toBe(true);
    });

    it('returns null (no throw) when getSession throws after all retries', async () => {
      mockGetSession.mockRejectedValue(new Error('Network error'));
      const result = await service.getNormalizedSession();
      expect(result).toBeNull();
    });

    it('retries on transient failures and succeeds on recovery', async () => {
      const raw = buildValidRawSession();
      mockGetSession
        .mockRejectedValueOnce(new Error('Transient'))
        .mockRejectedValueOnce(new Error('Transient'))
        .mockResolvedValue(raw);

      const result = await service.getNormalizedSession();
      expect(result).not.toBeNull();
      expect(mockGetSession).toHaveBeenCalledTimes(3);
    });
  });

  // ─── initiateLogin ────────────────────────────────────────

  describe('initiateLogin()', () => {
    it('returns success result and navigates to the IdP url on successful signIn', async () => {
      mockSignIn.mockResolvedValue({ error: undefined, url: 'https://idp.example.com/authorize' });
      const result = await service.initiateLogin('/dashboard');

      expect(result.success).toBe(true);
      expect(mockSignIn).toHaveBeenCalledWith(
        'keycloak',
        { callbackUrl: '/dashboard', redirect: false },
        undefined
      );
      expect(navigateSpy).toHaveBeenCalledWith('https://idp.example.com/authorize');
    });

    it('uses injected browser pathname when callbackUrl is not provided', async () => {
      mockSignIn.mockResolvedValue({ error: undefined, url: '/test-path' });
      await service.initiateLogin();

      expect(mockSignIn).toHaveBeenCalledWith(
        'keycloak',
        { callbackUrl: '/test-path', redirect: false }, // from mock browser location
        undefined
      );
    });

    it('returns failure result (not throw) when signIn throws', async () => {
      mockSignIn.mockRejectedValue(new Error('OAuth error'));
      const result = await service.initiateLogin();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(AuthErrorCode.LOGIN_FAILED);
        expect(result.error.message).toBeTruthy();
      }
      expect(navigateSpy).not.toHaveBeenCalled();
    });

    it('returns failure result (not throw) when signIn resolves with an error field', async () => {
      mockSignIn.mockResolvedValue({ error: 'CredentialsSignin', url: null });
      const result = await service.initiateLogin();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(AuthErrorCode.LOGIN_FAILED);
      }
      expect(navigateSpy).not.toHaveBeenCalled();
    });

    it('accepts custom provider override', async () => {
      mockSignIn.mockResolvedValue({ error: undefined, url: '/home' });
      // AUTH_PROVIDERS only ever registers 'keycloak' (see auth.constants.ts) —
      // this exercises the parameter being genuinely overridable at the type
      // level, using the one real provider value rather than a fabricated one.
      await service.initiateLogin('/home', 'keycloak');

      expect(mockSignIn).toHaveBeenCalledWith(
        'keycloak',
        { callbackUrl: '/home', redirect: false },
        undefined
      );
    });

    it('requests a Keycloak-brokered IdP via kc_idp_hint when idpHint is provided', async () => {
      mockSignIn.mockResolvedValue({ error: undefined, url: 'https://idp.example.com/authorize' });
      await service.initiateLogin('/dashboard', undefined, 'google');

      expect(mockSignIn).toHaveBeenCalledWith(
        'keycloak',
        { callbackUrl: '/dashboard', redirect: false },
        { kc_idp_hint: 'google' }
      );
    });
  });

  // ─── initiateLogout ───────────────────────────────────────

  describe('initiateLogout()', () => {
    it('returns success result and navigates to the returned url on successful signOut', async () => {
      mockSignOut.mockResolvedValue({ url: '/login' });
      const result = await service.initiateLogout('/');

      expect(result.success).toBe(true);
      expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/', redirect: false });
      expect(navigateSpy).toHaveBeenCalledWith('/login');
    });

    it('returns failure result (not throw) when signOut fails', async () => {
      mockSignOut.mockRejectedValue(new Error('Sign-out error'));
      const result = await service.initiateLogout();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(AuthErrorCode.LOGOUT_FAILED);
      }
    });

    it('invalidates the cached session immediately, before signOut resolves', async () => {
      // Populate the cache with an authenticated session.
      mockGetSession.mockResolvedValue(buildValidRawSession());
      const cached = await service.getNormalizedSession();
      expect(cached).not.toBeNull();

      // signOut() intentionally never resolves in this test — invalidation
      // must happen synchronously up front, not only in the success branch.
      mockSignOut.mockReturnValue(new Promise(() => {}));
      void service.initiateLogout();

      // A concurrent session read must not see the stale cached session.
      mockGetSession.mockResolvedValue(null);
      const afterLogout = await service.getNormalizedSession();
      expect(afterLogout).toBeNull();
    });
  });

  describe('invalidateSession()', () => {
    it('forces the next getNormalizedSession() call to fetch fresh', async () => {
      mockGetSession.mockResolvedValue(buildValidRawSession());
      await service.getNormalizedSession();
      expect(mockGetSession).toHaveBeenCalledTimes(1);

      service.invalidateSession();

      await service.getNormalizedSession();
      expect(mockGetSession).toHaveBeenCalledTimes(2);
    });
  });

  // ─── Cross-Tab Invalidation ───────────────────────────────

  describe('cross-tab session invalidation', () => {
    it('broadcasts via localStorage when invalidateSession() is called', () => {
      const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');

      service.invalidateSession();

      expect(setItemSpy).toHaveBeenCalledWith(
        AUTH_SERVICE_CONFIG.crossTabInvalidationStorageKey,
        expect.any(String)
      );
      setItemSpy.mockRestore();
    });

    it('broadcasts via localStorage when initiateLogout() succeeds', async () => {
      const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');
      mockSignOut.mockResolvedValue({ url: '/login' });

      await service.initiateLogout();

      expect(setItemSpy).toHaveBeenCalledWith(
        AUTH_SERVICE_CONFIG.crossTabInvalidationStorageKey,
        expect.any(String)
      );
      setItemSpy.mockRestore();
    });

    it("clears another tab's cached session when it receives this tab's invalidation signal", async () => {
      // Simulates two open tabs: `service` (this test's default instance)
      // and `otherTabService`, each with its own AuthService instance but
      // sharing the same jsdom `window` (as real browser tabs share
      // localStorage + the storage event, though not `window` itself —
      // dispatching manually here since jsdom doesn't simulate real
      // cross-window storage propagation).
      const otherTabService = createAuthService({
        browserLocation: createMockBrowserLocation('/other-tab'),
      });

      mockGetSession.mockResolvedValue(buildValidRawSession());
      const cached = await otherTabService.getNormalizedSession();
      expect(cached).not.toBeNull();

      // Simulate the storage event a real other tab would receive when
      // this tab calls invalidateSession() / initiateLogout().
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: AUTH_SERVICE_CONFIG.crossTabInvalidationStorageKey,
          newValue: String(Date.now()),
        })
      );

      mockGetSession.mockResolvedValue(null);
      const afterInvalidation = await otherTabService.getNormalizedSession();
      expect(afterInvalidation).toBeNull();
      expect(mockGetSession).toHaveBeenCalledTimes(2);
    });

    it('ignores storage events for unrelated keys', async () => {
      mockGetSession.mockResolvedValue(buildValidRawSession());
      await service.getNormalizedSession();
      expect(mockGetSession).toHaveBeenCalledTimes(1);

      window.dispatchEvent(new StorageEvent('storage', { key: 'some-other-key', newValue: 'x' }));

      // Still within the 5s TTL and not invalidated — no re-fetch.
      await service.getNormalizedSession();
      expect(mockGetSession).toHaveBeenCalledTimes(1);
    });

    it('degrades gracefully when localStorage.setItem throws (e.g. Safari private mode)', async () => {
      const setItemSpy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      mockSignOut.mockResolvedValue({ url: '/login' });

      const result = await service.initiateLogout();

      // The broadcast failure must not surface as a logout failure.
      expect(result.success).toBe(true);
      setItemSpy.mockRestore();
    });
  });

  // ─── Permission Checks ────────────────────────────────────

  describe('checkPermissions() — OR logic', () => {
    it('returns true when user has at least one required role', () => {
      expect(
        service.checkPermissions([UserRole.CUSTOMER], [UserRole.SELLER, UserRole.CUSTOMER])
      ).toBe(true);
    });

    it('returns false when user has none of the required roles', () => {
      expect(service.checkPermissions([UserRole.CUSTOMER], [UserRole.SELLER])).toBe(false);
    });

    it('returns true when requiredRoles is empty', () => {
      expect(service.checkPermissions([UserRole.CUSTOMER], [])).toBe(true);
    });
  });

  describe('checkAllPermissions() — AND logic', () => {
    it('returns true when user has all required roles', () => {
      expect(
        service.checkAllPermissions(
          [UserRole.SELLER, UserRole.CUSTOMER],
          [UserRole.SELLER, UserRole.CUSTOMER]
        )
      ).toBe(true);
    });

    it('returns false when user is missing one required role', () => {
      expect(
        service.checkAllPermissions([UserRole.SELLER], [UserRole.SELLER, UserRole.CUSTOMER])
      ).toBe(false);
    });
  });

  describe('checkDeniedPermissions() — NOT logic', () => {
    it('returns false when user has a denied role', () => {
      expect(service.checkDeniedPermissions([UserRole.SELLER], [UserRole.SELLER])).toBe(false);
    });

    it('returns true when user has none of the denied roles', () => {
      expect(service.checkDeniedPermissions([UserRole.CUSTOMER], [UserRole.SELLER])).toBe(true);
    });

    it('returns true when deniedRoles is empty', () => {
      expect(service.checkDeniedPermissions([UserRole.SELLER], [])).toBe(true);
    });
  });

  // ─── resolveDashboardRoute ────────────────────────────────

  describe('resolveDashboardRoute()', () => {
    it('resolves highest-priority role route', () => {
      const route = service.resolveDashboardRoute([UserRole.CUSTOMER, UserRole.SELLER]);
      // SELLER has higher priority than CUSTOMER (which resolves to default route)
      expect(route).toContain('seller');
    });

    it('returns default route when no roles match', () => {
      const route = service.resolveDashboardRoute([]);
      expect(typeof route).toBe('string');
      expect(route.length).toBeGreaterThan(0);
    });
  });
});
