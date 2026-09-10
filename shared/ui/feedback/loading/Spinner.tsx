import { memo, type FC } from 'react';
import { cn } from '@/shared/utils';
import { LOADING_CONFIG } from './loading.config';
import type { SpinnerProps } from './loading.types';

export const Spinner: FC<SpinnerProps> = memo(({ size = 'md', className }) => {
  const sizeClasses = LOADING_CONFIG.sizes[size].spinner;

  return (
    <div
      className="relative"
      aria-hidden="true"
      style={{
        willChange: 'transform',
        transform: 'translateZ(0)',
      }}
    >
      {/* Main spinner */}
      <div
        className={cn(
          'border-primary rounded-full border-b-2',
          'motion-safe:animate-spin motion-reduce:opacity-50',
          sizeClasses,
          className
        )}
      />

      {/* Pulse effect - only on motion-safe */}
      <div
        className={cn(
          'absolute top-0 left-0 rounded-full',
          'border-primary/20 border-2',
          'motion-safe:animate-ping motion-reduce:hidden',
          sizeClasses
        )}
      />
    </div>
  );
});

Spinner.displayName = 'Spinner';
