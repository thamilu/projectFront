import { renderHook } from '@testing-library/react';
import { useAuthRedirect } from '@/features/auth/hooks/use-auth-redirect';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

jest.mock('next-auth/react', () => ({
  signIn: jest.fn(() => Promise.resolve()),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('useAuthRedirect', () => {
  const mockReplace = jest.fn();
  const mockOnRedirectStart = jest.fn();

  let removeItemSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      replace: mockReplace,
    });
    // Mock sessionStorage
    removeItemSpy = jest.spyOn(Storage.prototype, 'removeItem');
  });

  afterEach(() => {
    removeItemSpy.mockRestore();
  });

  it('should not redirect if isAuthError is true', () => {
    renderHook(() =>
      useAuthRedirect({
        status: 'authenticated',
        isAuthError: true,
        sessionExpired: false,
        callbackUrl: '/dashboard',
        forceLogin: false,
        onRedirectStart: mockOnRedirectStart,
      })
    );

    expect(mockReplace).not.toHaveBeenCalled();
    expect(signIn).not.toHaveBeenCalled();
    expect(mockOnRedirectStart).not.toHaveBeenCalled();
  });

  it('should redirect and trigger onRedirectStart when status is authenticated and not session expired', () => {
    renderHook(() =>
      useAuthRedirect({
        status: 'authenticated',
        isAuthError: false,
        sessionExpired: false,
        callbackUrl: '/dashboard',
        forceLogin: false,
        onRedirectStart: mockOnRedirectStart,
      })
    );

    expect(mockOnRedirectStart).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith('/dashboard');
    expect(signIn).not.toHaveBeenCalled();
  });

  it('should call signIn when status is unauthenticated and forceLogin is false', () => {
    renderHook(() =>
      useAuthRedirect({
        status: 'unauthenticated',
        isAuthError: false,
        sessionExpired: false,
        callbackUrl: '/dashboard',
        forceLogin: false,
        onRedirectStart: mockOnRedirectStart,
      })
    );

    expect(mockOnRedirectStart).toHaveBeenCalledTimes(1);
    expect(signIn).toHaveBeenCalledWith('keycloak', { callbackUrl: '/dashboard' });
  });

  it('should call signIn with login prompt and clear sessionStorage force_login when forceLogin is true', () => {
    renderHook(() =>
      useAuthRedirect({
        status: 'unauthenticated',
        isAuthError: false,
        sessionExpired: false,
        callbackUrl: '/dashboard',
        forceLogin: true,
        onRedirectStart: mockOnRedirectStart,
      })
    );

    expect(mockOnRedirectStart).toHaveBeenCalledTimes(1);
    expect(removeItemSpy).toHaveBeenCalledWith('force_login');
    expect(signIn).toHaveBeenCalledWith(
      'keycloak',
      { callbackUrl: '/dashboard' },
      { prompt: 'login' }
    );
  });

  it('should prevent multiple redirects using strict mode ref guard', () => {
    const { rerender } = renderHook(
      ({ status }) =>
        useAuthRedirect({
          status,
          isAuthError: false,
          sessionExpired: false,
          callbackUrl: '/dashboard',
          forceLogin: false,
          onRedirectStart: mockOnRedirectStart,
        }),
      {
        initialProps: { status: 'authenticated' as const },
      }
    );

    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockOnRedirectStart).toHaveBeenCalledTimes(1);

    // Simulate strict mode double-trigger / re-render
    rerender({ status: 'authenticated' });

    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockOnRedirectStart).toHaveBeenCalledTimes(1);
  });

  it('should call onRedirectError and reset the redirected guard when signIn rejects', async () => {
    const failure = new Error('network down');
    (signIn as jest.Mock).mockReturnValueOnce(Promise.reject(failure));
    const mockOnRedirectError = jest.fn();

    renderHook(() =>
      useAuthRedirect({
        status: 'unauthenticated',
        isAuthError: false,
        sessionExpired: false,
        callbackUrl: '/dashboard',
        forceLogin: false,
        onRedirectStart: mockOnRedirectStart,
        onRedirectError: mockOnRedirectError,
      })
    );

    // Flush the rejected signIn() microtask.
    await Promise.resolve().then().then();

    expect(mockOnRedirectError).toHaveBeenCalledWith(failure);
  });
});
