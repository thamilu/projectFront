'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/http/services';

export default function PkceCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    async function finishAuth() {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');

        if (!code || !state) {
          setMessage('Missing code or state in callback.');
          return;
        }

        const codeVerifier = sessionStorage.getItem('pkce_code_verifier');
        const savedState = sessionStorage.getItem('pkce_state');
        const redirectTo = sessionStorage.getItem('pkce_redirect_to') || '/';

        if (!codeVerifier || savedState !== state) {
          setMessage('PKCE verifier missing or state mismatch. Please retry login.');
          return;
        }

        // Post to server exchange endpoint which will create session cookies
        const nonce = sessionStorage.getItem('pkce_nonce');

        const { data: body } = await apiClient.post('/api/auth/keycloak/exchange', {
          code,
          code_verifier: codeVerifier,
          state,
          redirectTo,
          nonce
        });

        // On success, server returns { ok: true, redirectTo }
        // Clear PKCE values now that exchange completed
        sessionStorage.removeItem('pkce_code_verifier');
        sessionStorage.removeItem('pkce_state');
        sessionStorage.removeItem('pkce_nonce');
        sessionStorage.removeItem('pkce_redirect_to');

        router.replace(body.redirectTo || '/');
      } catch (err) {
        console.error('PKCE callback error', err);
        setMessage('Unexpected error completing authentication.');
      }
    }

    finishAuth();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-xl font-semibold">{message}</h1>
      </div>
    </div>
  );
}
