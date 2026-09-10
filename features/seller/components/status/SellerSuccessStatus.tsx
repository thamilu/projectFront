// ============================================================
// features/seller/components/status/SellerSuccessStatus.tsx
//
// Ultra Enterprise Grade SellerSuccessStatus Component
// Implements: error boundary, auto-redirect timer, safe callback,
// design tokens, accessibility, and mount/sync telemetry.
// ============================================================

import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/shared/ui/atoms/button';
import { PremiumCard } from '@/shared/ui/molecules/PremiumCard';
import { APP_ROUTES } from '@/shared/routes';
import { logger } from '@/core/telemetry/logger';
import { trackEvent } from '@/core/providers/analytics-provider';

// ─── Props Interface ─────────────────────────────────────────

export interface SellerSuccessStatusProps {
  /** Checked permission status state indicating seller status is active. */
  isSeller: boolean;
  /** Visual indicator for currently in-flight synchronization tasks. */
  isSyncing: boolean;
  /** Prop-based synchronization error string. */
  syncError?: string | null;
  /** Callback fired to trigger sync process. Can reject. */
  onForceSync: () => Promise<void>;
  /** Callback override to navigate to the seller dashboard. */
  onNavigateDashboard?: () => void;
}

// ─── Sub-components ──────────────────────────────────────────

const FallbackError = () => (
  <div
    role="alert"
    className="p-6 text-center text-destructive bg-destructive/10 rounded-xl border border-destructive/20 max-w-2xl mx-auto"
  >
    Something went wrong displaying the activation screen. Please refresh the page.
  </div>
);

// ─── Main Component Inner ────────────────────────────────────

const SellerSuccessStatusInner = memo(function SellerSuccessStatusInner({
  isSeller,
  isSyncing,
  syncError,
  onForceSync,
  onNavigateDashboard,
}: SellerSuccessStatusProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [localSyncError, setLocalSyncError] = useState<string | null>(null);
  const [justSynced, setJustSynced] = useState(false);

  const activeSyncError = syncError || localSyncError;

  // ── Telemetry on Mount ────────────────────────────────────

  useEffect(() => {
    logger.info('SellerSuccessStatus: seller activation displayed', {
      isSeller,
      isSyncing,
      timestamp: new Date().toISOString(),
    });
    trackEvent('seller_account_activated', {
      syncRequired: !isSeller,
    });
  }, [isSeller, isSyncing]);

  // ── Sync Completion Telemetry & State ─────────────────────

  useEffect(() => {
    if (isSeller) {
      setJustSynced(true);
      logger.info('SellerSuccessStatus: permissions synced successfully', {
        timestamp: new Date().toISOString(),
      });
      trackEvent('seller_permissions_synced');
      
      const timer = setTimeout(() => {
        setJustSynced(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isSeller]);

  // ── Focus Management on Mount ─────────────────────────────

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.focus();
    }
  }, []);

  // ── 5-Second Auto-Redirect Timer ──────────────────────────

  useEffect(() => {
    if (isSeller) return; // Wait until synced

    const REDIRECT_DELAY_MS = 5000;
    const timer = setTimeout(() => {
      logger.info('SellerSuccessStatus: auto-redirecting to seller dashboard', {
        timestamp: new Date().toISOString(),
      });
      if (onNavigateDashboard) {
        onNavigateDashboard();
      } else {
        router.push(APP_ROUTES.SELLER.DASHBOARD);
      }
    }, REDIRECT_DELAY_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [isSeller, router, onNavigateDashboard]);

  // ── Handlers ─────────────────────────────────────────────

  const handleNavigateDashboard = useCallback(() => {
    if (onNavigateDashboard) {
      onNavigateDashboard();
    } else {
      router.push(APP_ROUTES.SELLER.DASHBOARD);
    }
  }, [onNavigateDashboard, router]);

  const handleForceSync = useCallback(async () => {
    setLocalSyncError(null);
    try {
      await onForceSync();
    } catch (err: any) {
      const msg = err?.message || 'Sync failed. Please try again.';
      setLocalSyncError(msg);
      logger.error('SellerSuccessStatus: force sync failed', {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }, [onForceSync]);

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label={
        isSeller
          ? 'Seller account activated. You can now go to your dashboard.'
          : 'Seller account activated. Synchronizing permissions, please wait.'
      }
      data-testid="seller-success-status"
      className="motion-safe:animate-in motion-safe:fade-in mx-auto max-w-2xl duration-500 focus:outline-none"
    >
      <PremiumCard
        title="Congratulations!"
        description="Your seller account is active. We are syncing your permissions now."
        gradientClassName="bg-gradient-to-r from-success to-success/60 h-2"
        className="text-center"
        contentClassName="py-12 flex flex-col items-center gap-8"
      >
        {/* Standardized Success Icon Container */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success/10 border border-success/30 shadow-glow-success">
          <CheckCircle2 className="h-10 w-10 text-success" aria-hidden="true" />
        </div>

        {/* Sync Rejection Error Banner */}
        {activeSyncError && (
          <div
            role="alert"
            className="w-full max-w-sm rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-left text-xs font-semibold text-destructive animate-in slide-in-from-top-2 duration-300"
          >
            {activeSyncError}
          </div>
        )}

        {!isSeller && (
          <div className="flex w-full max-w-sm flex-col items-center gap-4">
            <div className="flex w-full items-center justify-center gap-3 rounded-2xl border border-warning/30 bg-warning/10 px-6 py-4 text-xs font-bold tracking-widest text-warning uppercase backdrop-blur-sm">
              <Loader2 className="h-4 w-4 animate-spin text-warning" aria-hidden="true" />
              <span>Synchronizing permissions...</span>
            </div>

            <p className="text-muted-foreground px-4 text-xs font-medium tracking-tight uppercase">
              We're updating your access. Click below if you aren't redirected in 5 seconds.
            </p>

            <Button
              variant="outline"
              onClick={handleForceSync}
              disabled={isSyncing}
              data-testid="seller-success-force-sync-btn"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border-border hover:bg-muted text-xs font-bold tracking-wider text-foreground uppercase transition-all active:scale-[0.98]"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin text-warning" aria-hidden="true" />
                  <span>Synchronizing...</span>
                </>
              ) : (
                <span>Complete My Setup</span>
              )}
            </Button>
          </div>
        )}

        {isSeller && (
          <div className="flex flex-col items-center gap-4 w-full">
            {justSynced && (
              <p
                role="status"
                className="text-success text-xs font-bold tracking-widest uppercase animate-bounce"
              >
                Permissions synchronized successfully!
              </p>
            )}
            <Button
              onClick={handleNavigateDashboard}
              data-testid="seller-success-dashboard-btn"
              className="h-14 rounded-2xl bg-success hover:bg-success/90 text-success-foreground px-12 text-xs font-bold tracking-widest uppercase shadow-lg shadow-glow-success transition-all active:scale-[0.98] w-full max-w-sm flex items-center justify-center"
            >
              Go to Seller Dashboard
            </Button>
          </div>
        )}
      </PremiumCard>
    </div>
  );
});

// ─── Main Component Wrapper ─────────────────────────────────

/**
 * SellerSuccessStatus
 *
 * Confirms seller onboarding completion, auto-redirecting to dashboard once role is synced.
 *
 * @security Catches and logs force-sync endpoint rejections safely to telemetry.
 *
 * @accessibility
 * - role="status" and polite live region notify user of dynamic load state.
 * - Screen readers bypass visual check icons via aria-hidden.
 * - Vestibular motion compliance with motion-safe fade animations.
 * - Automatic keyboard focus alignment to container on mount.
 */
export const SellerSuccessStatus = memo(function SellerSuccessStatus(
  props: SellerSuccessStatusProps
): React.JSX.Element {
  return (
    <ErrorBoundary FallbackComponent={FallbackError}>
      <SellerSuccessStatusInner {...props} />
    </ErrorBoundary>
  );
});

export default SellerSuccessStatus;
