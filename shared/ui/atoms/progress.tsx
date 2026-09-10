'use client';

import * as React from 'react';
import { cn } from '@/shared/utils';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number | null;
}

const ProgressComponent = React.forwardRef<HTMLDivElement, ProgressProps>(function Progress(
  { className, value = 0, ...props },
  ref
) {
  const safeValue = value == null ? 0 : Math.min(Math.max(value, 0), 100);

  return (
    <div
      ref={ref}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value == null ? undefined : safeValue}
      className={cn('bg-secondary relative h-4 w-full overflow-hidden rounded-full', className)}
      {...props}
    >
      <div
        className="bg-primary h-full w-full flex-1 transition-all"
        style={{ transform: `translateX(-${100 - safeValue}%)` }}
      />
    </div>
  );
});

ProgressComponent.displayName = 'Progress';

export const Progress = React.memo(ProgressComponent);
Progress.displayName = 'Progress';
