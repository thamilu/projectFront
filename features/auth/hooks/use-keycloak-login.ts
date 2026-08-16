'use client';

import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { sanitizeCallbackUrl } from '../utils/sanitize-callback-url';

/**
 * Custom hook to derive Keycloak login settings, callback URLs,
 * and loop prevention states from search parameters and storage.
 */
export function useKeycloakLogin() {
  const params = useSearchParams();

  const callbackUrl = useMemo(
    () => sanitizeCallbackUrl(params?.get('callbackUrl') || params?.get('from')),
    [params]
  );

  const forceLogin = useMemo(() => {
    const forceLoginParam =
      params?.get('force_login') === '1' || params?.get('force_login') === 'true';
    const forceLoginStorage =
      typeof window !== 'undefined' && sessionStorage.getItem('force_login') === '1';
    return forceLoginParam || forceLoginStorage;
  }, [params]);

  const errorCode = params?.get('error');

  /**
   * SessionExpired is now treated as an auth error to prevent the auto-redirect
   * to Keycloak when the session is broken (which causes an infinite loop).
   * Any non-null error code is considered an auth error — the login page will
   * show a retry button instead of silently redirecting.
   */
  const isAuthError = useMemo(() => {
    return errorCode !== null && errorCode !== undefined;
  }, [errorCode]);

  /**
   * Separate flag for the UI to distinguish session expiry from other errors
   * (e.g., showing "Your session has expired" vs "Authentication Error").
   */
  const sessionExpired = useMemo(() => {
    return params?.get('session_expired') === 'true' || errorCode === 'SessionExpired';
  }, [params, errorCode]);

  return {
    callbackUrl,
    forceLogin,
    isAuthError,
    sessionExpired,
    errorCode,
  };
}
