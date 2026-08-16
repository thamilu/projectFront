/**
 * Login Page - Keycloak Authentication Gateway
 *
 * Safe-guards against infinite redirect loops
 * Shows manual retry buttons on connection/auth errors
 * Adheres to E-Shop Design System styling and WCAG accessibility standards.
 */

'use client';

import { useState, useCallback, useEffect, useRef, Suspense } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { logger } from '@/core/telemetry/logger';
import { DEFAULT_AUTH_ERROR_MESSAGE } from '@/lib/auth/constants';
import {
  AuthAlert,
  useKeycloakLogin,
  useAuthRedirect,
  useSessionExpiredAlert,
  useErrorMessage,
  LoginLayout,
  LoginCard,
  LoginLogo,
  RetryButton,
  LoginLoadingState,
} from '@/features/auth';

// Safety net for a sign-in attempt that never resolves or rejects (e.g. an
// unresponsive Keycloak instance hanging mid-request). Without this, a hung
// fetch leaves the user on an infinite spinner with no escape hatch.
const STUCK_SIGN_IN_TIMEOUT_MS = 15_000;

function LoginContent() {
  const { status } = useSession();
  const { callbackUrl, forceLogin, isAuthError, sessionExpired, errorCode } = useKeycloakLogin();

  const [isSigningIn, setIsSigningIn] = useState(false);
  const [signInFailed, setSignInFailed] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const { showMessage, dismiss } = useSessionExpiredAlert(sessionExpired);
  const errorMessage = useErrorMessage(errorCode);
  const alertRef = useRef<HTMLDivElement>(null);

  const handleRedirectStart = useCallback(() => {
    setSignInFailed(false);
    setTimedOut(false);
    setIsSigningIn(true);
  }, []);

  const handleRedirectError = useCallback((err: unknown) => {
    logger.error('[LoginPage] Automatic sign-in redirect failed', {
      error: err instanceof Error ? err.message : String(err),
    });
    setIsSigningIn(false);
    setSignInFailed(true);
  }, []);

  useAuthRedirect({
    status,
    isAuthError,
    sessionExpired,
    callbackUrl,
    forceLogin,
    onRedirectStart: handleRedirectStart,
    onRedirectError: handleRedirectError,
  });

  // If a sign-in attempt is still pending after STUCK_SIGN_IN_TIMEOUT_MS,
  // surface a manual retry instead of leaving the spinner running forever.
  useEffect(() => {
    if (!isSigningIn) return;
    const timer = setTimeout(() => setTimedOut(true), STUCK_SIGN_IN_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [isSigningIn]);

  const handleRetry = useCallback(async () => {
    if (isSigningIn && !timedOut) return;
    setSignInFailed(false);
    setTimedOut(false);
    setIsSigningIn(true);
    try {
      await signIn('keycloak', { callbackUrl });
    } catch (err) {
      logger.error('[LoginPage] Retry sign-in failed', {
        error: err instanceof Error ? err.message : String(err),
      });
      setIsSigningIn(false);
      setSignInFailed(true);
      toast.error("Couldn't reach the sign-in service", {
        description: 'Check your connection and try again.',
      });
    }
  }, [isSigningIn, timedOut, callbackUrl]);

  // Single source of truth for which non-session-expiry alert (if any) is
  // showing, so the alert's visibility and its aria-describedby wiring on
  // RetryButton can never drift out of sync with each other.
  const statusAlert =
    isAuthError && !sessionExpired
      ? {
          variant: 'error' as const,
          title: 'Authentication Error',
          description: errorMessage ?? DEFAULT_AUTH_ERROR_MESSAGE,
        }
      : signInFailed
        ? {
            variant: 'error' as const,
            title: 'Connection Problem',
            description: "We couldn't reach the sign-in service. Check your connection and try again.",
          }
        : timedOut
          ? {
              variant: 'warning' as const,
              title: 'Taking longer than expected',
              description: 'Sign-in is taking longer than usual. You can keep waiting or try again.',
            }
          : null;

  const showRetry = isAuthError || signInFailed || timedOut;

  // Move focus to whichever alert just appeared so keyboard/screen-reader
  // users are not left relying on DOM order alone to notice it.
  useEffect(() => {
    if (showMessage || statusAlert) {
      alertRef.current?.focus();
    }
    // Only re-focus when the alert identity actually changes, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMessage, statusAlert?.title]);

  return (
    <>
      {showMessage && (
        <AuthAlert
          ref={alertRef}
          variant="warning"
          title="Session Expired"
          description="Your session has expired. Please sign in again."
          onDismiss={dismiss}
        />
      )}

      {!showMessage && statusAlert && (
        <AuthAlert
          ref={alertRef}
          id="login-alert-desc"
          variant={statusAlert.variant}
          title={statusAlert.title}
          description={statusAlert.description}
        />
      )}

      {showRetry ? (
        <RetryButton
          isLoading={isSigningIn && !timedOut}
          onRetry={handleRetry}
          errorDescId={!showMessage && statusAlert ? 'login-alert-desc' : undefined}
        />
      ) : (
        <LoginLoadingState isSigningIn={isSigningIn} />
      )}
    </>
  );
}

export default function LoginPage() {
  return (
    <LoginLayout>
      <main aria-labelledby="login-heading">
        <LoginCard>
          <LoginLogo />

          <h1
            id="login-heading"
            className="text-foreground mb-6 text-center text-2xl font-bold tracking-tight"
          >
            Sign in to eShop
          </h1>

          {/* Heading first in DOM, alerts second for screen reader logical flow */}
          <Suspense fallback={<LoginLoadingState isSigningIn={true} />}>
            <LoginContent />
          </Suspense>
        </LoginCard>
      </main>
    </LoginLayout>
  );
}
