'use client';

/**
 * Root error boundary.
 *
 * Three defects are fixed here:
 *
 * 1. **It ignored the design system.** The page was built entirely from
 *    `bg-gray-50`, `bg-white`, `text-gray-900` and `bg-blue-600` — eleven
 *    hardcoded palette values with no dark variant — so in dark mode it
 *    rendered a white card on the app's dark ground. Every colour now comes
 *    from a semantic token.
 *
 * 2. **Its own recovery link 404'd.** "Contact support" pointed at `/support`,
 *    which does not exist; the real page is `/help`.
 *
 * 3. **The error id was not surfaced.** `digest` is the only handle support can
 *    use to find the corresponding server log, and it was captured but never
 *    shown to the person able to quote it.
 *
 * @module app/error
 */

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home, LifeBuoy } from 'lucide-react';
import { captureException } from '@sentry/nextjs';
import { logger } from '@/core/telemetry/logger';
import { Button } from '@/shared/ui/atoms/button';
import { APP_ROUTES } from '@/shared/routes';

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    logger.error('Root error boundary triggered', {
      error: error.message,
      digest: error.digest,
      stack: error.stack,
    });

    // `digest` is attached as a tag so a support ticket quoting the reference
    // below can be searched directly in Sentry.
    captureException(error, {
      tags: { boundary: 'root', digest: error.digest ?? 'none' },
    });
  }, [error]);

  return (
    <div className="bg-background flex min-h-dvh items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="bg-card text-card-foreground border-border rounded-lg border p-8 text-center shadow-sm">
          <div className="bg-destructive/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
            <AlertTriangle className="text-destructive h-6 w-6" aria-hidden="true" />
          </div>

          {/* role="alert" so the failure is announced rather than silently
              replacing the page for a screen-reader user. */}
          <h1 className="mb-2 text-2xl font-bold" role="alert">
            Something went wrong
          </h1>
          <p className="text-muted-foreground mb-6">
            We couldn&apos;t load this page. Our team has been notified — trying again often
            resolves it.
          </p>

          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button onClick={reset}>
              <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
              Try again
            </Button>
            <Button variant="outline" asChild>
              <Link href={APP_ROUTES.HOME}>
                <Home className="mr-2 h-4 w-4" aria-hidden="true" />
                Go home
              </Link>
            </Button>
          </div>

          {/*
            Shown to the user, not just logged: it is the only reference that
            lets support correlate their report with the server-side record.
          */}
          {error.digest && (
            <p className="text-muted-foreground mt-6 text-xs">
              Reference: <code className="font-mono">{error.digest}</code>
            </p>
          )}

          <p className="text-muted-foreground mt-4 text-xs">
            Still stuck?{' '}
            <Link href={APP_ROUTES.HELP} className="text-primary inline-flex items-center gap-1 underline">
              <LifeBuoy className="h-3 w-3" aria-hidden="true" />
              Visit our help centre
            </Link>
          </p>

          {process.env.NODE_ENV === 'development' && (
            <details className="mt-6 text-left">
              <summary className="text-muted-foreground mb-2 cursor-pointer text-sm font-medium">
                Error details (development only)
              </summary>
              <pre className="border-destructive/30 bg-destructive/5 text-destructive max-h-40 overflow-auto rounded border p-4 text-xs">
                {error.message}
                {'\n\n'}
                {error.stack}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
