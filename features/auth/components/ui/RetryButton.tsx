'use client';

import * as React from 'react';
import { Button } from '@/shared/ui/atoms/button';

interface RetryButtonProps {
  isLoading: boolean;
  onRetry: () => void | Promise<void>;
  errorDescId?: string;
  /** Visible + accessible label while idle. @default 'Retry Sign In' */
  label?: string;
  /** Accessible label while loading. @default 'Redirecting to sign in portal...' */
  loadingLabel?: string;
}

/**
 * Reusable retry button utilizing the canonical design system Button primitive.
 * Enforces correct screen reader visibility using aria-describedby and loading states.
 * Copy is configurable so non-login gateways (e.g. registration) aren't stuck
 * announcing "Retry Sign In" for an unrelated flow.
 */
export function RetryButton({
  isLoading,
  onRetry,
  errorDescId,
  label = 'Retry Sign In',
  loadingLabel = 'Redirecting to sign in portal...',
}: RetryButtonProps) {
  return (
    <Button
      variant="default"
      size="lg"
      fullWidth
      loading={isLoading}
      onClick={onRetry}
      aria-describedby={errorDescId}
      aria-label={isLoading ? loadingLabel : label}
      className="h-12 text-sm font-semibold shadow-md"
    >
      {label}
    </Button>
  );
}
