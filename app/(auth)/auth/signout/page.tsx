'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { signOut } from 'next-auth/react';
import { APP_ROUTES } from '@/shared/routes';
import { logger } from '@/core/telemetry/logger';
import { AuthAlert, RetryButton, LoginLoadingState } from '@/features/auth';

// Safety net for a sign-out request that never resolves or rejects (e.g. an
// unresponsive auth provider hanging mid-request). Without this, a hung
// signOut() call leaves the user on an infinite spinner with no escape hatch.
const STUCK_SIGN_OUT_TIMEOUT_MS = 15_000;

export default function SignOutPage() {
  const hasStarted = useRef(false);
  const [failed, setFailed] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  // Bumped on every sign-out attempt (initial + each retry) so the
  // stuck-timeout effect re-arms even when a retry-from-timeout doesn't
  // actually change `failed`'s value — see that effect below.
  const [attempt, setAttempt] = useState(0);
  const alertRef = useRef<HTMLDivElement>(null);

  const startSignOut = useCallback(() => {
    setFailed(false);
    setTimedOut(false);
    setAttempt((n) => n + 1);
    signOut({ callbackUrl: APP_ROUTES.AUTH_LOGIN }).catch((err) => {
      logger.error('[SignOutPage] Sign-out failed', {
        error: err instanceof Error ? err.message : String(err),
      });
      setFailed(true);
    });
  }, []);

  // Auto-start once on mount (guarded against StrictMode double-invoke).
  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;
    startSignOut();
  }, [startSignOut]);

  // If the sign-out is still pending after STUCK_SIGN_OUT_TIMEOUT_MS,
  // surface a manual retry instead of leaving the spinner running forever.
  useEffect(() => {
    if (failed) return;
    const timer = setTimeout(() => setTimedOut(true), STUCK_SIGN_OUT_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [failed, attempt]);

  const handleRetry = useCallback(() => {
    startSignOut();
  }, [startSignOut]);

  const showRetry = failed || timedOut;

  // Move focus to the alert as soon as it appears so keyboard/screen-reader
  // users aren't left relying on DOM order alone to notice it.
  useEffect(() => {
    if (showRetry) {
      alertRef.current?.focus();
    }
  }, [showRetry]);

  return (
    <div className="bg-background flex h-screen w-full items-center justify-center">
      <div className="flex w-full max-w-xs flex-col items-center gap-4 px-4">
        {showRetry && (
          <AuthAlert
            ref={alertRef}
            id="signout-alert-desc"
            variant={failed ? 'error' : 'warning'}
            title={failed ? 'Connection Problem' : 'Taking longer than expected'}
            description={
              failed
                ? "We couldn't complete sign-out. Check your connection and try again."
                : 'Signing out is taking longer than usual. You can keep waiting or try again.'
            }
          />
        )}

        {showRetry ? (
          <RetryButton
            isLoading={false}
            onRetry={handleRetry}
            errorDescId="signout-alert-desc"
            label="Try Again"
            loadingLabel="Signing you out..."
          />
        ) : (
          <LoginLoadingState isSigningIn={false} label="Signing you out..." />
        )}
      </div>
    </div>
  );
}
