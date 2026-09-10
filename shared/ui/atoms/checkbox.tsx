/**
 * @fileoverview Enterprise Checkbox Component System
 *
 * @description
 * Production-grade checkbox primitive and compound components.
 * Built on Radix UI CheckboxPrimitive with full enterprise feature set.
 *
 * Component Hierarchy:
 * ┌─────────────────────────────────────────────────────┐
 * │  Checkbox       — primitive, manual label wiring    │
 * │  CheckboxField  — compound, label+desc+error DRY    │
 * │  FormCheckbox   — react-hook-form + zod integration │
 * └─────────────────────────────────────────────────────┘
 *
 * @module shared/ui/atoms/checkbox
 * @version 2.1.0
 *
 * @example Primitive
 * <Checkbox id="terms" checked={value} onCheckedChange={setValue} />
 *
 * @example Compound (preferred for forms)
 * <CheckboxField
 *   label="Accept Terms"
 *   description="Read our privacy policy."
 *   error={!!errors.terms}
 *   errorMessage={errors.terms?.message}
 *   checked={value}
 *   onCheckedChange={setValue}
 * />
 *
 * @example Form-ready
 * <FormCheckbox name="terms" control={control} label="Accept Terms" />
 */

'use client';

import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check, Minus, AlertCircle } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { useController, type UseControllerProps, type FieldValues } from 'react-hook-form';

import { cn } from '@/shared/utils';

// ─────────────────────────────────────────────────────────────────────────────
// Section 1: CVA Variant Definitions (Fix #1)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * CVA variant definitions for the Checkbox root element.
 *
 * Size token reference:
 * sm    → 14×14px — Dense data tables, compact UI
 * md    → 16×16px — Standard forms (DEFAULT)
 * lg    → 20×20px — Comfortable forms, settings pages
 * touch → 24×24px — Mobile-first (WCAG 2.5.5 touch target compliance)
 */
const checkboxVariants = cva(
  [
    // ── Layout ────────────────────────────────────────────
    'peer shrink-0',

    // ── Shape ─────────────────────────────────────────────
    'rounded-sm',
    'border border-primary',

    // ── Focus Ring (WCAG 2.4.7) ───────────────────────────
    'ring-offset-background',
    'focus-visible:outline-none',
    'focus-visible:ring-2',
    'focus-visible:ring-ring',
    'focus-visible:ring-offset-2',

    // ── Transitions ───────────────────────────────────────
    'transition-colors duration-150',

    // ── Checked State ─────────────────────────────────────
    'data-[state=checked]:bg-primary',
    'data-[state=checked]:text-primary-foreground',
    'data-[state=checked]:border-primary',

    // ── Indeterminate State ───────────────────────────────
    'data-[state=indeterminate]:bg-primary',
    'data-[state=indeterminate]:text-primary-foreground',
    'data-[state=indeterminate]:border-primary',

    // ── Disabled State ────────────────────────────────────
    'disabled:cursor-not-allowed',
    'disabled:opacity-50',
  ],
  {
    variants: {
      size: {
        sm: 'h-3.5 w-3.5',
        md: 'h-4 w-4',
        lg: 'h-5 w-5',
        touch: 'h-6 w-6',
      },
      hasError: {
        true: [
          'border-destructive',
          'focus-visible:ring-destructive',
          'data-[state=checked]:bg-destructive',
          'data-[state=checked]:border-destructive',
          'data-[state=indeterminate]:bg-destructive',
          'data-[state=indeterminate]:border-destructive',
        ],
        false: [],
      },
    },
    defaultVariants: {
      size: 'md',
      hasError: false,
    },
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Section 2: Type Derivations
// ─────────────────────────────────────────────────────────────────────────────

type CheckboxVariantProps = VariantProps<typeof checkboxVariants>;

/** Semantic size token — use instead of raw pixel values */
type CheckboxSize = NonNullable<CheckboxVariantProps['size']>;

// ─────────────────────────────────────────────────────────────────────────────
// Section 3: Design Token Maps
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Indicator icon sizes — proportional to checkbox container.
 */
const INDICATOR_ICON_SIZE = {
  sm: 'h-2.5 w-2.5',
  md: 'h-3 w-3',
  lg: 'h-3.5 w-3.5',
  touch: 'h-4 w-4',
} as const satisfies Record<CheckboxSize, string>;

/**
 * Shared SVG props for decorative indicator icons.
 * Fix #5 — Centralized and correctly typed.
 */
const DECORATIVE_ICON_PROPS = {
  'aria-hidden': true,
  focusable: 'false',
  strokeWidth: 3,
} as React.SVGAttributes<SVGSVGElement>;

// ─────────────────────────────────────────────────────────────────────────────
// Section 4: Utility Functions
// Fix #3 — resolveErrorState utility (DRY validation logic)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolves the effective error state from multiple input sources.
 * Handles all valid aria-invalid spec values.
 */
function resolveErrorState(
  error: boolean,
  ariaInvalid: React.AriaAttributes['aria-invalid']
): boolean {
  if (error) return true;
  if (ariaInvalid === true) return true;
  if (ariaInvalid === 'true' || ariaInvalid === 'grammar' || ariaInvalid === 'spelling') {
    return true;
  }
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 5: TypeScript Interfaces
// ─────────────────────────────────────────────────────────────────────────────

export interface CheckboxProps
  extends
    Omit<React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>, 'asChild'>,
    CheckboxVariantProps {
  error?: boolean;
}

export interface CheckboxFieldProps extends CheckboxProps {
  label: string;
  description?: string;
  errorMessage?: string;
  containerClassName?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 6: Checkbox Primitive
// ─────────────────────────────────────────────────────────────────────────────

const Checkbox = React.forwardRef<React.ComponentRef<typeof CheckboxPrimitive.Root>, CheckboxProps>(
  ({ className, size, error = false, checked, ...props }, ref) => {
    const hasValidationError = resolveErrorState(error, props['aria-invalid']);

    return (
      <CheckboxPrimitive.Root
        ref={ref}
        checked={checked}
        aria-invalid={hasValidationError ? true : undefined}
        className={cn(checkboxVariants({ size, hasError: hasValidationError }), className)}
        {...props}
      >
        <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
          {checked === 'indeterminate' ? (
            <Minus className={INDICATOR_ICON_SIZE[size ?? 'md']} {...DECORATIVE_ICON_PROPS} />
          ) : (
            <Check className={INDICATOR_ICON_SIZE[size ?? 'md']} {...DECORATIVE_ICON_PROPS} />
          )}
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
    );
  }
);

Checkbox.displayName = 'Checkbox';

// ─────────────────────────────────────────────────────────────────────────────
// Section 7: CheckboxField Compound Component
// ─────────────────────────────────────────────────────────────────────────────

const CheckboxField = React.forwardRef<
  React.ComponentRef<typeof CheckboxPrimitive.Root>,
  CheckboxFieldProps
>(
  (
    {
      label,
      description,
      error = false,
      errorMessage,
      containerClassName,
      id,
      size,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const checkboxId = id ?? generatedId;
    const labelId = `${checkboxId}-label`;
    const descriptionId = description ? `${checkboxId}-description` : undefined;
    const errorId = error && errorMessage ? `${checkboxId}-error` : undefined;
    const describedBy = [descriptionId, errorId].filter(Boolean).join(' ') || undefined;

    const hasValidationError = resolveErrorState(error, props['aria-invalid']);

    return (
      <div className={cn('flex flex-col gap-1', containerClassName)}>
        <div className="flex items-start gap-2.5">
          <Checkbox
            ref={ref}
            id={checkboxId}
            size={size}
            error={hasValidationError}
            disabled={disabled}
            aria-describedby={describedBy}
            aria-labelledby={props['aria-labelledby'] || labelId}
            className="mt-0.5"
            {...props}
          />

          <label
            id={labelId}
            htmlFor={checkboxId}
            data-disabled={disabled ? '' : undefined}
            className={cn(
              'text-sm leading-none font-medium',
              'cursor-pointer select-none',
              hasValidationError && 'text-destructive',
              'data-[disabled]:cursor-not-allowed',
              'data-[disabled]:opacity-70'
            )}
          >
            {label}

            {description && (
              <span
                id={descriptionId}
                className="text-muted-foreground mt-0.5 block text-xs leading-relaxed font-normal"
              >
                {description}
              </span>
            )}
          </label>
        </div>

        {hasValidationError && errorMessage && (
          <div
            id={errorId}
            role="alert"
            aria-live="polite"
            className="flex items-center gap-1.5 pl-6"
          >
            <AlertCircle
              className="text-destructive h-3 w-3 shrink-0"
              aria-hidden="true"
              strokeWidth={2}
            />
            <p className="text-destructive text-xs">{errorMessage}</p>
          </div>
        )}
      </div>
    );
  }
);

CheckboxField.displayName = 'CheckboxField';

// ─────────────────────────────────────────────────────────────────────────────
// Section 8: FormCheckbox — react-hook-form Integration
// ─────────────────────────────────────────────────────────────────────────────

interface FormCheckboxProps<T extends FieldValues>
  extends
    Omit<
      CheckboxFieldProps,
      'checked' | 'onCheckedChange' | 'error' | 'errorMessage' | 'id' | 'name' | 'defaultValue'
    >,
    UseControllerProps<T> {}

export function FormCheckbox<T extends FieldValues>({
  name,
  control,
  rules,
  defaultValue,
  shouldUnregister,
  label,
  ...props
}: FormCheckboxProps<T>) {
  const {
    field,
    fieldState: { error },
  } = useController({
    name,
    control,
    rules,
    defaultValue,
    shouldUnregister,
  });

  return (
    <CheckboxField
      {...props}
      id={name}
      label={label}
      checked={field.value as boolean}
      onCheckedChange={field.onChange}
      onBlur={field.onBlur}
      error={!!error}
      errorMessage={error?.message}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 9: Exports (Fix #2)
// ─────────────────────────────────────────────────────────────────────────────

export { Checkbox, CheckboxField };

export type { CheckboxSize, CheckboxVariantProps };
