/**
 * RoutePageError
 *
 * Shared implementation behind each commercial route's `error.tsx` (cart,
 * checkout, orders, wishlist, login, ...). Next.js requires a real
 * `error.tsx` file per route segment to get a route-specific fallback
 * instead of falling through to the nearest ancestor's — but the
 * *implementation* of that fallback doesn't need to be copy-pasted per
 * route. This centralizes it: logging, retry-with-limit, and the recovery
 * actions are all in one place, and each route file just supplies its own
 * heading/description copy.
 */
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/shared/ui/atoms/button/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/atoms/card';
import { logger } from '@/core/telemetry/logger';
import { APP_ROUTES } from '@/shared/routes';

export interface RoutePageErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
  /** Identifies the route in logs, e.g. "Cart page error:". */
  logContext: string;
  /** Shown as the card heading. Defaults to a generic message. */
  title?: string;
  /** Shown under the heading — say what broke in terms the user recognizes. */
  description: string;
  /** Where "Go home" navigates. Defaults to the storefront home. */
  homeRoute?: string;
  /** Label for the "Go home" button, when a more specific destination reads better than "Go home". */
  homeLabel?: string;
}

const MAX_RETRIES = 3;

export function RoutePageError({
  error,
  reset,
  logContext,
  title = 'Something went wrong',
  description,
  homeRoute = APP_ROUTES.HOME,
  homeLabel = 'Go home',
}: RoutePageErrorProps) {
  const router = useRouter();
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    logger.error(logContext, {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
  }, [error, logContext]);

  useEffect(() => {
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
            <div className="bg-destructive/10 mx-auto flex h-12 w-12 items-center justify-center rounded-full">
              <AlertTriangle className="text-destructive h-6 w-6" aria-hidden="true" />
            </div>
            <CardTitle className="text-xl" ref={headingRef} tabIndex={-1}>
              {title}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground text-sm">{description}</p>

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

            <div className="space-y-4 pt-2">
              <div className="flex flex-col justify-center gap-2 sm:flex-row">
                <Button
                  onClick={handleRetry}
                  variant="default"
                  disabled={retryCount >= MAX_RETRIES}
                  className="w-full sm:w-auto"
                >
                  <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
                  {retryCount >= MAX_RETRIES ? 'Max retries reached' : 'Try again'}
                </Button>

                <Button
                  onClick={() => router.push(homeRoute)}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <Home className="mr-2 h-4 w-4" aria-hidden="true" />
                  {homeLabel}
                </Button>
              </div>

              {retryCount >= MAX_RETRIES && (
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

export default RoutePageError;
