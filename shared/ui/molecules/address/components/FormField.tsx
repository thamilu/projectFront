'use client';

import { Input } from '@/shared/ui/atoms/input';
import { Label } from '@/shared/ui/atoms/label';
import { RequiredMark } from '@/shared/ui/atoms/required-mark';
import { Loader2 } from 'lucide-react';

import { ADDRESS_STYLES } from '../address.types';
import type { GetErrorFn } from '../address.types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormFieldProps {
  /** Unique field identifier used for `htmlFor`, `id`, and `aria-describedby`. */
  fieldId: string;
  /** Display label for the field. */
  label: string;
  /** react-hook-form register return value spread onto the Input. */
  registration: ReturnType<typeof Object>;
  /** Error accessor function. */
  getError: GetErrorFn;
  /** Input placeholder text. */
  placeholder?: string;
  /** Whether the field is disabled. */
  disabled?: boolean;
  /** Whether the field is read-only. */
  readOnly?: boolean;
  /** Whether to show a loading spinner next to the label. */
  loading?: boolean;
  /** Optional suffix text for the label (e.g. "(Optional)"). */
  labelSuffix?: string;
  /** Additional CSS classes for the Input element. */
  inputClassName?: string;
  /**
   * Marks the field as required — an asterisk on the label (via
   * RequiredMark) plus `aria-required` on the input (WCAG 3.3.2).
   */
  required?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Reusable form field wrapper.
 *
 * Provides a consistent layout for:
 * - Label (with optional loading spinner and suffix)
 * - Input
 * - Error message
 *
 * Includes WCAG accessibility via `aria-invalid` and `aria-describedby`.
 *
 * @example
 * ```tsx
 * <FormField
 *   fieldId={fields.addressLine1}
 *   label="Address Line 1"
 *   registration={register(fields.addressLine1)}
 *   getError={getError}
 *   placeholder="Street address"
 * />
 * ```
 */
export function FormField({
  fieldId,
  label,
  registration,
  getError,
  placeholder,
  disabled = false,
  readOnly = false,
  loading = false,
  labelSuffix,
  inputClassName,
  required,
}: FormFieldProps) {
  const errorMessage = getError(fieldId);
  const errorId = `${fieldId}-error`;

  return (
    <div className={ADDRESS_STYLES.fieldGroup}>
      <Label htmlFor={fieldId} className={`${ADDRESS_STYLES.label} flex items-center gap-2`}>
        {label}
        {required && <RequiredMark />}
        {labelSuffix ? ` ${labelSuffix}` : ''}
        {loading && <Loader2 className="text-primary h-3 w-3 animate-spin" />}
      </Label>
      <Input
        id={fieldId}
        {...(registration as object)}
        placeholder={placeholder}
        className={inputClassName ?? ADDRESS_STYLES.input}
        disabled={disabled}
        readOnly={readOnly}
        aria-invalid={!!errorMessage}
        aria-describedby={errorMessage ? errorId : undefined}
        aria-required={required}
      />
      {errorMessage && (
        <p id={errorId} className={ADDRESS_STYLES.error} role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
