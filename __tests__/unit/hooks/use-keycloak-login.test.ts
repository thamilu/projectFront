// ============================================================
// __tests__/unit/hooks/use-keycloak-login.test.ts
// Tests for the login page's URL/storage state-derivation hook. Priority
// cases: isAuthError must stay broad (any error= param, not an allowlist —
// see the hook's own doc comment for why a narrower allowlist would
// reintroduce the redirect loop this flag exists to prevent), and
// callbackUrl must actually be sanitized, not just passed through.
// ============================================================

import { renderHook } from '@testing-library/react';
import { useSearchParams } from 'next/navigation';
import { useKeycloakLogin } from '@/features/auth/hooks/use-keycloak-login';

const mockGet = jest.fn();

jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
}));

function setParams(values: Record<string, string>) {
  mockGet.mockImplementation((key: string) => values[key] ?? null);
  (useSearchParams as jest.Mock).mockReturnValue({ get: mockGet });
}

describe('useKeycloakLogin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setParams({});
    sessionStorage.clear();
  });

  describe('callbackUrl', () => {
    it('sanitizes the callbackUrl param, not just passes it through', () => {
      setParams({ callbackUrl: 'https://evil.com/phish' });
      const { result } = renderHook(() => useKeycloakLogin());
      expect(result.current.callbackUrl).not.toContain('evil.com');
    });

    it('falls back to "from" when callbackUrl is absent', () => {
      setParams({ from: '/dashboard' });
      const { result } = renderHook(() => useKeycloakLogin());
      expect(result.current.callbackUrl).toBe('/dashboard');
    });

    it('passes through a safe relative path unchanged', () => {
      setParams({ callbackUrl: '/orders' });
      const { result } = renderHook(() => useKeycloakLogin());
      expect(result.current.callbackUrl).toBe('/orders');
    });
  });

  describe('forceLogin', () => {
    it('is true for force_login=1', () => {
      setParams({ force_login: '1' });
      const { result } = renderHook(() => useKeycloakLogin());
      expect(result.current.forceLogin).toBe(true);
    });

    it('is true for force_login=true', () => {
      setParams({ force_login: 'true' });
      const { result } = renderHook(() => useKeycloakLogin());
      expect(result.current.forceLogin).toBe(true);
    });

    it('is false when absent', () => {
      setParams({});
      const { result } = renderHook(() => useKeycloakLogin());
      expect(result.current.forceLogin).toBe(false);
    });

    it('is true when sessionStorage has force_login=1, even without the URL param', () => {
      sessionStorage.setItem('force_login', '1');
      setParams({});
      const { result } = renderHook(() => useKeycloakLogin());
      expect(result.current.forceLogin).toBe(true);
    });

    it('is true when sessionStorage has force_login=true (normalized, same as the URL param)', () => {
      sessionStorage.setItem('force_login', 'true');
      setParams({});
      const { result } = renderHook(() => useKeycloakLogin());
      expect(result.current.forceLogin).toBe(true);
    });

    it('does not throw when sessionStorage access itself throws', () => {
      const spy = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('storage disabled');
      });
      setParams({});
      expect(() => renderHook(() => useKeycloakLogin())).not.toThrow();
      spy.mockRestore();
    });
  });

  describe('errorCode / isAuthError', () => {
    it('errorCode is null when absent', () => {
      setParams({});
      const { result } = renderHook(() => useKeycloakLogin());
      expect(result.current.errorCode).toBeNull();
      expect(result.current.isAuthError).toBe(false);
    });

    it('isAuthError is true for a known NextAuth error code', () => {
      setParams({ error: 'AccessDenied' });
      const { result } = renderHook(() => useKeycloakLogin());
      expect(result.current.isAuthError).toBe(true);
    });

    it('isAuthError is true for an unrecognized/future error code (deliberately not an allowlist)', () => {
      // Regression test for the exact scenario the hook's doc comment
      // warns about: a code this app has never seen before must still
      // suppress auto-redirect, or a genuinely new NextAuth/Keycloak
      // error would silently resume the loop this flag prevents.
      setParams({ error: 'SomeFutureErrorCodeThisAppHasNeverSeen' });
      const { result } = renderHook(() => useKeycloakLogin());
      expect(result.current.isAuthError).toBe(true);
    });
  });

  describe('sessionExpired', () => {
    it('is true for session_expired=true', () => {
      setParams({ session_expired: 'true' });
      const { result } = renderHook(() => useKeycloakLogin());
      expect(result.current.sessionExpired).toBe(true);
    });

    it('is true for error=SessionExpired', () => {
      setParams({ error: 'SessionExpired' });
      const { result } = renderHook(() => useKeycloakLogin());
      expect(result.current.sessionExpired).toBe(true);
    });

    it('is false otherwise', () => {
      setParams({ error: 'AccessDenied' });
      const { result } = renderHook(() => useKeycloakLogin());
      expect(result.current.sessionExpired).toBe(false);
    });
  });

  describe('resilience', () => {
    it('does not throw when useSearchParams() itself returns null', () => {
      (useSearchParams as jest.Mock).mockReturnValue(null);
      expect(() => renderHook(() => useKeycloakLogin())).not.toThrow();
    });
  });
});
