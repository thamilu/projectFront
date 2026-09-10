import { memo, type FC, type ReactNode } from 'react';
import { cn } from '@/shared/utils';
import { LOADING_CONFIG } from './loading.config';
import type { LoadingSize } from './loading.config';

interface LoadingTextProps {
  children: ReactNode;
  size?: LoadingSize;
  className?: string;
}

export const LoadingText: FC<LoadingTextProps> = memo(({ children, size = 'md', className }) => {
  const sizeClasses = LOADING_CONFIG.sizes[size].text;

  return (
    <p
      className={cn(
        'text-muted-foreground font-medium',
        'motion-safe:animate-pulse',
        sizeClasses,
        className
      )}
    >
      {children}
      <span className="sr-only">. Please wait.</span>
    </p>
  );
});

LoadingText.displayName = 'LoadingText';
