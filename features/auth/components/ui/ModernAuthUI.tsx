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

import { useEffect, useRef, useState } from 'react';
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
import { sanitizeCallbackUrl } from '@/features/auth/utils/sanitize-callback-url';
import { cn } from '@/shared/utils';
import { APP_ROUTES } from '@/shared/routes';

interface ModernAuthUIProps {
  redirectTo?: string;
  showRegister?: boolean;
  className?: string;
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
  const { user, isAuthenticated, isLoading, login, logout, error, isLoggingIn, isLoggingOut } =
    useAuth();

  const [isRedirecting, setIsRedirecting] = useState(false);

  // One-shot snapshot of "was the user already authenticated the instant this
  // component mounted" — never updated after mount. Lets the welcome toast
  // fire only for a sign-in transition that happens during this component's
  // own lifetime, not for every revisit while an existing session is still
  // valid (which would otherwise re-fire the toast on every mount).
  const wasAlreadyAuthenticatedRef = useRef(isAuthenticated);

  /**
   * Handle successful authentication redirect
   */
  useEffect(() => {
    if (!isAuthenticated || isRedirecting) return;

    setIsRedirecting(true);

    // Check for a stored redirect (set by a route guard before bouncing an
    // unauthenticated user here). sanitizeCallbackUrl constrains it to a
    // same-origin relative path — same validation used by the login/register
    // gateways — since this value ultimately reaches router.push() directly,
    // bypassing NextAuth's own server-side redirect validation.
    const storedRedirect =
      typeof window !== 'undefined' ? sessionStorage.getItem('auth_redirect') : null;
    const destination = sanitizeCallbackUrl(storedRedirect || redirectTo);

    if (!wasAlreadyAuthenticatedRef.current) {
      toast.success('Welcome back!', {
        description: `Signed in as ${user?.name || user?.email || 'your account'}`,
        icon: <CheckCircle2 className="h-4 w-4" aria-hidden="true" />,
      });
    }

    // Clear stored redirect
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('auth_redirect');
    }

    // Redirect after short delay so the toast is visible before navigation.
    const timerId = setTimeout(() => {
      router.push(destination);
    }, 500);

    return () => clearTimeout(timerId);
  }, [isAuthenticated, isRedirecting, redirectTo, router, user]);

  /**
   * Handle authentication errors
   */
  useEffect(() => {
    if (error) {
      // useAuth()'s `error` is always string | null (session?.error or
      // loginError?.message) — never a raw Error/unknown — so no cast needed.
      toast.error('Authentication Failed', {
        description: error || 'Unable to authenticate. Please try again.',
      });
    }
  }, [error]);

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
      <Card className={cn('mx-auto w-full max-w-md', className)}>
        <CardContent className="pt-6">
          <div
            className="flex flex-col items-center justify-center space-y-4 py-8"
            role="status"
            aria-live="polite"
          >
            <Loader2 className="text-primary h-8 w-8 animate-spin" aria-hidden="true" />
            <p className="text-muted-foreground text-sm">Checking authentication...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show authenticated state
  if (isAuthenticated && user) {
    return (
      <Card className={cn('mx-auto w-full max-w-md', className)}>
        <CardHeader>
          <div className="mb-4 flex items-center justify-center">
            <ShieldCheck className="text-success h-12 w-12" aria-hidden="true" />
          </div>
          <CardTitle className="text-center">Authenticated</CardTitle>
          <CardDescription className="text-center">
            You are signed in as <strong>{user.name || user.email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isRedirecting ? (
            <div
              className="flex flex-col items-center space-y-4 py-4"
              role="status"
              aria-live="polite"
            >
              <Loader2 className="text-primary h-6 w-6 animate-spin" aria-hidden="true" />
              <p className="text-muted-foreground text-sm">Redirecting...</p>
            </div>
          ) : (
            <div className="space-y-3">
              <Button onClick={() => router.push(redirectTo)} className="w-full" size="lg">
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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    Signing out...
                  </>
                ) : (
                  'Sign Out'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Show login UI
  return (
    <Card className={cn('mx-auto w-full max-w-md', className)}>
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
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
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
