/**
 * Error Boundary Component
 *
 * Catches React errors and displays fallback UI
 * Prevents entire app crashes from component errors
 * Integrates with Sentry for error tracking
 *
 * @module components/error-boundary
 */

'use client';

import React, { Component, ReactNode } from 'react';
import { logger } from '@/lib/observability/logger';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Custom fallback UI */
  fallback?: (error: Error, retry: () => void) => ReactNode;
  /** Called when error is caught */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Component display name for logging */
  name?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Error Boundary Class Component
 *
 * Catches runtime errors in child component tree
 * Prevents error from crashing the entire application
 *
 * @example
 * ```tsx
 * <ErrorBoundary name="ProductList">
 *   <ProductList />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { onError, name } = this.props;

    // Log to observability system
    logger.error(`Error caught in ${name || 'ErrorBoundary'}:`, {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    // Log to Sentry if available
    if (typeof window !== 'undefined') {
      const win = window as unknown as {
        Sentry?: { captureException: (error: Error, context?: unknown) => void };
      };
      if (win.Sentry) {
        win.Sentry.captureException(error, {
          contexts: {
            react: {
              componentStack: errorInfo.componentStack,
            },
          },
        });
      }
    }

    // Call custom error handler
    if (onError) {
      onError(error, errorInfo);
    }

    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    const { hasError, error } = this.state;
    const { children, fallback, name } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback(error, this.handleRetry);
      }

      // Default fallback UI
      return (
        <div className="flex min-h-100 items-center justify-center p-4">
          <Card className="border-destructive w-full max-w-lg">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm">
                An error occurred in {name || 'this component'}. Our team has been notified.
              </p>

              {process.env.NODE_ENV === 'development' && (
                <details className="bg-muted rounded-lg p-4 text-xs">
                  <summary className="cursor-pointer font-semibold">Error Details</summary>
                  <pre className="mt-2 overflow-auto whitespace-pre-wrap">
                    {error.message}
                    {'\n\n'}
                    {error.stack}
                  </pre>
                </details>
              )}

              <div className="flex gap-2">
                <Button onClick={this.handleRetry} variant="default" className="flex-1">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button onClick={this.handleGoHome} variant="outline" className="flex-1">
                  <Home className="mr-2 h-4 w-4" />
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return children;
  }
}

/**
 * Specialized Error Boundary for API/Data fetching errors
 *
 * Shows more specific messaging for network/API failures
 *
 * @example
 * ```tsx
 * <DataErrorBoundary>
 *   <ProductList />
 * </DataErrorBoundary>
 * ```
 */
export function DataErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      name="DataErrorBoundary"
      fallback={(error, retry) => (
        <div className="flex min-h-100 items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardContent className="space-y-4 pt-6">
              <div className="flex flex-col items-center gap-2 text-center">
                <AlertCircle className="text-muted-foreground h-12 w-12" />
                <h3 className="text-lg font-semibold">Unable to Load Data</h3>
                <p className="text-muted-foreground text-sm">
                  We couldn't fetch the data you requested. Please check your connection and try
                  again.
                </p>
              </div>

              {process.env.NODE_ENV === 'development' && (
                <details className="bg-muted rounded-lg p-3 text-xs">
                  <summary className="cursor-pointer font-medium">Technical Details</summary>
                  <pre className="mt-2 overflow-auto text-xs whitespace-pre-wrap">
                    {error.message}
                  </pre>
                </details>
              )}

              <Button onClick={retry} className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Specialized Error Boundary for forms
 *
 * Preserves form state and allows retry without losing data
 */
export function FormErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      name="FormErrorBoundary"
      fallback={(error, retry) => (
        <div className="border-destructive bg-destructive/10 rounded-lg border p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-destructive h-5 w-5" />
            <div className="flex-1 space-y-2">
              <h4 className="text-destructive font-semibold">Form Error</h4>
              <p className="text-muted-foreground text-sm">
                There was an issue processing your form. Your data has been preserved.
              </p>
              <Button onClick={retry} size="sm" variant="outline">
                Try Again
              </Button>
            </div>
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
