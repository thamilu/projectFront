'use client';

import * as React from 'react';
import { cn } from '@/shared/utils';
import { type ButtonGroupProps, type ButtonGroupContextValue } from './button.types';

export const ButtonGroupContext = React.createContext<ButtonGroupContextValue>({});

export const useButtonGroup = (): ButtonGroupContextValue => {
  const ctx = React.useContext(ButtonGroupContext);
  return {
    size: ctx.size,
    variant: ctx.variant,
    disabled: ctx.disabled ?? false,
    orientation: ctx.orientation ?? 'horizontal',
    type: ctx.type,
    spinnerSpeed: ctx.spinnerSpeed,
    loadingPosition: ctx.loadingPosition,
    preserveWidthOnLoading: ctx.preserveWidthOnLoading,
  };
};

export const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  (
    {
      children,
      orientation = 'horizontal',
      size,
      variant,
      disabled,
      fullWidth,
      className,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledBy,
      'data-testid': testId,
      type,
      spinnerSpeed,
      loadingPosition,
      preserveWidthOnLoading,
    },
    ref
  ) => {
    const contextValue = React.useMemo<ButtonGroupContextValue>(
      () => ({
        size,
        variant,
        disabled,
        orientation,
        type,
        spinnerSpeed,
        loadingPosition,
        preserveWidthOnLoading,
      }),
      [
        size,
        variant,
        disabled,
        orientation,
        type,
        spinnerSpeed,
        loadingPosition,
        preserveWidthOnLoading,
      ]
    );

    const isHorizontal = orientation === 'horizontal';

    return (
      <ButtonGroupContext.Provider value={contextValue}>
        <div
          ref={ref}
          role="group"
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          aria-disabled={disabled || undefined}
          data-testid={testId}
          data-slot="button-group"
          data-orientation={orientation}
          data-disabled={disabled || undefined}
          className={cn(
            'flex',
            isHorizontal ? 'flex-row' : 'flex-col',
            // Border-radius collapse on interior corners
            isHorizontal && [
              '[&>*:not(:first-child):not(:last-child)]:rounded-none',
              '[&>*:first-child]:rounded-r-none',
              '[&>*:last-child]:rounded-l-none',
              // Overlap borders to avoid double-border between items
              '[&>*:not(:first-child)]:-ml-px',
              // Ensure hovered/focused border appears on top
              '[&>*:focus-visible]:z-10 [&>*:hover]:z-10',
            ],
            !isHorizontal && [
              '[&>*:not(:first-child):not(:last-child)]:rounded-none',
              '[&>*:first-child]:rounded-b-none',
              '[&>*:last-child]:rounded-t-none',
              '[&>*:not(:first-child)]:-mt-px',
              '[&>*:focus-visible]:z-10 [&>*:hover]:z-10',
            ],
            fullWidth && 'w-full [&>*]:flex-1',
            className
          )}
        >
          {children}
        </div>
      </ButtonGroupContext.Provider>
    );
  }
);

ButtonGroup.displayName = 'ButtonGroup';
