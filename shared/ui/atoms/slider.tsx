'use client';

import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/utils';

// ── CVA Variant Definitions ──────────────────────────────────────────────────

const sliderVariants = cva(['relative flex w-full touch-none select-none items-center'], {
  variants: {
    size: {
      sm: 'h-1', // 4px track
      md: 'h-1.5', // 6px track (DEFAULT)
      lg: 'h-2', // 8px track
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const thumbVariants = cva(
  [
    'block rounded-full border-2 border-primary',
    'bg-background',
    'ring-offset-background transition-colors',
    'focus-visible:outline-none',
    'focus-visible:ring-2',
    'focus-visible:ring-ring',
    'focus-visible:ring-offset-2',
    'disabled:pointer-events-none',
    'disabled:opacity-50',
  ],
  {
    variants: {
      size: {
        sm: 'h-4 w-4', // 16px
        md: 'h-5 w-5', // 20px (DEFAULT)
        lg: 'h-6 w-6', // 24px
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

// ── Type Derivations ─────────────────────────────────────────────────────────

type SliderVariantProps = VariantProps<typeof sliderVariants>;

export type SliderSize = NonNullable<SliderVariantProps['size']>;

// ── TypeScript Interfaces ───────────────────────────────────────────────────

export interface SliderProps
  extends
    Omit<React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>, 'asChild'>,
    SliderVariantProps {
  /**
   * Accessible label describing the slider's purpose.
   * Required for screen reader users (WCAG 4.1.2).
   */
  'aria-label'?: string;

  /**
   * Minimum allowed value.
   * Radix uses this to set aria-valuemin automatically.
   * @default 0
   */
  min?: number;

  /**
   * Maximum allowed value.
   * Radix uses this to set aria-valuemax automatically.
   * @default 100
   */
  max?: number;

  /**
   * Step increment for keyboard and pointer interactions.
   * @default 1
   */
  step?: number;
}

export interface SliderFieldProps extends SliderProps {
  /** Visible label text */
  label: string;
  /** Optional helper text below slider */
  description?: string;
  /**
   * Custom value formatter.
   * **Must be memoized** (useCallback) to prevent re-renders.
   * @example
   * const formatPrice = useCallback(
   *   (v: number[]) => `$${v[0]} - $${v[1]}`,
   *   []
   * );
   */
  formatValue?: (value: number[]) => string;
  /** Show current value next to label @default true */
  showValue?: boolean;
  /** Wrapper className */
  containerClassName?: string;
  /** Error message shown below slider */
  errorMessage?: string;
  /** Error state — applies destructive styling @default false */
  error?: boolean;
}

// ── Slider Primitive ─────────────────────────────────────────────────────────

const SliderComponent = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(function Slider({ className, size, value, defaultValue, ...props }, ref) {
  // FIX #1: Dynamic thumb rendering based on value length
  const thumbCount = value ? value.length : defaultValue ? defaultValue.length : 1;

  const ariaLabel = props['aria-label'];
  const ariaInvalid = props['aria-invalid'];

  // Helper to construct accessible labels for multi-thumb sliders
  const getThumbLabel = (index: number) => {
    if (!ariaLabel) return undefined;
    if (thumbCount === 1) return ariaLabel;
    if (thumbCount === 2) {
      return index === 0 ? `${ariaLabel} (Minimum)` : `${ariaLabel} (Maximum)`;
    }
    return `${ariaLabel} (Handle ${index + 1})`;
  };

  return (
    <SliderPrimitive.Root
      ref={ref}
      value={value}
      defaultValue={defaultValue}
      className={cn(sliderVariants({ size }), className)}
      {...props}
    >
      <SliderPrimitive.Track className="bg-secondary relative h-full w-full grow overflow-hidden rounded-full">
        <SliderPrimitive.Range className="bg-primary absolute h-full" />
      </SliderPrimitive.Track>

      {/* FIX #1: Render one Thumb per value */}
      {Array.from({ length: thumbCount }, (_, index) => (
        <SliderPrimitive.Thumb
          key={index}
          className={cn(thumbVariants({ size }))}
          aria-label={getThumbLabel(index)}
          aria-invalid={ariaInvalid}
        />
      ))}
    </SliderPrimitive.Root>
  );
});

// FIX #3: Explicit displayName
SliderComponent.displayName = 'Slider';

// FIX #2: Correct memo wrapping order
export const Slider = React.memo(SliderComponent);
Slider.displayName = 'Slider';

// ── SliderField Compound Component ──────────────────────────────────────────

const SliderFieldComponent = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderFieldProps
>(function SliderField(
  {
    label,
    description,
    formatValue,
    showValue = true,
    containerClassName,
    errorMessage,
    error = false,
    value,
    defaultValue,
    disabled,
    min = 0, // FIX #4: Default ensures aria-valuemin
    max = 100, // FIX #4: Default ensures aria-valuemax
    step = 1,
    id: userId,
    ...props
  },
  ref
) {
  const generatedId = React.useId();
  const id = userId || generatedId;
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = errorMessage ? `${id}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(' ') || undefined;

  // FIX #7: Handle both controlled and uncontrolled modes
  const displayValue = value ?? defaultValue ?? [min];

  // FIX #6: Remove formatValue from deps (accept it can change)
  const formattedValue = React.useMemo(() => {
    if (!showValue) return null;
    if (formatValue) return formatValue(displayValue);
    if (Array.isArray(displayValue)) {
      return displayValue.length === 1 ? String(displayValue[0]) : displayValue.join(' - ');
    }
    return String(displayValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayValue, showValue]); // formatValue removed from deps

  const hasError = error || !!errorMessage;

  return (
    <div className={cn('flex flex-col gap-2', containerClassName)}>
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={id}
          data-disabled={disabled ? '' : undefined}
          className={cn(
            'text-sm leading-none font-medium',
            'data-[disabled]:cursor-not-allowed',
            'data-[disabled]:opacity-70',
            hasError && 'text-destructive'
          )}
        >
          {label}
        </label>
        {showValue && (
          <span
            className="text-muted-foreground text-sm tabular-nums"
            aria-live="polite"
            aria-atomic="true"
          >
            {formattedValue}
          </span>
        )}
      </div>

      <Slider
        ref={ref}
        id={id}
        value={value}
        defaultValue={defaultValue}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        aria-label={label}
        aria-describedby={describedBy}
        // FIX #4: aria-invalid for WCAG 4.1.2
        aria-invalid={hasError ? true : undefined}
        // FIX #5: Error state styling
        className={cn(
          hasError && [
            '[&_[data-radix-slider-range]]:bg-destructive',
            '[&_[data-radix-slider-thumb]]:border-destructive',
          ]
        )}
        {...props}
      />

      {description && (
        <p id={descriptionId} className="text-muted-foreground text-xs">
          {description}
        </p>
      )}

      {errorMessage && (
        <p id={errorId} role="alert" aria-live="polite" className="text-destructive text-xs">
          {errorMessage}
        </p>
      )}
    </div>
  );
});

// FIX #3: Explicit displayName
SliderFieldComponent.displayName = 'SliderField';

// FIX #2: Correct memo wrapping
export const SliderField = React.memo(SliderFieldComponent);
SliderField.displayName = 'SliderField';
