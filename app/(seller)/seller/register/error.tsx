'use client';

import React, { useEffect } from 'react';
import { Button } from '@/shared/ui/atoms/button/button';
import * as Sentry from '@sentry/nextjs';
import { logger } from '@/core/telemetry/logger';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function SellerOnboardingError({ error, reset }: ErrorProps): React.JSX.Element {
  useEffect(() => {
    // Capture the exception via Sentry
    Sentry.captureException(error, {
      tags: {
        component: 'SellerOnboardingPage',
      },
      extra: {
        digest: error.digest,
      },
    });

    // Structured logging fallback
    logger.error('[SellerOnboarding] Page-level error occurred:', {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white to-gray-50 py-20 dark:from-gray-950 dark:to-gray-900">
      <div className="container mx-auto max-w-md space-y-6 px-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/20 dark:text-red-500">
          <svg
            className="h-8 w-8 text-red-600 dark:text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h2 className="text-foreground text-2xl font-bold tracking-tight">Something went wrong</h2>
        <p className="text-muted-foreground text-sm">
          We couldn't load the seller onboarding page. Please try again.
        </p>
        <div className="flex justify-center gap-4">
          <Button onClick={reset} className="h-12 px-6">
            Try Again
          </Button>
          <Button variant="outline" asChild className="h-12 px-6">
            <a href="/">Go Home</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
