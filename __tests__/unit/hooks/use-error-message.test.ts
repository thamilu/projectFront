import { renderHook } from '@testing-library/react';
import { useErrorMessage } from '@/features/auth/hooks/use-error-message';
import { NEXT_AUTH_ERROR_MESSAGES, DEFAULT_AUTH_ERROR_MESSAGE } from '@/lib/auth/constants';

describe('useErrorMessage', () => {
  it('should return null if errorCode is null or empty', () => {
    const { result } = renderHook(() => useErrorMessage(null));
    expect(result.current).toBeNull();
  });

  it('should translate canonical NextAuth error codes correctly', () => {
    const { result } = renderHook(() => useErrorMessage('OAuthSignin'));
    expect(result.current).toBe(NEXT_AUTH_ERROR_MESSAGES.OAuthSignin);

    const { result: result2 } = renderHook(() => useErrorMessage('AccessDenied'));
    expect(result2.current).toBe(NEXT_AUTH_ERROR_MESSAGES.AccessDenied);
  });

  it('should return the default error message for unknown error codes', () => {
    const { result } = renderHook(() => useErrorMessage('UnknownErrorCode'));
    expect(result.current).toBe(DEFAULT_AUTH_ERROR_MESSAGE);
  });
});
