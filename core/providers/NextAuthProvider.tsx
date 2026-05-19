/**
 * NextAuth Session Provider Wrapper
 *
 * Wraps the app with NextAuth SessionProvider for authentication state management.
 * Configured with automatic session refetch and window focus refetch.
 * Handles expired sessions by forcing re-authentication.
 *
 * @module components/NextAuthProvider
 */

'use client';

import React, { useEffect } from 'react';
import { SessionProvider, useSession, signOut } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';

interface Props {
  children: React.ReactNode;
}

/**
 * Session Error Handler - forces logout on token errors
 * Optimized to prevent excessive session checks
 */
function SessionErrorHandler({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [hasHandledError, setHasHandledError] = React.useState(false);

  useEffect(() => {
    // If session has an error and we're authenticated, force logout (only once)
    if (session?.error && status === 'authenticated' && !hasHandledError) {
      console.warn('[NextAuthProvider] Session error detected, forcing logout:', session.error);
      setHasHandledError(true);

      // Clear session and redirect to login
      signOut({
        callbackUrl: `/login?error=SessionExpired&from=${encodeURIComponent(pathname || '')}`,
      });
    }
  }, [session?.error, status, pathname, router, hasHandledError]);

  return <>{children}</>;
}

/**
 * NextAuth Provider Component
 *
 * Optimized session management:
 * - No automatic polling (only fetches when explicitly needed)
 * - No refetch on window focus (prevents excessive API calls)
 * - Token refresh handled automatically by NextAuth JWT callback
 *
 * Should be placed high in the component tree (typically in root layout)
 *
 * @example
 * ```tsx
 * <NextAuthProvider>
 *   <App />
 * </NextAuthProvider>
 * ```
 */
export default function NextAuthProvider({ children }: Props) {
  return (
    <SessionProvider
      refetchInterval={0} // Disable automatic polling - prevents excessive session checks
      refetchOnWindowFocus={false} // Disable refetch on window focus - prevents duplicate calls
      refetchWhenOffline={false} // Disable offline refetch
      // Session is cached and reused across all useSession() hooks automatically
    >
      <SessionErrorHandler>{children}</SessionErrorHandler>
    </SessionProvider>
  );
}
