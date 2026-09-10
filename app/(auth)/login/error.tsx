/**
 * Login Page Error Boundary
 * Catches and handles errors during page render
 * Provides recovery options without full page crash
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/shared/ui/atoms/button/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/atoms/card';
import { logger } from '@/core/telemetry/logger';
import { APP_ROUTES } from '@/shared/routes';

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
      className="from-background to-muted/20 relative flex min-h-dvh flex-col bg-gradient-to-br"
      style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
    >
      {/* Plain <div>: error surfaces render inside the root layout's
          `<main id="main-content">`, so a nested one would duplicate both
          the landmark and the skip-link target id. */}
      <div className="flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-4 text-center">
            {/* Error icon */}
            <div className="bg-destructive/10 mx-auto flex h-12 w-12 items-center justify-center rounded-full">
              <AlertTriangle className="text-destructive h-6 w-6" aria-hidden="true" />
            </div>

            <CardTitle className="text-xl" ref={headingRef} tabIndex={-1}>
              Something went wrong
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground text-sm">
              We couldn&apos;t load the login page. This might be a temporary issue.
            </p>

            {/* Error details for debugging */}
            {error.digest && (
              <div className="bg-muted rounded-md p-3 text-left">
                <p className="text-muted-foreground font-mono text-xs break-words">
                  Error ID: {error.digest}
                </p>
              </div>
            )}

            {process.env.NODE_ENV === 'development' && (
              <details className="group text-left text-xs">
                <summary className="text-muted-foreground hover:text-foreground focus:ring-primary cursor-pointer rounded px-2 py-1 focus:ring-2 focus:ring-offset-2 focus:outline-none">
                  Technical details
                </summary>
                <pre className="bg-muted mt-2 max-h-40 overflow-auto rounded p-3 text-xs">
                  <code>{error.message}</code>
                </pre>
              </details>
            )}

            {/* Recovery actions */}
            {/* Recovery actions */}
            <div className="space-y-4 pt-2">
              <div className="flex flex-col justify-center gap-2 sm:flex-row">
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
                <p className="text-muted-foreground text-xs">
                  Please{' '}
                  <a href="/support" className="text-primary hover:underline">
                    contact support
                  </a>{' '}
                  if the issue persists.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
