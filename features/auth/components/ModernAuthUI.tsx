/**
 * Modern Authentication UI Component
 * 
 * Enterprise-grade login interface using react-oauth2-code-pkce
 * with Tailwind CSS and shadcn/ui
 * 
 * @module components/auth/ModernAuthUI
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, UserPlus, Loader2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useKeycloakAuth } from '@/hooks/useKeycloakAuth';
import { cn } from '@/lib/utils';
import { APP_ROUTES } from '@/constants/routes/app-routes';

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
  className 
}: ModernAuthUIProps) {
  const router = useRouter();
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    login, 
    // register, 
    logout,
    error 
  } = useKeycloakAuth();
  
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  /**
   * Handle successful authentication redirect
   */
  useEffect(() => {
    if (isAuthenticated && !isRedirecting) {
      setIsRedirecting(true);
      
      // Check for stored redirect
      const storedRedirect = typeof window !== 'undefined' 
        ? sessionStorage.getItem('auth_redirect')
        : null;
      
      const destination = storedRedirect || redirectTo;
      
      toast.success('Welcome back!', {
        description: `Signed in as ${user?.preferred_username || user?.email}`,
        icon: <CheckCircle2 className="h-4 w-4" />,
      });
      
      // Clear stored redirect
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('auth_redirect');
      }
      
      // Redirect after short delay for UX
      setTimeout(() => {
        router.push(destination);
      }, 500);
    }
  }, [isAuthenticated, isRedirecting, redirectTo, router, user]);
  
  /**
   * Handle authentication errors
   */
  useEffect(() => {
    if (error) {
      const errorMsg = typeof error === 'string' ? error : (error as Error).message;
      toast.error('Authentication Failed', {
        description: errorMsg || 'Unable to authenticate. Please try again.',
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
      <Card className={cn('w-full max-w-md mx-auto', className)}>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Checking authentication...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Show authenticated state
  if (isAuthenticated && user) {
    return (
      <Card className={cn('w-full max-w-md mx-auto', className)}>
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <ShieldCheck className="h-12 w-12 text-green-600" />
          </div>
          <CardTitle className="text-center">Authenticated</CardTitle>
          <CardDescription className="text-center">
            You are signed in as <strong>{user.preferred_username || user.email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isRedirecting ? (
            <div className="flex flex-col items-center space-y-4 py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Redirecting...</p>
            </div>
          ) : (
            <div className="space-y-3">
              <Button
                onClick={() => router.push(redirectTo)}
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
              >
                Sign Out
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
  
  // Show login UI
  return (
    <Card className={cn('w-full max-w-md mx-auto', className)}>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Welcome Back
        </CardTitle>
        <CardDescription className="text-center">
          Sign in to your account using Keycloak SSO
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Button
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <LogIn className="mr-2 h-4 w-4" />
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
                <span className="bg-background px-2 text-muted-foreground">
                  New user?
                </span>
              </div>
            </div>
            
            <Button
              onClick={handleRegister}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Create Account
            </Button>
          </>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-col space-y-2">
        <div className="text-xs text-center text-muted-foreground">
          <p>Secured by Keycloak</p>
          <p className="mt-1">OAuth2 Authorization Code Flow with PKCE</p>
        </div>
      </CardFooter>
    </Card>
  );
}
