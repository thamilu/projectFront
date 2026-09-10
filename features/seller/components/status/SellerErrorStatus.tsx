// ============================================================
// features/seller/components/status/SellerErrorStatus.tsx
//
// Ultra Enterprise Grade SellerErrorStatus Component
// Implements: error boundary, loading state retry, accessibilty,
// design tokens, error telemetry, safe mapping, and escalation.
// ============================================================

import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { XCircle, Loader2 } from 'lucide-react';

import { Button } from '@/shared/ui/atoms/button';
import { PremiumCard } from '@/shared/ui/molecules/PremiumCard';
import { logger } from '@/core/telemetry/logger';
import { trackEvent } from '@/core/providers/analytics-provider';

// ─── Props Interface ─────────────────────────────────────────

export interface SellerErrorStatusProps {
  /**
   * Raw or custom error message.
   * Will be sanitized to prevent sensitive internal info disclosure.
   */
  error?: string | null;
  /** Callback fired to retry the operation. Can be async. */
  onRetry?: () => void | Promise<void>;
  /** Callback fired to navigate back. */
  onBack?: () => void;
  /** URL for support contact. */
  supportUrl?: string;
  /** Custom error code to display to users and support. */
  errorCode?: string;
  /** Externally controlled loading state for the retry button. */
  isRetrying?: boolean;
  /** Override title text (for i18n support). */
  title?: string;
  /** Override retry button label (for i18n support). */
  retryLabel?: string;
}

// ─── Helpers ───────────────────────────────────────────────

/**
 * Sanitizes the displayed error message to filter out raw database exceptions,
 * internal paths, stack traces, and Redis error details for security posture.
 */
function getSafeErrorMessage(error: string | null | undefined): string {
  const fallback = 'We could not process your registration. Please try again.';
  if (!error?.trim()) return fallback;

  const trimmed = error.trim();

  // Basic heuristic to detect raw errors, stack traces, database strings, or internal paths
  const isRawError =
    trimmed.includes('Stack trace') ||
    trimmed.includes('at ') ||
    trimmed.includes('Exception') ||
    trimmed.includes('database') ||
    trimmed.includes('constraint') ||
    trimmed.includes('SQL') ||
    trimmed.includes('Redis') ||
    trimmed.includes('http://') ||
    trimmed.includes('https://') ||
    /^[A-Z0-9_]+_ERROR$/.test(trimmed);

  if (isRawError) {
    return fallback;
  }

  return trimmed;
}

// ─── Sub-components ──────────────────────────────────────────

const FallbackError = () => (
  <div
    role="alert"
    className="p-6 text-center text-destructive bg-destructive/10 rounded-xl border border-destructive/20 max-w-2xl mx-auto"
  >
    Something went wrong displaying the error screen. Please refresh the page.
  </div>
);

// ─── Main Component Inner ────────────────────────────────────

const SellerErrorStatusInner = memo(function SellerErrorStatusInner({
  error,
  onRetry,
  onBack,
  supportUrl,
  errorCode,
  isRetrying,
  title = 'Something went wrong',
  retryLabel = 'Try Again',
}: SellerErrorStatusProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [localIsRetrying, setLocalIsRetrying] = useState(false);

  const activeIsRetrying = isRetrying || localIsRetrying;

  // ── Derived state ─────────────────────────────────────────

  const displayMessage = useMemo(() => getSafeErrorMessage(error), [error]);

  // ── Telemetry on Mount ────────────────────────────────────

  useEffect(() => {
    logger.error('SellerErrorStatus: registration error displayed', {
      error: error || 'Unknown registration error',
      errorCode,
      timestamp: new Date().toISOString(),
    });
    trackEvent('seller_registration_error_displayed', {
      hasRetry: !!onRetry,
      hasBack: !!onBack,
      errorCode,
    });
  }, [error, onRetry, onBack, errorCode]);

  // ── Focus Management on Mount ─────────────────────────────

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.focus();
    }
  }, []);

  // ── Handlers ─────────────────────────────────────────────

  const handleRetryClick = useCallback(async () => {
    if (activeIsRetrying || !onRetry) return;
    setLocalIsRetrying(true);
    try {
      await onRetry();
    } catch (err) {
      logger.error('SellerErrorStatus: retry handler failed', {
        error: err instanceof Error ? err : new Error(String(err)),
      });
    } finally {
      setLocalIsRetrying(false);
    }
  }, [onRetry, activeIsRetrying]);

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      data-testid="seller-error-status"
      className="motion-safe:animate-in motion-safe:fade-in mx-auto max-w-2xl duration-500 focus:outline-none"
    >
      <PremiumCard
        title={title}
        description={displayMessage}
        gradientClassName="bg-gradient-to-r from-destructive to-destructive/60"
        className="text-center"
        contentClassName="py-12 flex flex-col items-center gap-6"
      >
        {/* Large warning icon centered inside body */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
          <XCircle className="h-10 w-10 text-destructive" aria-hidden="true" />
        </div>

        {errorCode && (
          <p className="text-xs text-muted-foreground font-mono">
            Error Code: {errorCode}
          </p>
        )}

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full mt-4">
          {onRetry && (
            <Button
              onClick={handleRetryClick}
              disabled={activeIsRetrying}
              aria-busy={activeIsRetrying}
              aria-label={activeIsRetrying ? 'Retrying, please wait…' : retryLabel}
              data-testid="seller-error-retry-btn"
              className="h-12 rounded-xl px-8 w-full sm:w-auto"
            >
              {activeIsRetrying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Retrying…
                </>
              ) : (
                retryLabel
              )}
            </Button>
          )}

          {onBack && (
            <Button
              variant="outline"
              onClick={onBack}
              disabled={activeIsRetrying}
              className="h-12 rounded-xl px-8 w-full sm:w-auto border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 focus:ring-2 focus:ring-primary focus:outline-none"
            >
              Go Back
            </Button>
          )}
        </div>

        {supportUrl && (
          <div className="text-center mt-2">
            <a
              href={supportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
            >
              Contact Support
            </a>
          </div>
        )}
      </PremiumCard>
    </div>
  );
});

// ─── Main Component Wrapper ─────────────────────────────────

/**
 * SellerErrorStatus
 *
 * Displays a resilient, accessible, and secure error state during seller onboarding.
 *
 * @security The `error` prop is sanitized internally to filter out database constraints,
 * Redis info, stack traces, or internal URLs to prevent information disclosure.
 *
 * @accessibility
 * - role="alert" & aria-live="assertive" automatically screen-reader announced.
 * - Programmatic focus transfer to container on mount.
 * - prefers-reduced-motion media query respected.
 * - Decorative icons hidden with aria-hidden="true".
 *
 * @example
 * ```tsx
 * <SellerErrorStatus
 *   error="Invalid tax document."
 *   onRetry={handleRetry}
 *   supportUrl="https://example.com/support"
 * />
 * ```
 */
export const SellerErrorStatus = memo(function SellerErrorStatus(
  props: SellerErrorStatusProps
): React.JSX.Element {
  return (
    <ErrorBoundary FallbackComponent={FallbackError}>
      <SellerErrorStatusInner {...props} />
    </ErrorBoundary>
  );
});

export default SellerErrorStatus;

