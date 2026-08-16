'use client';

import * as React from 'react';
import { Spinner } from '@/shared/ui/feedback/loading/Spinner';

interface LoginLoadingStateProps {
  isSigningIn: boolean;
  /** Overrides the default "Signing in.../Redirecting to sign in..." copy for non-login gateways (e.g. registration). */
  label?: string;
}

/**
 * Loading state component implementing structured, screen-reader friendly updates.
 * Places aria-busy and aria-live="polite" directly on the role="status" container
 * to ensure that screen readers correctly notify visual changes.
 */
export function LoginLoadingState({ isSigningIn, label }: LoginLoadingStateProps) {
  return (
    <div
      className="flex flex-col items-center py-4"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Authentication in progress"
    >
      <Spinner size="md" className="mb-4" />
      <p className="text-muted-foreground text-sm font-medium">
        {label ?? (isSigningIn ? 'Signing in...' : 'Redirecting to sign in...')}
      </p>
    </div>
  );
}
