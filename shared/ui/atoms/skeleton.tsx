/**
 * Skeleton Component
 * Loading placeholder with animated gradient
 * Part of shadcn/ui component library
 */

import { cn } from '@/shared/utils';

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  );
}

export { Skeleton };
