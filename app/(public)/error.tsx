'use client';

import { useEffect } from 'react';
import { logger } from '@/core/telemetry/logger';
import { captureException } from '@sentry/nextjs';

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    // Log to telemetry
    logger.error('Public Shop route error boundary triggered', {
      error: error.message,
      digest: error.digest,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });

    // Capture exception in Sentry for production tracking
    captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-lg bg-white p-8 text-center shadow-lg">
          {/* Error Icon */}
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
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
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Something went wrong</h1>
          <p className="mb-6 text-gray-600">
            We're sorry for the inconvenience. Our team has been notified and is working on a fix.
          </p>

          {/* Development Only: Show Error Details */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mb-6 text-left">
              <summary className="mb-2 cursor-pointer text-sm font-medium text-gray-700">
                Error Details (dev only)
              </summary>
              <pre className="max-h-40 overflow-auto rounded border border-red-200 bg-red-50 p-4 text-xs text-red-800">
                {error.message}
                {'\n\n'}
                {error.stack}
              </pre>
            </details>
          )}

          {/* Actions */}
          <div className="flex justify-center gap-3">
            <button
              onClick={reset}
              className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
            >
              Try again
            </button>
            <a
              href="/"
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
            >
              Go home
            </a>
          </div>

          {/* Support Link */}
          <p className="mt-6 text-xs text-gray-500">
            Need help?{' '}
            <a href="/support" className="text-blue-600 hover:text-blue-500">
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
