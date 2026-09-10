'use client';

import React, { Component, type ReactNode } from 'react';
import { createServiceLogger } from '@/core/telemetry/logger.factory';

const log = createServiceLogger('ProviderErrorBoundary');

interface Props {
  children: ReactNode;
  providerName: string;
}

interface State {
  hasError: boolean;
}

/**
 * ProviderErrorBoundary
 * Catches errors in non-critical context providers (such as Analytics or Feature Flags),
 * logs the failure to SRE telemetry, and recovers gracefully by rendering the children anyway.
 */
export class ProviderErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    log.error(
      `Failure detected in provider [${this.props.providerName}]. Graceful recovery engaged.`,
      {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      }
    );
  }

  render() {
    return this.props.children;
  }
}
