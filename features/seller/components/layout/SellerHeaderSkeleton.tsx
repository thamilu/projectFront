'use client';

import React, { memo, useState, useEffect } from 'react';
import { cn } from '@/shared/utils';
import { useI18n } from '@/core/i18n';
import { Skeleton, LoadingRegion } from '@/shared/ui/atoms/skeleton';

// ── Constants ─────────────────────────────────────────────────

/**
 * Delay in milliseconds before showing skeleton visuals.
 * Prevents flash-of-skeleton on fast connections while the
 * empty CLS-safe container holds layout space immediately.
 */
const SKELETON_SHOW_DELAY_MS = 200;

// ── Types ─────────────────────────────────────────────────────

interface SellerHeaderSkeletonProps {
  /** When true, renders the onboarding header skeleton (h-14) instead of the standard seller dashboard skeleton (h-16). */
  isOnboarding?: boolean;
}

// ── Hook: useDelayedShow ──────────────────────────────────────

/**
 * Returns `true` after the given delay (ms) has elapsed.
 * During the delay period the skeleton container renders empty
 * (preserving CLS-safe layout height) but no animated
 * placeholders are shown, avoiding a distracting flash.
 */
function useDelayedShow(delayMs: number): boolean {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setShow(true), delayMs);
    return () => window.clearTimeout(timer);
  }, [delayMs]);

  return show;
}

// ── Sub-components ────────────────────────────────────────────

/**
 * Standard (seller dashboard) skeleton layout:
 * Left branding | Center search bar | Right actions
 */
const StandardSkeletonContent = memo(function StandardSkeletonContent({
  headerHeight,
}: {
  headerHeight: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 w-full max-w-7xl mx-auto',
        headerHeight,
      )}
    >
      {/* Left branding placeholder */}
      <div className="flex items-center gap-3">
        <Skeleton className="w-24 h-6" rounded="md" />
        <div className="hidden sm:block h-4 w-px bg-border/50" aria-hidden="true" />
        <Skeleton className="hidden sm:block w-20 h-4" rounded="md" />
      </div>

      {/* Center search placeholder */}
      <Skeleton className="hidden md:block w-80 lg:w-96 h-9" rounded="md" />

      {/* Right actions placeholder */}
      <div className="flex items-center space-x-2 md:space-x-3">
        <Skeleton className="w-16 h-8" rounded="xl" />
        <Skeleton className="w-8 h-8" rounded="full" />
        <Skeleton className="w-8 h-8" rounded="full" />
      </div>
    </div>
  );
});

StandardSkeletonContent.displayName = 'StandardSkeletonContent';

/**
 * Onboarding skeleton layout:
 * Left branding + exit | Center step progress | Right actions (Save Draft, Help, Locale, Theme, Avatar)
 */
const OnboardingSkeletonContent = memo(function OnboardingSkeletonContent({
  headerHeight,
}: {
  headerHeight: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 w-full max-w-7xl mx-auto',
        headerHeight,
      )}
    >
      {/* Left branding + exit button placeholder */}
      <div className="flex items-center gap-3">
        <Skeleton className="w-24 h-6" rounded="md" />
        <div className="hidden sm:block h-4 w-px bg-border/50" aria-hidden="true" />
        <Skeleton className="hidden sm:block w-20 h-4" rounded="md" />
      </div>

      {/* Center progress bar placeholder */}
      <div className="hidden md:flex flex-col items-center justify-center flex-1 max-w-[240px] lg:max-w-[320px] mx-auto">
        <div className="flex justify-between w-full mb-1">
          <Skeleton className="w-16 h-3" rounded="md" />
          <Skeleton className="w-20 h-3" rounded="md" />
        </div>
        <Skeleton className="w-full h-1.5" rounded="full" />
      </div>

      {/* Right actions placeholder (Save Draft + Help + Locale + Theme + Avatar) */}
      <div className="flex items-center space-x-2 md:space-x-3">
        <Skeleton className="hidden sm:block w-24 h-8" rounded="xl" />
        <Skeleton className="w-16 h-8" rounded="xl" />
        <Skeleton className="w-16 h-8" rounded="xl" />
        <Skeleton className="w-8 h-8" rounded="full" />
        <Skeleton className="w-8 h-8" rounded="full" />
      </div>
    </div>
  );
});

OnboardingSkeletonContent.displayName = 'OnboardingSkeletonContent';

// ── Main Component ────────────────────────────────────────────

/**
 * SellerHeaderSkeleton — CLS-safe loading skeleton for the seller header.
 *
 * Structural layout constraints match the real `SellerHeader`:
 * - Standard header: `h-16`
 * - Onboarding header: `h-14`
 *
 * Accessibility:
 * - Uses `<header>` with `aria-busy="true"` and translated `aria-label`
 * - Screen reader loading announcement via `<LoadingRegion>` (`role="status"`, `aria-live="polite"`)
 * - All animated placeholders use `motion-safe:animate-pulse` / `motion-reduce:opacity-50`
 *   via the shared `<Skeleton>` primitive (WCAG 2.3.3)
 *
 * Performance:
 * - Visual placeholders are delayed by 200ms to prevent flash-of-skeleton
 * - Empty layout container renders immediately to prevent CLS (< 0.1)
 * - Wrapped in `React.memo` to prevent unnecessary re-renders
 *
 * @see {@link file:///g:/Project/eshop_front/features/seller/components/layout/header.tsx SellerHeader}
 */
export const SellerHeaderSkeleton = memo<SellerHeaderSkeletonProps>(
  function SellerHeaderSkeleton({ isOnboarding = false }): React.JSX.Element {
    const { t } = useI18n();
    const showVisuals = useDelayedShow(SKELETON_SHOW_DELAY_MS);

    const headerHeight = isOnboarding ? 'h-14' : 'h-16';

    const loadingLabel = isOnboarding
      ? t('seller.skeleton.loadingOnboarding')
      : t('seller.skeleton.loadingStandard');

    return (
      <header
        aria-label={t('seller.skeleton.headerAriaLabel')}
        aria-busy="true"
        className={cn(
          'bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/85 sticky top-0 right-0 left-0 z-50 border-b border-border/80 shadow-xs transition-all duration-200 w-full',
          headerHeight,
        )}
        data-testid="seller-header-skeleton"
      >
        {/* Screen reader loading announcement */}
        <LoadingRegion label={loadingLabel}>
          <span className="sr-only">{loadingLabel}</span>
        </LoadingRegion>

        {/* Visual skeleton placeholders — delayed to prevent flash */}
        {showVisuals && (
          isOnboarding ? (
            <OnboardingSkeletonContent headerHeight={headerHeight} />
          ) : (
            <StandardSkeletonContent headerHeight={headerHeight} />
          )
        )}
      </header>
    );
  },
);

SellerHeaderSkeleton.displayName = 'SellerHeaderSkeleton';
