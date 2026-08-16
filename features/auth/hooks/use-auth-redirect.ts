'use client';

import { useEffect, useRef } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface UseAuthRedirectOptions {
  status: 'authenticated' | 'unauthenticated' | 'loading';
  isAuthError: boolean;
  sessionExpired: boolean;
  callbackUrl: string;
  forceLogin: boolean;
  onRedirectStart: () => void;
  /**
   * Called when the underlying signIn() call rejects (e.g. the IdP is
   * unreachable). Without this, a failed auto-redirect left the caller's
   * "signing in" UI state stuck forever — hasRedirected reset internally,
   * but nothing told the page to stop showing a spinner or offer a retry.
   */
  onRedirectError?: (error: unknown) => void;
}

/**
 * Hook to manage Keycloak authentication redirect lifecycle.
 * Prevents double-firing in StrictMode and redirect storm issues using useRef guard.
 */
export function useAuthRedirect({
  status,
  isAuthError,
  sessionExpired,
  callbackUrl,
  forceLogin,
  onRedirectStart,
  onRedirectError,
}: UseAuthRedirectOptions): void {
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // If there is an auth error, session has expired, or we already performed a redirect, stop here.
    if (isAuthError || sessionExpired || hasRedirected.current) return;

    if (status === 'authenticated' && !sessionExpired) {
      hasRedirected.current = true;
      onRedirectStart();
      router.replace(callbackUrl);
      return;
    }

    if (status === 'unauthenticated') {
      hasRedirected.current = true;
      onRedirectStart();

      if (forceLogin) {
        // Clear flag BEFORE calling signIn to prevent race condition loop
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('force_login');
        }
        signIn('keycloak', { callbackUrl }, { prompt: 'login' }).catch((err) => {
          hasRedirected.current = false;
          onRedirectError?.(err);
        });
      } else {
        signIn('keycloak', { callbackUrl }).catch((err) => {
          hasRedirected.current = false;
          onRedirectError?.(err);
        });
      }
    }
  }, [
    status,
    isAuthError,
    sessionExpired,
    callbackUrl,
    forceLogin,
    onRedirectStart,
    onRedirectError,
    router,
  ]);
}
