'use client';

import { useState, useCallback, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { logger } from '@/core/telemetry/logger';
import { sanitizeCallbackUrl } from '@/domains/auth/utils/sanitize-callback-url';
import {
  AuthAlert,
  LoginLayout,
  LoginCard,
  LoginLogo,
  RetryButton,
  LoginLoadingState,
} from '@/features/auth';

const STUCK_SIGN_IN_TIMEOUT_MS = 15_000;

function RegisterContent() {
  const params = useSearchParams();
  const callbackUrl = sanitizeCallbackUrl(params?.get('callbackUrl') || params?.get('from'));
  const { status } = useSession();
  const router = useRouter();

  const hasStarted = useRef(false);
  const [failed, setFailed] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const alertRef = useRef<HTMLDivElement>(null);

  const startRegistration = useCallback(() => {
    setFailed(false);
    setTimedOut(false);
    setAttempt((n) => n + 1);
    signIn('keycloak', { callbackUrl }, { screen_hint: 'register' }).catch((err) => {
      logger.error('[RegisterPage] Failed to reach Keycloak registration', {
        error: err instanceof Error ? err.message : String(err),
      });
      setFailed(true);
    });
  }, [callbackUrl]);

  useEffect(() => {
    if (hasStarted.current || status === 'loading') return;
    hasStarted.current = true;
    if (status === 'authenticated') {
      router.replace(callbackUrl);
      return;
    }
    startRegistration();
  }, [status, callbackUrl, router, startRegistration]);

  useEffect(() => {
    if (failed) return;
    const timer = setTimeout(() => setTimedOut(true), STUCK_SIGN_IN_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [failed, attempt]);

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

function RegisterPageInner() {
  return (
    <LoginLayout>
      {/* <section>, not <main>: the root layout owns the document's single
          main landmark. A named section is still a `region` landmark, so the
          heading association is preserved. */}
      <section aria-labelledby="register-heading">
        <LoginCard>
          <LoginLogo />

          <h1
            id="register-heading"
            className="text-foreground mb-6 text-center text-2xl font-bold tracking-tight"
          >
            Create your eShop account
          </h1>

          <RegisterContent />
        </LoginCard>
      </section>
    </LoginLayout>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={<LoginLoadingState isSigningIn={true} label="Redirecting to registration..." />}
    >
      <RegisterPageInner />
    </Suspense>
  );
}
