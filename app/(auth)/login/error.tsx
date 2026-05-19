/**
 * Login Page Error Boundary
 * Catches and handles errors during page render
 * Provides recovery options without full page crash
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/shared/ui/atoms/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/atoms/card';
import { logger } from '@/core/telemetry/logger';
import { APP_ROUTES } from '@/shared/constants/routes/app-routes';

interface LoginErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function LoginError({ error, reset }: LoginErrorProps) {
  const router = useRouter();
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  useEffect(() => {
    // Non-blocking error logging with safe fallback
    const logError = async () => {
      try {
        await logger?.error?.('Login page error:', {
          message: error.message,
          digest: error.digest,
          stack: error.stack,
          timestamp: new Date().toISOString(),
        });
      } catch (logErr) {
        // Ensure logging failures do not break the error boundary
         
        console.error('Failed to log login page error:', logErr);
      }
    };

    logError();
  }, [error]);

  useEffect(() => {
    // Move focus to heading so keyboard and screen reader users are informed
    headingRef.current?.focus();
  }, []);

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    reset();
  };

  return (
    <div
      className="relative flex min-h-dvh flex-col bg-gradient-to-br from-background to-muted/20"
      style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
    >
      <main id="main-content" className="flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-8">
        <Card className="w-full max-w-md">
            <CardHeader className="text-center space-y-4">
            {/* Error icon */}
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" aria-hidden="true" />
            </div>
            
            <CardTitle className="text-xl" ref={headingRef} tabIndex={-1}>
              Something went wrong
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              We couldn&apos;t load the login page. This might be a temporary issue.
            </p>
            
            {/* Error details for debugging */}
            {error.digest && (
              <div className="rounded-md bg-muted p-3 text-left">
                <p className="text-xs text-muted-foreground font-mono break-words">
                  Error ID: {error.digest}
                </p>
              </div>
            )}
            
            {process.env.NODE_ENV === 'development' && (
              <details className="text-left text-xs group">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded px-2 py-1">
                  Technical details
                </summary>
                <pre className="mt-2 overflow-auto rounded bg-muted p-3 text-xs max-h-40">
                  <code>{error.message}</code>
                </pre>
              </details>
            )}
            
            {/* Recovery actions */}
            {/* Recovery actions */}
            <div className="space-y-4 pt-2">
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button 
                  onClick={handleRetry} 
                  variant="default"
                  disabled={retryCount >= maxRetries}
                  className="w-full sm:w-auto"
                >
                  <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
                  {retryCount >= maxRetries ? 'Max retries reached' : 'Try again'}
                </Button>
                
                <Button 
                  onClick={() => router.push(APP_ROUTES.HOME)}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <Home className="mr-2 h-4 w-4" aria-hidden="true" />
                  Go home
                </Button>
              </div>

              {retryCount >= maxRetries && (
                <p className="text-xs text-muted-foreground">
                  Please <a href="/support" className="text-primary hover:underline">contact support</a> if the issue persists.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
