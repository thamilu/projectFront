import React from 'react';

/**
 * ProviderLoadingFallback
 * Accessible loading indicator for lazy-loaded providers.
 * Adheres to WCAG 2.1 AA screen-reader guidelines (role="status", aria-live="polite").
 */
export function ProviderLoadingFallback() {
  return (
    <div className="flex min-h-16 items-center justify-center p-4" role="status" aria-live="polite">
      <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
      <span className="sr-only">Loading application state...</span>
    </div>
  );
}
