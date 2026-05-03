"use client";

import { useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';

/**
 * Signin Redirect Page
 * Automatically redirects to Keycloak authentication
 * Checks session first to prevent redirect loops
 */
export default function SignInPage() {
  const params = useSearchParams();
  const router = useRouter();
  const { status } = useSession();
  const callbackUrl = params?.get('callbackUrl') || '/';

  useEffect(() => {
    // Wait for session to load
    if (status === 'loading') return;
    
    // If already authenticated, redirect to callback URL
    if (status === 'authenticated') {
      router.replace(callbackUrl);
      return;
    }
    
    // Only trigger signIn once when status becomes unauthenticated
    if (status === 'unauthenticated') {
      // Use a flag to prevent multiple calls
      const hasTriggered = sessionStorage.getItem('signin-triggered');
      if (!hasTriggered) {
        sessionStorage.setItem('signin-triggered', 'true');
        signIn('keycloak', { callbackUrl });
      }
    }
  }, [status, callbackUrl, router]);

  // Clear the flag when component unmounts
  useEffect(() => {
    return () => {
      sessionStorage.removeItem('signin-triggered');
    };
  }, []);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #3498db',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 20px'
        }} />
        <p style={{ color: '#666' }}>Redirecting to sign in...</p>
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
