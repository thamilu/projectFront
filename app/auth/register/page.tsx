/**
 * Register Page - Redirect to Keycloak Registration
 *
 * Automatically redirects to Keycloak registration page
 */

'use client';

import { useEffect } from 'react';
import { signIn } from 'next-auth/react';

export default function RegisterPage() {
  useEffect(() => {
    // Use NextAuth signIn() to bypass intermediary page and go directly to Keycloak
    // The screen_hint parameter tells Keycloak to show registration form
    signIn('keycloak', { callbackUrl: '/' }, { screen_hint: 'register' });
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3498db',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px',
          }}
        />
        <p style={{ color: '#666' }}>Redirecting to Keycloak registration...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
