/**
 * Login Page - Keycloak Authentication
 *
 * Redirects authenticated users away immediately
 * Shows manual login button for unauthenticated users
 */

'use client';

import { useEffect, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function LoginPage() {
  const { status } = useSession();
  const params = useSearchParams();
  const router = useRouter();
  const callbackUrl = params?.get('callbackUrl') || '/';
  const forceLoginParam = params?.get('force_login') === '1' || params?.get('force_login') === 'true';
  const forceLoginStorage =
    typeof window !== 'undefined' && sessionStorage.getItem('force_login') === '1';
  const forceLogin = forceLoginParam || forceLoginStorage;
  const sessionExpired = params?.get('session_expired') === 'true';
  const [showMessage, setShowMessage] = useState(sessionExpired);

  useEffect(() => {
    // Hide message after 5 seconds
    if (showMessage) {
      const timer = setTimeout(() => setShowMessage(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showMessage]);

  useEffect(() => {
    // Only redirect if authenticated and session didn't just expire
    if (status === 'authenticated' && !sessionExpired) {
      router.replace(callbackUrl);
    }
    // If unauthenticated, trigger sign-in ONCE
    else if (status === 'unauthenticated') {
      if (forceLogin) {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('force_login');
        }
        signIn('keycloak', { callbackUrl }, { prompt: 'login' });
      } else {
        signIn('keycloak', { callbackUrl });
      }
    }
  }, [status, callbackUrl, router, forceLogin]);

  // Show minimal loading UI
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="mx-auto max-w-md px-4 text-center">
        {showMessage && (
          <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
            <p className="font-medium">Session Expired</p>
            <p className="mt-1 text-sm">Your session has expired. Please sign in again.</p>
          </div>
        )}
        <div className="border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
        <p className="text-muted-foreground">Redirecting to sign in...</p>
      </div>
    </div>
  );
}
