'use client';

import { useState, useCallback, useEffect, useRef, Suspense } from 'react';
import { signIn, useSession } from 'next-auth/react';
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
  const attemptIdRef = useRef(0);

  const handleRedirectStart = useCallback(() => {
    setSignInFailed(false);
    setTimedOut(false);
    setIsSigningIn(true);
    return ++attemptIdRef.current;
  }, []);

  const handleRedirectError = useCallback((err: unknown, attemptId: number) => {
    if (attemptId !== attemptIdRef.current) return;
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
    const attemptId = ++attemptIdRef.current;
    try {
      if (forceLogin) {
        await signIn('keycloak', { callbackUrl }, { prompt: 'login' });
      } else {
        await signIn('keycloak', { callbackUrl });
      }
    } catch (err) {
      if (attemptId !== attemptIdRef.current) return;
      logger.error('[LoginPage] Retry sign-in failed', {
        error: err instanceof Error ? err.message : String(err),
      });
      setIsSigningIn(false);
      setSignInFailed(true);
    }
  }, [isSigningIn, timedOut, callbackUrl, forceLogin]);

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

  const errorDescId = showMessage
    ? 'login-session-expired-desc'
    : statusAlert
      ? 'login-alert-desc'
      : undefined;

  useEffect(() => {
    if (showMessage || statusAlert) {
      alertRef.current?.focus();
    }
  }, [showMessage, statusAlert?.title]);

  return (
    <>
      {showMessage && (
        <AuthAlert
          ref={alertRef}
          id="login-session-expired-desc"
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
        <RetryButton isLoading={isSigningIn && !timedOut} onRetry={handleRetry} errorDescId={errorDescId} />
      ) : (
        <LoginLoadingState isSigningIn={isSigningIn} />
      )}
    </>
  );
}

function LoginPageInner() {
  return (
    <LoginLayout>
      {/* <section>, not <main> — see the note in auth/register/page.tsx. */}
      <section aria-labelledby="login-heading">
        <LoginCard>
          <LoginLogo />

          <h1
            id="login-heading"
            className="text-foreground mb-6 text-center text-2xl font-bold tracking-tight"
          >
            Sign in to eShop
          </h1>

          <LoginContent />
        </LoginCard>
      </section>
    </LoginLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoadingState isSigningIn={true} />}>
      <LoginPageInner />
    </Suspense>
  );
}
