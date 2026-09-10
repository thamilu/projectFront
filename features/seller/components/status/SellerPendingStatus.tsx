// ============================================================
// features/seller/components/status/SellerPendingStatus.tsx
//
// Ultra Enterprise Grade SellerPendingStatus Component
// Implements: error boundary, design tokens, accessibility,
// copy-to-clipboard, telemetry, and alternative support pathways.
// ============================================================

import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { CheckCircle2, ShieldCheck, ArrowRight, Copy, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/shared/ui/atoms/button';
import { PremiumCard } from '@/shared/ui/molecules/PremiumCard';
import { APP_ROUTES } from '@/shared/routes';
import { logger } from '@/core/telemetry/logger';
import { trackEvent } from '@/core/providers/analytics-provider';

// ─── Props Interface ─────────────────────────────────────────

export interface SellerPendingStatusProps {
  /** The seller's notification email address. */
  email?: string | null;
  /** Actual reference ID returned from the registration API. */
  referenceId?: string | null;
  /** Estimated review hours to display. Defaults to 24. */
  estimatedReviewHours?: number;
  /** Callback to override return navigation. */
  onReturnHome?: () => void;
  /** Callback to override support contact link. */
  onContactSupport?: () => void;
}

// ─── Sub-components ──────────────────────────────────────────

const FallbackError = () => (
  <div
    role="alert"
    className="p-6 text-center text-destructive bg-destructive/10 rounded-xl border border-destructive/20 max-w-2xl mx-auto"
  >
    Something went wrong displaying the pending screen. Please refresh the page.
  </div>
);

// ─── Main Component Inner ────────────────────────────────────

const SellerPendingStatusInner = memo(function SellerPendingStatusInner({
  email,
  referenceId,
  estimatedReviewHours = 24,
  onReturnHome,
  onContactSupport,
}: SellerPendingStatusProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  // ── Telemetry on Mount ────────────────────────────────────

  useEffect(() => {
    logger.info('SellerPendingStatus: pending state viewed', {
      email: email ? '[REDACTED]' : null,
      referenceId: referenceId || null,
      timestamp: new Date().toISOString(),
    });
    trackEvent('seller_pending_status_viewed', {
      hasEmail: !!email,
      hasReferenceId: !!referenceId,
    });
  }, [email, referenceId]);

  // ── Focus Management on Mount ─────────────────────────────

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.focus();
    }
  }, []);

  // ── Handlers ─────────────────────────────────────────────

  const handleReturnHomeClick = useCallback(() => {
    if (onReturnHome) {
      onReturnHome();
    } else {
      router.push(APP_ROUTES.HOME);
    }
  }, [onReturnHome, router]);

  const handleCopy = useCallback(() => {
    if (!referenceId) return;
    navigator.clipboard.writeText(referenceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [referenceId]);

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label="Registration submitted successfully. Application pending review."
      data-testid="seller-pending-status"
      className="motion-safe:animate-in motion-safe:fade-in mx-auto max-w-2xl duration-500 focus:outline-none"
    >
      <PremiumCard
        className="text-center bg-card text-foreground border border-border shadow-lg rounded-2xl overflow-hidden"
        contentClassName="py-12 px-8 flex flex-col items-center gap-6"
        gradientClassName="bg-gradient-to-r from-success to-success/60 h-2"
      >
        {/* Animated Check icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success/10 border border-success/30 shadow-glow-success">
          <CheckCircle2 className="h-10 w-10 text-success" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
            Registration Submitted Successfully
          </h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Your registration is currently under review by our onboarding compliance team.
          </p>
        </div>

        {/* Application Reference card */}
        <div className="w-full max-w-md rounded-xl border border-border bg-muted/50 p-5 text-left space-y-4 shadow-inner">
          {referenceId && (
            <>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground font-medium">Application ID</span>
                <div className="flex items-center gap-1.5">
                  <span
                    data-testid="seller-pending-reference-id"
                    className="font-mono text-foreground font-bold select-all bg-muted border border-border px-2 py-0.5 rounded"
                  >
                    {referenceId}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    data-testid="seller-pending-copy-btn"
                    aria-label={copied ? 'Copied ID' : 'Copy application ID'}
                    className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-success" aria-hidden="true" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
              <hr className="border-border/30" />
            </>
          )}

          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground font-medium">Expected Review Time</span>
            <span className="text-success font-bold flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Under {estimatedReviewHours} Hours
            </span>
          </div>

          {email && (
            <>
              <hr className="border-border/30" />
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground font-medium">Notification Email</span>
                <span className="text-foreground font-medium truncate max-w-[200px]" data-testid="seller-pending-email">
                  {email}
                </span>
              </div>
            </>
          )}
        </div>

        <div className="max-w-md space-y-3">
          <p className="text-xs text-muted-foreground leading-relaxed font-medium">
            Standard checks typically complete in {estimatedReviewHours} business hours. If further documentation or KYC clarifications are required, a notification will be dispatched to your registered email address.
          </p>
        </div>

        {/* Action Button */}
        <Button
          onClick={handleReturnHomeClick}
          data-testid="seller-pending-return-home-btn"
          className="h-12 w-full max-w-sm rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground font-bold text-xs tracking-wider uppercase transition-all shadow-lg active:scale-[0.98] mt-2 flex items-center justify-center gap-2"
        >
          <span>Return to Homepage</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>

        {/* Secondary support path */}
        <div className="text-center mt-2">
          <a
            href={APP_ROUTES.HELP}
            onClick={(e) => {
              if (onContactSupport) {
                e.preventDefault();
                onContactSupport();
              }
            }}
            className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
          >
            Questions? Contact our seller support team
          </a>
        </div>
      </PremiumCard>
    </div>
  );
});

// ─── Main Component Wrapper ─────────────────────────────────

/**
 * SellerPendingStatus
 *
 * Displays an accessible, telemetry-monitored, and design token compliant success/pending
 * state for users who have completed the seller onboarding registration flow.
 *
 * @security Sanitizes telemetry metadata to prevent email leakages.
 *
 * @accessibility
 * - role="status" and aria-live="polite" announce registration submission.
 * - Tab focus redirects to wrapper container on mount.
 * - Screen readers ignore decorative icons with aria-hidden="true".
 * - Reduced motion is fully supported with motion-safe utility animations.
 */
export const SellerPendingStatus = memo(function SellerPendingStatus(
  props: SellerPendingStatusProps
): React.JSX.Element {
  return (
    <ErrorBoundary FallbackComponent={FallbackError}>
      <SellerPendingStatusInner {...props} />
    </ErrorBoundary>
  );
});

export default SellerPendingStatus;
