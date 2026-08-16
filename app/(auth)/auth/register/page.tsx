/**
 * Register Page - Keycloak Registration Gateway
 *
 * Mirrors app/(auth)/login/page.tsx: auto-redirects to Keycloak's
 * registration screen (via screen_hint), but surfaces a manual retry
 * instead of leaving the user on an infinite spinner if the IdP is
 * unreachable or slow to respond.
 */

'use client';

import { useState, useCallback, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { logger } from '@/core/telemetry/logger';
import { sanitizeCallbackUrl } from '@/features/auth/utils/sanitize-callback-url';
import {
  AuthAlert,
  LoginLayout,
  LoginCard,
  LoginLogo,
  RetryButton,
  LoginLoadingState,
} from '@/features/auth';

// Safety net for a registration hand-off that never resolves or rejects
// (e.g. an unresponsive Keycloak instance hanging mid-request).
const STUCK_SIGN_IN_TIMEOUT_MS = 15_000;

function RegisterContent() {
  const params = useSearchParams();
  const callbackUrl = sanitizeCallbackUrl(params?.get('callbackUrl') || params?.get('from'));

  const hasStarted = useRef(false);
  const [failed, setFailed] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const alertRef = useRef<HTMLDivElement>(null);

  const startRegistration = useCallback(() => {
    setFailed(false);
    setTimedOut(false);
    signIn('keycloak', { callbackUrl }, { screen_hint: 'register' }).catch((err) => {
      logger.error('[RegisterPage] Failed to reach Keycloak registration', {
        error: err instanceof Error ? err.message : String(err),
      });
      setFailed(true);
    });
  }, [callbackUrl]);

  // Auto-start once on mount (guarded against StrictMode double-invoke).
  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;
    startRegistration();
  }, [startRegistration]);

  // If the hand-off is still pending after STUCK_SIGN_IN_TIMEOUT_MS, surface
  // a manual retry instead of leaving the spinner running forever.
  useEffect(() => {
    if (failed) return;
    const timer = setTimeout(() => setTimedOut(true), STUCK_SIGN_IN_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [failed]);

  const handleRetry = useCallback(() => {
    startRegistration();
  }, [startRegistration]);

  const showRetry = failed || timedOut;

  useEffect(() => {
    if (showRetry) {
      alertRef.current?.focus();
    }
  }, [showRetry]);

  return (
    <>
      {showRetry && (
        <AuthAlert
          ref={alertRef}
          id="register-alert-desc"
          variant={failed ? 'error' : 'warning'}
          title={failed ? 'Connection Problem' : 'Taking longer than expected'}
          description={
            failed
              ? "We couldn't reach the registration service. Check your connection and try again."
              : 'Redirecting to registration is taking longer than usual. You can keep waiting or try again.'
          }
        />
      )}

      {showRetry ? (
        <RetryButton
          isLoading={false}
          onRetry={handleRetry}
          errorDescId="register-alert-desc"
          label="Try Again"
          loadingLabel="Redirecting to registration..."
        />
      ) : (
        <LoginLoadingState isSigningIn={true} label="Redirecting to registration..." />
      )}
    </>
  );
}

export default function RegisterPage() {
  return (
    <LoginLayout>
      <main aria-labelledby="register-heading">
        <LoginCard>
          <LoginLogo />

          <h1
            id="register-heading"
            className="text-foreground mb-6 text-center text-2xl font-bold tracking-tight"
          >
            Create your eShop account
          </h1>

          <Suspense
            fallback={<LoginLoadingState isSigningIn={true} label="Redirecting to registration..." />}
          >
            <RegisterContent />
          </Suspense>
        </LoginCard>
      </main>
    </LoginLayout>
  );
}
