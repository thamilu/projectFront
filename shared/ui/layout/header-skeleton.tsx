import { cn } from '@/shared/utils';

/**
 * Lightweight placeholder while the interactive header chunk loads.
 * Matches header height to prevent CLS.
 */
export function HeaderSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      data-testid="header-skeleton"
      className={cn('border-border bg-background h-16 w-full border-b', className)}
    />
  );
}
