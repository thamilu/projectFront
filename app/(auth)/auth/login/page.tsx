/**
 * Auth Login Page — Keycloak SSO
 *
 * Immediately initiates Keycloak login flow.
 * Any callbackUrl in the query string is forwarded.
 */

'use client';

import { useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AuthLoginPage() {
  const { status } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();

  const callbackUrl = searchParams?.get('callbackUrl') || searchParams?.get('redirect') || '/';
  const error = searchParams?.get('error');
  const forceLogin = searchParams?.get('force_login') === '1' || searchParams?.get('force_login') === 'true';

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace(callbackUrl);
      return;
    }

    if (status === 'unauthenticated') {
      const extraParams: Record<string, string> = {};
      if (forceLogin) extraParams.prompt = 'login';
      if (error) extraParams.error = error;
      signIn('keycloak', { callbackUrl }, Object.keys(extraParams).length ? extraParams : undefined);
    }
  }, [status, callbackUrl, router, forceLogin, error]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">Redirecting to sign in…</p>
      </div>
    </div>
  );
}
