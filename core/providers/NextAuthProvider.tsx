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

import React, { useEffect, useRef } from 'react';
import { SessionProvider, useSession, signOut } from 'next-auth/react';
import type { Session } from 'next-auth';
import { usePathname } from 'next/navigation';
import { logger } from '@/core/telemetry/logger';

interface Props {
  children: React.ReactNode;
  /**
   * The session, pre-fetched server-side (see app/layout.tsx) via `auth()`.
   *
   * Without this, `useSession()` starts every render at `status: 'loading'`
   * on both server and client, and `SessionProvider` only resolves the real
   * status via a `setState` inside a `useEffect` that fires after mount. On
   * a route with a Suspense boundary that's still hydrating when that
   * `setState` lands (e.g. app/(auth)/login), React can't safely apply it —
   * it discards the hydrated subtree and regenerates it client-side instead,
   * which is exactly the "Suspense boundary received an update before it
   * finished hydrating" class of hydration mismatch (a known next-auth/App
   * Router interaction — see nextauthjs/next-auth#7503). Seeding
   * `SessionProvider` with the already-resolved session means the client's
   * first render matches the server's from the start, so no such update is
   * needed during hydration.
   */
  session: Session | null;
}

/**
 * Routes where SessionErrorHandler must NOT trigger signOut.
 * Calling signOut on these routes creates an infinite redirect loop:
 *   signOut → /login?error=SessionExpired → session fetch → refresh fails
 *   → SessionErrorHandler detects error → signOut → /login?error=SessionExpired → ∞
 */
const AUTH_ROUTE_PREFIXES = ['/login', '/auth/', '/register'] as const;

function isAuthRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return AUTH_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/**
 * Session Error Handler - forces logout on token errors.
 *
 * Uses useRef for the handled flag to avoid re-render cascades.
 * Skips signOut entirely on auth routes to prevent redirect loops.
 */
function SessionErrorHandler({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const hasHandledError = useRef(false);

  useEffect(() => {
    // Guard: never trigger signOut on auth routes — prevents infinite loop
    if (isAuthRoute(pathname)) return;

    // If session has an error and we're authenticated, force logout (only once)
    if (session?.error && status === 'authenticated' && !hasHandledError.current) {
      logger.warn('[NextAuthProvider] Session error detected, forcing logout', {
        error: session.error,
        pathname,
      });
      hasHandledError.current = true;

      const fromPath = !pathname ? '/' : pathname;

      // Clear session and redirect to login
      signOut({
        callbackUrl: `/login?error=SessionExpired&from=${encodeURIComponent(fromPath)}`,
      });
    }
  }, [session?.error, status, pathname]);

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
export default function NextAuthProvider({ children, session }: Props) {
  return (
    <SessionProvider
      session={session}
      refetchInterval={0} // Disable automatic polling - prevents excessive session checks
      refetchOnWindowFocus={false} // Disable refetch on window focus - prevents duplicate calls
      refetchWhenOffline={false} // Disable offline refetch
      // Session is cached and reused across all useSession() hooks automatically
    >
      <SessionErrorHandler>{children}</SessionErrorHandler>
    </SessionProvider>
  );
}
