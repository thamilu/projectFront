// ============================================================
// __tests__/unit/hooks/use-auth.test.tsx
// Tests for the application's primary authentication hook — covers the
// error contract, role resolution, session-error translation, refresh
// deduplication, the open-redirect regression this hook now guards
// against directly, and the AuthStateProvider requirement itself.
//
// Uses AuthStateProvider's serviceOverride for dependency injection
// instead of jest.mock('@/domains/auth/services/auth-service') — the
// hook is designed to be testable this way (see auth-service.interface.ts).
// ============================================================

import type { ReactNode } from 'react';
import { renderHook, act } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { AuthStateProvider, useAuth } from '@/domains/auth/hooks/use-auth';
import { AUTH_SERVICE_CONFIG } from '@/domains/auth/services/auth-service.config';
import { UserRole } from '@/domains/auth/contracts/auth.types';
// Two distinct AuthErrorCode enums exist in this codebase: this one is the
// session-level (lib/auth) code use-auth.ts translates via
// SESSION_ERROR_MESSAGES; ServiceAuthErrorCode below is auth-service's own
// AuthResult error taxonomy — unrelated, aliased to avoid collision.
import { AuthErrorCode } from '@/lib/auth/types';
import { AuthErrorCode as ServiceAuthErrorCode } from '@/domains/auth/services/auth-result.types';
import type { AuthResult } from '@/domains/auth/services/auth-result.types';
import type { IAuthService } from '@/domains/auth/services/auth-service.interface';

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

jest.mock('@/core/telemetry/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const mockUseSession = useSession as jest.Mock;

function createMockAuthService(): jest.Mocked<IAuthService> {
  return {
    getNormalizedSession: jest.fn(),
    invalidateSession: jest.fn(),
    initiateLogin: jest.fn(),
    initiateLogout: jest.fn(),
    checkPermissions: jest.fn(),
    checkAllPermissions: jest.fn(),
    checkDeniedPermissions: jest.fn(),
    resolveDashboardRoute: jest.fn(),
  };
}

function mockSession(overrides: Record<string, unknown> = {}, update = jest.fn()) {
  mockUseSession.mockReturnValue({
    data: {
      user: { id: 'u1', name: 'Alice', email: 'alice@example.com', roles: [] },
      roles: [],
      ...overrides,
    },
    status: 'authenticated',
    update,
  });
  return update;
}

function renderUseAuth(service: IAuthService) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <AuthStateProvider serviceOverride={service}>{children}</AuthStateProvider>
  );
  return renderHook(() => useAuth(), { wrapper });
}

describe('useAuth', () => {
  let mockAuthService: jest.Mocked<IAuthService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthService = createMockAuthService();
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated', update: jest.fn() });
  });

  // ─── Provider requirement ─────────────────────────────────

  describe('AuthStateProvider requirement', () => {
    it('throws a clear error when used outside AuthStateProvider', () => {
      // Suppress React's expected "error boundary" console noise for this
      // one deliberately-throwing render.
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => renderHook(() => useAuth())).toThrow(/AuthStateProvider/);
      spy.mockRestore();
    });
  });

  // ─── Initial state ───────────────────────────────────────

  describe('initial state', () => {
    it('returns unauthenticated state when no session exists', () => {
      const { result } = renderUseAuth(mockAuthService);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('reflects isLoading while status is loading', () => {
      mockUseSession.mockReturnValue({ data: null, status: 'loading', update: jest.fn() });
      const { result } = renderUseAuth(mockAuthService);
      expect(result.current.isLoading).toBe(true);
    });
  });

  // ─── login() ──────────────────────────────────────────────

  describe('login()', () => {
    it('returns true and clears loginError on success', async () => {
      mockAuthService.initiateLogin.mockResolvedValue({ success: true, data: undefined });
      const { result } = renderUseAuth(mockAuthService);

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.login('/dashboard');
      });

      expect(success).toBe(true);
      expect(result.current.loginError).toBeNull();
    });

    it('returns false and sets loginError on failure — never throws', async () => {
      mockAuthService.initiateLogin.mockResolvedValue({
        success: false,
        error: { code: ServiceAuthErrorCode.LOGIN_FAILED, message: 'Authentication failed.' },
      });
      const { result } = renderUseAuth(mockAuthService);

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.login();
      });

      expect(success).toBe(false);
      expect(result.current.loginError?.message).toBe('Authentication failed.');
    });

    it('rejects an unsafe (external) callbackUrl before it reaches authService', async () => {
      mockAuthService.initiateLogin.mockResolvedValue({ success: true, data: undefined });
      const { result } = renderUseAuth(mockAuthService);

      await act(async () => {
        await result.current.login('https://evil.com/phish');
      });

      const calledWith = mockAuthService.initiateLogin.mock.calls[0][0] as string;
      expect(calledWith).not.toContain('evil.com');
    });

    it('toggles isLoggingIn around the call', async () => {
      let resolveLogin: (v: AuthResult) => void;
      mockAuthService.initiateLogin.mockReturnValue(
        new Promise((resolve) => {
          resolveLogin = resolve;
        })
      );
      const { result } = renderUseAuth(mockAuthService);

      let loginPromise!: Promise<boolean>;
      act(() => {
        loginPromise = result.current.login();
      });
      expect(result.current.isLoggingIn).toBe(true);

      await act(async () => {
        resolveLogin({ success: true, data: undefined });
        await loginPromise;
      });
      expect(result.current.isLoggingIn).toBe(false);
    });
  });

  // ─── logout() ─────────────────────────────────────────────

  describe('logout()', () => {
    it('returns true on success', async () => {
      mockAuthService.initiateLogout.mockResolvedValue({ success: true, data: undefined });
      const { result } = renderUseAuth(mockAuthService);

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.logout();
      });
      expect(success).toBe(true);
    });

    it('returns false and sets logoutError on failure — never throws (LogoutButton has no try/catch)', async () => {
      mockAuthService.initiateLogout.mockResolvedValue({
        success: false,
        error: { code: ServiceAuthErrorCode.LOGOUT_FAILED, message: 'Sign-out failed.' },
      });
      const { result } = renderUseAuth(mockAuthService);

      // A plain, unwrapped await is itself the "never throws" assertion —
      // if logout() rejected, this would fail the test via an unhandled
      // rejection before reaching the expectations below.
      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.logout();
      });

      expect(success).toBe(false);
      expect(result.current.logoutError?.message).toBe('Sign-out failed.');
    });
  });

  // ─── Role resolution ──────────────────────────────────────

  describe('hasRole() / hasAnyRole()', () => {
    it('returns true when the role is present in session.roles', () => {
      mockSession({ roles: [UserRole.SELLER] });
      const { result } = renderUseAuth(mockAuthService);
      expect(result.current.hasRole(UserRole.SELLER)).toBe(true);
    });

    it('returns false when the role is absent', () => {
      mockSession({ roles: [UserRole.CUSTOMER] });
      const { result } = renderUseAuth(mockAuthService);
      expect(result.current.hasRole(UserRole.SELLER)).toBe(false);
    });

    it('hasAnyRole returns true if any listed role matches', () => {
      mockSession({ roles: [UserRole.DELIVERY_AGENT] });
      const { result } = renderUseAuth(mockAuthService);
      expect(result.current.hasAnyRole([UserRole.SELLER, UserRole.DELIVERY_AGENT])).toBe(true);
    });

    it('derives isSeller/isCustomer/isDeliveryAgent from session.roles (multi-role)', () => {
      mockSession({ roles: [UserRole.CUSTOMER, UserRole.SELLER] });
      const { result } = renderUseAuth(mockAuthService);
      expect(result.current.isCustomer).toBe(true);
      expect(result.current.isSeller).toBe(true);
      expect(result.current.isDeliveryAgent).toBe(false);
    });
  });

  // ─── Combined error surface ───────────────────────────────

  describe('error', () => {
    it('is null when there is no session error or loginError', () => {
      mockSession();
      const { result } = renderUseAuth(mockAuthService);
      expect(result.current.error).toBeNull();
    });

    it('translates session.error into a curated message — never the raw AuthErrorCode', () => {
      mockSession({ error: AuthErrorCode.REFRESH_TOKEN_ERROR });
      const { result } = renderUseAuth(mockAuthService);
      expect(result.current.error).toBe('Your session has expired. Please sign in again.');
      expect(result.current.error).not.toBe(AuthErrorCode.REFRESH_TOKEN_ERROR);
    });

    it('falls back to loginError.message when there is no session.error', async () => {
      mockSession();
      mockAuthService.initiateLogin.mockResolvedValue({
        success: false,
        error: { code: ServiceAuthErrorCode.LOGIN_FAILED, message: 'Custom failure message' },
      });
      const { result } = renderUseAuth(mockAuthService);

      await act(async () => {
        await result.current.login();
      });

      expect(result.current.error).toBe('Custom failure message');
    });
  });

  // ─── refreshSession() ─────────────────────────────────────

  describe('refreshSession()', () => {
    it('calls next-auth update(), not getSession()', async () => {
      const update = mockSession();
      update.mockResolvedValue({ user: { id: 'u1' } });
      const { result } = renderUseAuth(mockAuthService);

      await act(async () => {
        await result.current.refreshSession();
      });

      expect(update).toHaveBeenCalled();
    });

    it('forwards a custom payload through to update() (e.g. useSellerSessionSync forceSync)', async () => {
      const update = mockSession();
      update.mockResolvedValue({ user: { id: 'u1' } });
      const { result } = renderUseAuth(mockAuthService);

      await act(async () => {
        await result.current.refreshSession({ forceSync: true, timestamp: 123 });
      });

      expect(update).toHaveBeenCalledWith({ forceSync: true, timestamp: 123 });
    });

    it('returns false when update() resolves null', async () => {
      const update = mockSession();
      update.mockResolvedValue(null);
      const { result } = renderUseAuth(mockAuthService);

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.refreshSession();
      });
      expect(success).toBe(false);
    });

    it('deduplicates concurrent calls', async () => {
      let resolveUpdate: (v: unknown) => void;
      const update = mockSession();
      update.mockReturnValue(
        new Promise((resolve) => {
          resolveUpdate = resolve;
        })
      );
      const { result } = renderUseAuth(mockAuthService);

      let p1!: Promise<boolean>;
      let p2!: Promise<boolean>;
      act(() => {
        p1 = result.current.refreshSession();
        p2 = result.current.refreshSession();
      });

      await act(async () => {
        resolveUpdate({ user: { id: 'u1' } });
        await Promise.all([p1, p2]);
      });

      expect(update).toHaveBeenCalledTimes(1);
    });

    it('does not throw when update() rejects', async () => {
      const update = mockSession();
      update.mockRejectedValue(new Error('network down'));
      const { result } = renderUseAuth(mockAuthService);

      await expect(
        act(async () => {
          await result.current.refreshSession();
        })
      ).resolves.not.toThrow();
    });
  });

  // ─── Shared instance across consumers ─────────────────────

  describe('shared instance', () => {
    it('two useAuth() calls within the same provider tree see the same isLoggingIn state', async () => {
      // renderHook() mounts its own independent tree per call, so two
      // separate renderHook() invocations — even with the same wrapper —
      // would each get their own AuthStateProvider instance and prove
      // nothing about sharing. Calling useAuth() twice from within ONE
      // rendered hook is what actually exercises two consumers reading
      // the same nearest <AuthStateProvider> ancestor.
      let resolveLogin: (v: AuthResult) => void;
      mockAuthService.initiateLogin.mockReturnValue(
        new Promise((resolve) => {
          resolveLogin = resolve;
        })
      );

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthStateProvider serviceOverride={mockAuthService}>{children}</AuthStateProvider>
      );
      const { result } = renderHook(() => ({ a: useAuth(), b: useAuth() }), { wrapper });

      let loginPromise!: Promise<boolean>;
      act(() => {
        loginPromise = result.current.a.login();
      });

      // `b` reflects the SAME in-flight login `a` triggered, because
      // AuthStateProvider computes AuthState once and shares it via
      // context — this is the actual behavior the audit's "singleton
      // auth action" reasoning was arguing for.
      expect(result.current.b.isLoggingIn).toBe(true);

      await act(async () => {
        resolveLogin({ success: true, data: undefined });
        await loginPromise;
      });
      expect(result.current.b.isLoggingIn).toBe(false);
    });
  });

  // ─── Session expiry ───────────────────────────────────────

  describe('session expiry', () => {
    it('isSessionExpiring is true within the warning buffer', () => {
      const expiresAt =
        Math.floor(Date.now() / 1000) +
        Math.floor(AUTH_SERVICE_CONFIG.sessionExpiryWarningBufferSeconds / 2);
      mockSession({ expiresAt });
      const { result } = renderUseAuth(mockAuthService);
      expect(result.current.isSessionExpiring).toBe(true);
      expect(result.current.isSessionExpired).toBe(false);
    });

    it('isSessionExpired is true once expiresAt has passed', () => {
      mockSession({ expiresAt: Math.floor(Date.now() / 1000) - 60 });
      const { result } = renderUseAuth(mockAuthService);
      expect(result.current.isSessionExpired).toBe(true);
    });

    it('neither flag is set when expiry is far in the future', () => {
      mockSession({ expiresAt: Math.floor(Date.now() / 1000) + 3600 });
      const { result } = renderUseAuth(mockAuthService);
      expect(result.current.isSessionExpiring).toBe(false);
      expect(result.current.isSessionExpired).toBe(false);
    });

    it('sessionExpiresAt is null when there is no session', () => {
      const { result } = renderUseAuth(mockAuthService);
      expect(result.current.sessionExpiresAt).toBeNull();
    });
  });
});
