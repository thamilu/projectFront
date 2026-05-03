/**
 * OAuth2 Callback Handler
 * 
 * Handles the redirect from Keycloak after authentication
 * The react-oauth2-code-pkce library automatically processes the callback
 * 
 * @module app/callback/page
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { useKeycloakAuth } from '@/hooks/useKeycloakAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function CallbackPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, error } = useKeycloakAuth();
  
  useEffect(() => {
    // Wait for auth to complete
    if (isAuthenticated && !isLoading) {
      // Get redirect destination from session storage
      const redirectTo = typeof window !== 'undefined' 
        ? sessionStorage.getItem('auth_redirect') || '/dashboard'
        : '/dashboard';
      
      // Clear stored redirect
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('auth_redirect');
      }
      
      // Redirect to destination
      setTimeout(() => {
        router.replace(redirectTo);
      }, 1000);
    }
    
    // Handle errors
    if (error && !isLoading) {
      setTimeout(() => {
        router.replace('/login?error=callback_failed');
      }, 2000);
    }
  }, [isAuthenticated, isLoading, error, router]);
  
  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Authentication Error</CardTitle>
            <CardDescription>
              {typeof error === 'string' ? error : (error as Error).message || 'Unable to complete authentication'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Redirecting to login page...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Show loading/success state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            {isAuthenticated ? (
              <CheckCircle2 className="h-12 w-12 text-green-600 animate-pulse" />
            ) : (
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
            )}
          </div>
          <CardTitle className="text-center">
            {isAuthenticated ? 'Authentication Successful' : 'Completing Sign In'}
          </CardTitle>
          <CardDescription className="text-center">
            {isAuthenticated 
              ? 'Redirecting to your dashboard...'
              : 'Processing your authentication...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <div className="flex space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
