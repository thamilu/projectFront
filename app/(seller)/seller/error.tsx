'use client';

import React, { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { logger } from '@/core/telemetry/logger';
import { Button } from '@/shared/ui';

interface SellerLayoutErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error boundary for the seller dashboard layout.
 * Catches layout-level and child component rendering errors, logs them to Sentry and local telemetry,
 * and provides a user-friendly recovery UI with retry capabilities.
 *
 * @param {SellerLayoutErrorProps} props - The error and reset handler
 * @returns {React.JSX.Element} The error recovery UI
 */
export default function SellerLayoutError({
  error,
  reset,
}: SellerLayoutErrorProps): React.JSX.Element {
  useEffect(() => {
    // Capture the exception via Sentry for telemetry logging
    Sentry.captureException(error, {
      tags: {
        component: 'SellerLayout',
      },
      extra: {
        digest: error.digest,
      },
    });

    // Structured logging fallback
    logger.error('[SellerLayout] Layout-level error occurred:', {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-6 text-center">
        {/* Error Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
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
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Error Message */}
        <div>
          <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
            Something went wrong
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            We encountered an error loading the seller dashboard. Please try again or contact
            support if the problem persists.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                Error Details
              </summary>
              <pre className="mt-2 overflow-auto rounded bg-gray-100 p-4 text-xs whitespace-pre-wrap dark:bg-gray-800">
                {error.message}
              </pre>
            </details>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Button
            onClick={reset}
            className="rounded-button transform bg-blue-600 px-6 py-3 font-semibold text-white transition-all hover:scale-105 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-hidden active:scale-95"
          >
            Try Again
          </Button>
          <Button
            variant="outline"
            asChild
            className="transform px-6 py-3 transition-all hover:scale-105 active:scale-95"
          >
            <a href="/">Go Home</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
