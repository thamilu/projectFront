/**
 * AuthGate.tsx
 *
 * Authentication gate component for unauthenticated users.
 * Part of the profile feature authentication flow.
 *
 * Design Decisions:
 * - Displayed when user attempts to access profile without authentication
 * - Delegates authentication to NextAuth (Keycloak provider)
 * - Simple, focused UI with clear call-to-action
 * - No props (stateless guard component)
 *
 * Technical Constraints:
 * - Must be used as client component ('use client')
 * - Requires NextAuth session provider in app layout
 * - Auth provider configured in AUTH_PROVIDER constant
 *
 * Error Handling:
 * - signIn() errors handled by NextAuth
 * - Redirects handled by NextAuth configuration
 * - No local error state needed
 *
 * @example
 * ```tsx
 * // In ProfileForm.tsx
 * if (status === 'unauthenticated') {
 *   return <AuthGate />;
 * }
 * ```
 *
 * @see {@link ProfileForm} - Parent component that uses AuthGate
 */

'use client';

import { useCallback, memo } from 'react';
import { ShieldCheck } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { Button } from '@/shared/ui/atoms/button';
import { AUTH_PROVIDER } from '../utils/profile.constants';

/**
 * Authentication gate component
 *
 * Displays when user is not authenticated and attempts to access profile.
 * Provides clear messaging and single sign-in action.
 *
 * Performance:
 * - Memoized with no props (renders once, never re-renders)
 * - useCallback with empty deps (stable handler reference)
 *
 * Accessibility:
 * - Semantic HTML (main landmark)
 * - ARIA labels for screen readers
 * - Keyboard accessible button
 *
 * @example
 * ```tsx
 * <AuthGate />
 * ```
 */
export const AuthGate = memo(function AuthGate() {
  /**
   * Initiates authentication flow via NextAuth
   * Redirects to configured Keycloak provider
   */
  const handleSignIn = useCallback(() => signIn(AUTH_PROVIDER), []);

  return (
    // Not a <main> — AuthGate's only real usage (ProfileForm, inside
    // app/(customer)/account/profile/page.tsx) is always already nested
    // inside that page's own <main id="main-content">. A second <main>
    // here would be an invalid nested landmark, confusing screen reader
    // landmark navigation; aria-labelledby alone gives this section an
    // accessible name without claiming the page's one primary landmark.
    <div
      className="mx-auto max-w-5xl space-y-6 p-6 py-20 text-center"
      aria-labelledby="auth-heading"
    >
      <div className="bg-muted/20 border-muted-foreground/20 rounded-3xl border border-dashed p-12">
        <ShieldCheck
          className="text-muted-foreground mx-auto mb-4 h-16 w-16 opacity-50"
          aria-hidden="true"
        />
        <h2 id="auth-heading" className="text-2xl font-bold">
          Authentication Required
        </h2>
        <p className="text-muted-foreground mx-auto mt-2 max-w-md">
          Please sign in to view and manage your profile information.
        </p>
        <Button type="button" onClick={handleSignIn} className="mt-8 h-12 px-8">
          Sign In Now
        </Button>
      </div>
    </div>
  );
});

AuthGate.displayName = 'AuthGate';
