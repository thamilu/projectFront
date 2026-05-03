'use client';

import { useEffect } from 'react';
import { AlertOctagon } from 'lucide-react';
import { siteConfig } from '@/lib/config/site';
import { logger } from '@/lib/observability/logger';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    logger.error('Global error:', { error, digest: error.digest });
  }, [error]);

  return (
    <html>
      <body className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-destructive/10">
              <AlertOctagon className="h-12 w-12 text-destructive" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">
              Something went wrong!
            </h1>
            <p className="text-muted-foreground">
              A critical error occurred. We've been notified and are looking into it.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => reset()}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              Try again
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              Back to home
            </button>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8 p-4 rounded-lg bg-muted text-left overflow-auto max-h-[300px]">
              <p className="font-mono text-xs text-destructive mb-2">{error.name}: {error.message}</p>
              <pre className="font-mono text-[10px] text-muted-foreground">
                {error.stack}
              </pre>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
        </div>
      </body>
    </html>
  );
}
