'use client';

import { memo, type ReactElement } from 'react';
import { Skeleton } from '@/shared/ui/atoms/skeleton';
import { cn } from '@/shared/utils';

export interface BenefitsSkeletonProps {
  /**
   * The number of benefit skeleton cards to render.
   * Defaults to 6 to match the production count of SELLER_BENEFITS.
   */
  count?: number;
  /**
   * Optional className to override outer container styles.
   */
  className?: string;
}

export const BenefitsSkeleton = memo(function BenefitsSkeleton({
  count = 6,
  className,
}: BenefitsSkeletonProps): ReactElement {
  // Safe bounds check for dynamic count prop to prevent unexpected visual layouts
  const safeCount = Math.max(1, Math.min(count, 12));

  return (
    <div
      data-testid="benefits-skeleton"
      className={cn('mx-auto mt-12 max-w-4xl space-y-8', className)}
    >
      {/* Visually hidden status announcement for screen readers (WCAG 4.1.3 Compliance) */}
      <span className="sr-only" role="status" aria-live="polite">
        Loading benefits, please wait.
      </span>

      {/* Decorative loading skeleton - hidden from screen readers to prevent cluttering */}
      <div
        aria-hidden="true"
        className="animate-pulse motion-reduce:animate-none space-y-8"
      >
        {/* Section title placeholder */}
        <Skeleton className="mx-auto h-8 w-48 rounded-md" />

        {/* Benefits cards grid — mirrors the grid layout in SellerBenefitsSection */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {Array.from({ length: safeCount }, (_, i) => (
            <div
              key={`benefit-skeleton-${i}`}
              className="rounded-2xl border border-border bg-card p-6 flex flex-col items-center text-center space-y-4"
            >
              {/* Icon placeholder — matches the real card icon size (h-8 w-8) and spacing (mb-3) */}
              <Skeleton className="h-8 w-8 rounded-full mb-3" />

              {/* Title placeholder */}
              <Skeleton className="h-5 w-32 rounded-md" />

              {/* Body text lines */}
              <div className="space-y-2 w-full flex flex-col items-center">
                <Skeleton className="h-3 w-full rounded-md" />
                <Skeleton className="h-3 w-5/6 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

BenefitsSkeleton.displayName = 'BenefitsSkeleton';
