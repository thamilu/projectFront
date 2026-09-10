import React, { memo } from 'react';
import { Skeleton, LoadingRegion } from '@/shared/ui/atoms/skeleton';
import { useI18n } from '@/core/i18n';
import { cn } from '@/shared/utils';

export interface KycFormSkeletonProps {
  /**
   * How many form fields to render loading representations for.
   * @default 2
   */
  fieldCount?: number;
  /**
   * Layout column configuration. Maps single-column (1) vs grid-based (2) layouts.
   * @default 1
   */
  columns?: 1 | 2;
  /**
   * Whether to include a placeholder skeleton for SectionHeader elements.
   * @default false
   */
  showSectionHeaders?: boolean;
  /**
   * Quality Assurance automated testing selector hook.
   * @default 'kyc-form-skeleton'
   */
  'data-testid'?: string;
  /**
   * Spacing and positioning layout overrides.
   */
  className?: string;
}

/**
 * KycFormSkeleton
 *
 * Loading skeleton fallback for onboarding verification forms.
 * Prevents Cumulative Layout Shift (CLS) during asynchronous loading phases.
 * Uses design system's LoadingRegion to ensure AT accessibility and compliance.
 */
export const KycFormSkeleton = memo(function KycFormSkeleton({
  fieldCount = 2,
  columns = 1,
  showSectionHeaders = false,
  'data-testid': testId = 'kyc-form-skeleton',
  className,
}: KycFormSkeletonProps): React.ReactElement {
  const { t } = useI18n();

  return (
    <LoadingRegion
      label={t('sellerOnboarding.kyc.skeleton.loadingLabel', {
        defaultValue: 'Loading verification fields',
      })}
      data-testid={testId}
      className={cn('space-y-6', className)}
    >
      <div
        className={cn(
          'grid gap-6',
          columns === 2 ? 'md:grid-cols-2 grid-cols-1' : 'grid-cols-1'
        )}
      >
        {Array.from({ length: fieldCount }).map((_, i) => {
          // Vary the width slightly to prevent perfect symmetry (w-24, w-32, w-28, w-36)
          const labelWidths = ['w-24', 'w-32', 'w-28', 'w-36'];
          const labelWidth = labelWidths[i % labelWidths.length];

          // Determine if we need to render a section header skeleton.
          // For columns=2, show headers at indices 0 and 2. For columns=1, show at index 0.
          const isSectionBoundary = showSectionHeaders && i % Math.ceil(fieldCount / 2) === 0;

          return (
            <div key={i} className="space-y-4">
              {isSectionBoundary && (
                <div className="flex items-center gap-2 mb-4 col-span-full">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-5 w-40 rounded" />
                </div>
              )}
              <div className="space-y-2">
                <Skeleton className={cn('h-4 rounded', labelWidth)} />
                <Skeleton className="h-12 w-full rounded-md" />
              </div>
            </div>
          );
        })}
      </div>
    </LoadingRegion>
  );
});

KycFormSkeleton.displayName = 'KycFormSkeleton';
