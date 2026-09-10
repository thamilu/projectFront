'use client';

import React, { Component, type ReactNode, type ErrorInfo } from 'react';
import { logger } from '@/core/telemetry/logger';

interface HeaderErrorBoundaryState {
  hasError: boolean;
}

/**
 * Error boundary for the site header.
 * If header crashes, renders a minimal fallback — site remains functional.
 */
export class HeaderErrorBoundary extends Component<
  { children: ReactNode },
  HeaderErrorBoundaryState
> {
  state: HeaderErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): HeaderErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logger.error('[Header] Render error', {
      message: error.message,
      componentStack: info.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        // Minimal fallback layout — site is still navigable
        <header className="bg-background sticky top-0 z-50 h-16 w-full border-b">
          <div className="container mx-auto flex h-16 items-center px-4">
            <a href="/" className="text-xl font-bold text-emerald-500">
              eShop
            </a>
          </div>
        </header>
      );
    }
    return this.props.children;
  }
}
