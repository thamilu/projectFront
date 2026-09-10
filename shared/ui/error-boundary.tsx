'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { refreshPage } from '@/shared/utils';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.props.onError?.(error, errorInfo);
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  public override render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

export function HeaderFallback() {
  return (
    <div
      role="banner"
      aria-label="Site header (loading)"
      className="bg-background border-border h-16 animate-pulse border-b"
    />
  );
}

export function PageFallback() {
  return (
    <div
      role="main"
      aria-label="Page content (error)"
      className="flex flex-1 items-center justify-center p-8"
    >
      <div className="max-w-md text-center">
        <p className="text-muted-foreground text-sm">
          This section failed to load.{' '}
          <button
            type="button"
            onClick={refreshPage}
            className="text-primary hover:text-primary/80 ml-1 cursor-pointer underline"
          >
            Refresh
          </button>
        </p>
      </div>
    </div>
  );
}

interface AppErrorBoundaryProps {
  children: ReactNode;
  variant: 'header' | 'page';
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export function AppErrorBoundary({ children, variant, onError }: AppErrorBoundaryProps) {
  const fallback = variant === 'header' ? <HeaderFallback /> : <PageFallback />;
  return (
    <ErrorBoundary fallback={fallback} onError={onError}>
      {children}
    </ErrorBoundary>
  );
}
