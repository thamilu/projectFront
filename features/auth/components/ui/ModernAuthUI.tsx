/**
 * Modern Authentication UI Component
 *
 * Standalone auth card (login / authenticated / loading states), built on
 * the same NextAuth-backed useAuth() hook as the rest of this feature — see
 * app/(auth)/login/page.tsx for the app's actual login gateway route. This
 * component is exported from @/features/auth as a reusable "drop-in" auth
 * card for contexts that need one embedded (e.g. a modal) rather than a
 * dedicated page; it is not currently wired into any app/ route.
 *
 * @module components/auth/ModernAuthUI
 */

'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, UserPlus, Loader2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/shared/ui/atoms/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/ui/atoms/card';
import { useAuth } from '@/features/auth';
import { sanitizeCallbackUrl } from '@/domains/auth/utils/sanitize-callback-url';
import { cn } from '@/shared/utils';
import { APP_ROUTES } from '@/shared/routes';

interface ModernAuthUIProps {
  redirectTo?: string;
  showRegister?: boolean;
  className?: string;
}

/** How long the success toast/authenticated state is visible before navigating away. */
const AUTH_REDIRECT_DELAY_MS = 500;

// sessionStorage can throw (SecurityError) in sandboxed iframes or certain
// privacy-mode browser configurations — plausible here given this
// component's own docs describe embedded/modal usage. Failing closed (treat
// as "no stored redirect") is correct: it just falls back to `redirectTo`.
function safeSessionStorageGet(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSessionStorageRemove(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // Nothing to clean up if storage isn't accessible in the first place.
  }
}

/**
 * Modern Authentication UI
 *
 * Features:
 * - One-click Keycloak SSO login
 * - Registration redirect
 * - Loading states
 * - Error handling
 * - Accessible keyboard navigation
 * - Responsive design
 */
export function ModernAuthUI({
  redirectTo = APP_ROUTES.DASHBOARD,
  showRegister = true,
  className,
}: ModernAuthUIProps) {
  const router = useRouter();
  const {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    error,
    loginError,
    isLoggingIn,
    isLoggingOut,
  } = useAuth();

  // One-shot snapshot of "was the user already authenticated the instant this
  // component mounted" — never updated after mount. Lets the welcome toast
  // fire only for a sign-in transition that happens during this component's
  // own lifetime, not for every revisit while an existing session is still
  // valid (which would otherwise re-fire the toast on every mount).
  const wasAlreadyAuthenticatedRef = useRef(isAuthenticated);

  // Tracks "has the auto-redirect sequence already been kicked off for the
  // CURRENT authenticated session" — a ref, not state, because it's purely
  // an internal re-entry guard with no bearing on what renders. It used to
  // be state that also gated the buttons-vs-spinner JSX below; that coupled
  // "don't restart the toast/timer on every re-render" with "hide the
  // Continue to App / Sign Out buttons", and since the state flip happened
  // essentially the instant the component became authenticated, those
  // buttons were never actually visible/clickable for a real user (at best
  // one paint frame) despite being the intended manual override to the
  // auto-redirect. Decoupling: the buttons are now always shown alongside a
  // "redirecting shortly" status line (see JSX below) so they're genuinely
  // usable during the delay, while this ref still ensures the effect only
  // fires once per sign-in, not on every unrelated re-render.
  const redirectStartedRef = useRef(false);

  /**
   * Handle successful authentication redirect
   */
  useEffect(() => {
    if (!isAuthenticated) {
      // Reset so a persisted instance of this "drop-in" card (its own docs
      // describe modal/embedded usage, i.e. it may never unmount) runs the
      // redirect flow again on a subsequent login rather than no-op'ing.
      redirectStartedRef.current = false;
      return;
    }
    if (redirectStartedRef.current) return;
    redirectStartedRef.current = true;

    // Check for a stored redirect (set by a route guard before bouncing an
    // unauthenticated user here). sanitizeCallbackUrl constrains it to a
    // same-origin relative path — same validation used by the login/register
    // gateways — since this value ultimately reaches router.push() directly,
    // bypassing NextAuth's own server-side redirect validation.
    const storedRedirect =
      typeof window !== 'undefined' ? safeSessionStorageGet('auth_redirect') : null;
    const destination = sanitizeCallbackUrl(storedRedirect || redirectTo);

    if (!wasAlreadyAuthenticatedRef.current) {
      toast.success('Welcome back!', {
        description: `Signed in as ${user?.name || user?.email || 'your account'}`,
        icon: <CheckCircle2 className="h-4 w-4" aria-hidden="true" />,
      });
    }

    if (typeof window !== 'undefined') {
      safeSessionStorageRemove('auth_redirect');
    }

    // Redirect after a short delay — long enough for the toast/manual
    // buttons below to be visible, short enough to feel automatic. If the
    // user clicks "Sign Out" during this window, isAuthenticated flips
    // false, the effect re-runs, and this cleanup cancels the pending
    // navigation before it can fire.
    const timerId = setTimeout(() => {
      router.push(destination);
    }, AUTH_REDIRECT_DELAY_MS);

    return () => clearTimeout(timerId);
  }, [isAuthenticated, redirectTo, router, user]);

  /**
   * Handle authentication errors. Depends on `loginError` (not just the
   * derived `error` string) because AR.fail() constructs a fresh AuthError
   * object on every failed attempt even when its .message text is
   * identical — e.g. two consecutive "Authentication failed" results in a
   * row. React's dependency comparison is by value, so keying this effect
   * on the string alone would silently skip the toast on a repeat failure;
   * the object reference always changes, so it doesn't.
   */
  useEffect(() => {
    if (error) {
      toast.error('Authentication Failed', { description: error });
    }
  }, [error, loginError]);

  /**
   * Handle login button click
   */
  const handleLogin = () => {
    login(redirectTo);
  };

  /**
   * Handle register button click
   */
  const handleRegister = () => {
    router.push(APP_ROUTES.AUTH_REGISTER);
  };

  // Show loading state
  if (isLoading) {
    return (
      <Card className={cn('mx-auto min-h-[26rem] w-full max-w-md', className)}>
        <CardContent className="pt-6">
          <div
            className="flex flex-col items-center justify-center space-y-4 py-8"
            role="status"
            aria-live="polite"
          >
            <Loader2
              className="text-primary h-8 w-8 animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
            <p className="text-muted-foreground text-sm">Checking authentication...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show authenticated state
  if (isAuthenticated && user) {
    return (
      <Card className={cn('mx-auto min-h-[26rem] w-full max-w-md', className)}>
        <CardHeader>
          <div className="mb-4 flex items-center justify-center">
            <ShieldCheck className="text-success h-12 w-12" aria-hidden="true" />
          </div>
          <CardTitle className="text-center">Authenticated</CardTitle>
          <CardDescription className="text-center">
            You are signed in as <strong>{user.name || user.email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="text-muted-foreground flex items-center justify-center gap-2 text-sm"
            role="status"
            aria-live="polite"
          >
            <Loader2
              className="h-4 w-4 animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
            Redirecting shortly…
          </div>
          <div className="space-y-3">
            <Button
              onClick={() => router.push(sanitizeCallbackUrl(redirectTo))}
              className="w-full"
              size="lg"
            >
              Continue to App
            </Button>
            <Button
              onClick={() => logout()}
              variant="outline"
              className="w-full"
              size="lg"
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <>
                  <Loader2
                    className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none"
                    aria-hidden="true"
                  />
                  Signing out...
                </>
              ) : (
                'Sign Out'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show login UI
  return (
    <Card className={cn('mx-auto min-h-[26rem] w-full max-w-md', className)}>
      <CardHeader className="space-y-1">
        <CardTitle className="text-center text-2xl font-bold">Welcome Back</CardTitle>
        <CardDescription className="text-center">
          Sign in to your account using Keycloak SSO
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <Button onClick={handleLogin} disabled={isLoggingIn} className="w-full" size="lg">
          {isLoggingIn ? (
            <>
              <Loader2
                className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
              Connecting...
            </>
          ) : (
            <>
              <LogIn className="mr-2 h-4 w-4" aria-hidden="true" />
              Sign In with Keycloak
            </>
          )}
        </Button>

        {showRegister && (
          <>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background text-muted-foreground px-2">New user?</span>
              </div>
            </div>

            <Button onClick={handleRegister} variant="outline" className="w-full" size="lg">
              <UserPlus className="mr-2 h-4 w-4" aria-hidden="true" />
              Create Account
            </Button>
          </>
        )}
      </CardContent>

      <CardFooter className="flex flex-col space-y-2">
        <div className="text-muted-foreground text-center text-xs">
          <p>Secured by Keycloak</p>
          <p className="mt-1">OAuth2 Authorization Code Flow with PKCE</p>
        </div>
      </CardFooter>
    </Card>
  );
}
