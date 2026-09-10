'use client';

import { memo, useEffect, useState, type FC } from 'react';
import { cn } from '@/shared/utils';
import { Spinner } from './Spinner';
import { LoadingText } from './LoadingText';
import { LOADING_CONFIG } from './loading.config';
import type { LoadingProps } from './loading.types';

export const Loading: FC<LoadingProps> = memo(
  ({
    message = 'Loading...',
    size = 'md',
    fullScreen = true,
    showSpinner = true,
    className,
    timeout = LOADING_CONFIG.timeout.default,
    onTimeout,
    testId = 'loading-component',
  }) => {
    const [showSlowWarning, setShowSlowWarning] = useState(false);
    const [timedOut, setTimedOut] = useState(false);

    useEffect(() => {
      // Show warning after 5 seconds
      const warningTimer = setTimeout(() => {
        setShowSlowWarning(true);
      }, LOADING_CONFIG.timeout.warning);

      // Timeout after specified duration
      const timeoutTimer = setTimeout(() => {
        setTimedOut(true);
        onTimeout?.();
      }, timeout);

      return () => {
        clearTimeout(warningTimer);
        clearTimeout(timeoutTimer);
      };
    }, [timeout, onTimeout]);

    const containerClasses = cn(
      'flex items-center justify-center',
      fullScreen && 'min-h-screen bg-background text-foreground',
      className
    );

    const gapClass = LOADING_CONFIG.sizes[size].gap;

    return (
      <div
        role="status"
        aria-live="polite"
        aria-label="Loading content"
        className={containerClasses}
        data-testid={testId}
      >
        <div className={cn('flex flex-col items-center', gapClass)}>
          {showSpinner && <Spinner size={size} />}

          <div className="flex flex-col items-center gap-2">
            <LoadingText size={size}>{message}</LoadingText>

            {showSlowWarning && !timedOut && (
              <p
                className="text-muted-foreground animate-pulse text-xs"
                role="status"
                aria-live="polite"
              >
                This is taking longer than usual...
              </p>
            )}

            {timedOut && (
              <p
                className="text-destructive text-xs font-medium"
                role="alert"
                aria-live="assertive"
              >
                Loading timeout. Please refresh the page.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }
);

Loading.displayName = 'Loading';
