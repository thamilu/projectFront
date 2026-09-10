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
  /**
   * Called synchronously right before signIn() is invoked. Must return an
   * attempt id (e.g. a bumped generation counter) that the caller echoes
   * back via onRedirectError — this lets the caller detect and ignore a
   * late-settling rejection from an attempt that a newer retry has already
   * superseded, rather than clobbering fresher state.
   */
  onRedirectStart: () => number;
  /**
   * Called when the underlying signIn() call rejects (e.g. the IdP is
   * unreachable). Without this, a failed auto-redirect left the caller's
   * "signing in" UI state stuck forever — hasRedirected reset internally,
   * but nothing told the page to stop showing a spinner or offer a retry.
   */
  onRedirectError?: (error: unknown, attemptId: number) => void;
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
    // Precedence, highest first — an earlier condition here always wins
    // over a later one, regardless of what status also happens to be:
    //   1. isAuthError / sessionExpired  → never auto-redirect; the page
    //      shows a manual retry instead (see useKeycloakLogin's doc
    //      comment for why isAuthError is deliberately broad).
    //   2. hasRedirected.current         → already acted on this mount.
    //   3. status === 'authenticated'    → go straight to callbackUrl.
    //   4. status === 'unauthenticated'  → one automatic signIn attempt.
    //   5. status === 'loading'          → do nothing yet.
    if (isAuthError || sessionExpired || hasRedirected.current) return;

    // sessionExpired is already guaranteed false past the guard above —
    // this branch's own `&& !sessionExpired` would be dead weight.
    if (status === 'authenticated') {
      hasRedirected.current = true;
      onRedirectStart();
      router.replace(callbackUrl);
      return;
    }

    if (status === 'unauthenticated') {
      hasRedirected.current = true;
      const attemptId = onRedirectStart();

      if (forceLogin) {
        // Consume the forced-login request now, before starting the
        // redirect, so a later render of this same mount (or a plain page
        // reload once back on /login) doesn't see a stale sessionStorage
        // flag and force another fresh-credential prompt the user never
        // asked for a second time. This hook always runs client-side
        // ('use client' + useEffect), so no window-existence guard is
        // needed here — only a try/catch, since sessionStorage access
        // itself can throw in restrictive browser contexts (some private-
        // browsing modes), and that must never abort the sign-in attempt.
        try {
          sessionStorage.removeItem('force_login');
        } catch {
          // Storage unavailable — authentication proceeds regardless.
        }
        signIn('keycloak', { callbackUrl }, { prompt: 'login' }).catch((err) => {
          hasRedirected.current = false;
          onRedirectError?.(err, attemptId);
        });
      } else {
        signIn('keycloak', { callbackUrl }).catch((err) => {
          hasRedirected.current = false;
          onRedirectError?.(err, attemptId);
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
