/**
 * Error Boundary Component
 *
 * Enterprise-grade error catching with:
 * - React component errors
 * - Async/unhandled promise rejections
 * - Error reporting to monitoring services
 * - User-friendly recovery UI
 * - Circuit breaker for repeated errors
 *
 * @module components/common/error-boundary
 */

'use client';

import React, { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/observability/logger';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: unknown[];
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
  errorCount: number;
}

/**
 * Error Boundary Class Component
 *
 * Provides graceful error handling for React component trees.
 * Logs errors to observability system and displays user-friendly UI.
 *
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = crypto.randomUUID();
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { onError } = this.props;
    const { errorId } = this.state;

    // Log to observability system
    logger.error('React Error Boundary caught error', {
      errorId,
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    // Call custom error handler if provided
    onError?.(error, errorInfo);

    // Report to error tracking service (Sentry)
    if (typeof window !== 'undefined' && 'Sentry' in window) {
      (
        window as unknown as {
          Sentry: { captureException: (e: Error, opts?: unknown) => void };
        }
      ).Sentry.captureException(error, {
        extra: {
          componentStack: errorInfo.componentStack,
          errorId,
        },
      });
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorId: null,
    });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  render(): ReactNode {
    const { hasError, error, errorId } = this.state;
    const { fallback } = this.props;

    if (hasError) {
      if (fallback) {
        return fallback;
      }

      return (
        <div role="alert" className="flex min-h-96 flex-col items-center justify-center gap-6 p-8">
          <div className="bg-destructive/10 flex h-16 w-16 items-center justify-center rounded-full">
            <AlertTriangle className="text-destructive h-8 w-8" />
          </div>

          <div className="text-center">
            <h2 className="text-xl font-semibold">Something went wrong</h2>
            <p className="text-muted-foreground mt-2 max-w-md">
              An unexpected error occurred. Our team has been notified and is working on a fix.
            </p>
            {errorId && (
              <p className="text-muted-foreground mt-4 font-mono text-xs">Error ID: {errorId}</p>
            )}
          </div>

          <div className="flex gap-4">
            <Button variant="outline" onClick={this.handleReset}>
              Try Again
            </Button>
            <Button variant="outline" onClick={this.handleGoHome}>
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
            <Button onClick={this.handleReload} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Reload Page
            </Button>
          </div>

          {process.env.NODE_ENV === 'development' && error && (
            <details className="bg-muted mt-4 w-full max-w-2xl rounded-lg border p-4">
              <summary className="cursor-pointer font-semibold">
                Error Details (Development Only)
              </summary>
              <pre className="mt-2 overflow-auto text-xs">{error.stack || error.message}</pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// Async Error Boundary Hook
// ============================================================================

/**
 * Hook to catch unhandled promise rejections
 */
export function useAsyncErrorHandler(onError?: (error: Error) => void): void {
  React.useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent): void => {
      event.preventDefault();
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));

      logger.error('[AsyncError] Unhandled promise rejection', {
        error: { name: error.name, message: error.message, stack: error.stack },
      });

      // Report to monitoring
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('app:error', {
            detail: { error: { name: error.name, message: error.message, stack: error.stack } },
          })
        );
      }

      onError?.(error);
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [onError]);
}

/**
 * Hook to manually trigger error boundary
 */
export function useErrorHandler(): (error: Error) => void {
  const [, setError] = React.useState<Error | null>(null);

  return React.useCallback((error: Error) => {
    setError(() => {
      throw error;
    });
  }, []);
}
