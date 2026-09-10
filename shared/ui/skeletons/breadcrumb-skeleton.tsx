import { memo } from 'react';
import { cn } from '@/shared/utils';
import { Skeleton } from '@/shared/ui/atoms/skeleton';

export interface BreadcrumbSkeletonProps {
  /** Number of breadcrumb levels to display */
  levels?: number;
  /** Custom className */
  className?: string;
  /** Width of each breadcrumb item in pixels */
  widths?: number[];
  /** Custom separator */
  separator?: string;
}

const DEFAULT_WIDTHS = [48, 80, 64];
const DEFAULT_SEPARATOR = '/';

/**
 * Breadcrumb Skeleton Component
 *
 * Displays a loading skeleton for breadcrumb navigation.
 * Accessible with proper ARIA attributes.
 *
 * @example
 * ```tsx
 * <BreadcrumbSkeleton levels={3} />
 * <BreadcrumbSkeleton levels={4} widths={[50, 100, 80, 60]} />
 * ```
 */
export const BreadcrumbSkeleton = memo(function BreadcrumbSkeleton({
  levels = 3,
  className,
  widths = DEFAULT_WIDTHS,
  separator = DEFAULT_SEPARATOR,
}: BreadcrumbSkeletonProps) {
  if (levels <= 0) return null;

  return (
    <nav
      className={cn('mb-6 flex items-center gap-2', className)}
      aria-label="Breadcrumb navigation loading"
      aria-busy="true"
    >
      {Array.from({ length: levels }).map((_, index) => (
        <div key={index} className="flex items-center gap-2">
          <Skeleton
            width={widths[index] ?? DEFAULT_WIDTHS[index % DEFAULT_WIDTHS.length]}
            className="rounded-md"
            height={16}
          />

          {index < levels - 1 && (
            <span className="text-muted-foreground/40 select-none" aria-hidden="true">
              {separator}
            </span>
          )}
        </div>
      ))}

      {/* Screen reader announcement */}
      <span className="sr-only">Loading breadcrumb navigation</span>
    </nav>
  );
});

BreadcrumbSkeleton.displayName = 'BreadcrumbSkeleton';
