'use client';

/**
 * FormField.tsx
 *
 * Reusable form field wrapper that binds Label, Input, and validation errors.
 * Provides a standardized visual presentation and enforces strict WCAG accessibility (aria-invalid, aria-describedby).
 */

import { ReactNode } from 'react';
import { Input } from '@/shared/ui/atoms/input';
import { Label } from '@/shared/ui/atoms/label';
import { useFormContext, type UseFormRegisterReturn, type FieldError } from 'react-hook-form';
import type { LucideIcon } from 'lucide-react';

export interface FormFieldProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'id' | 'placeholder' | 'className' | 'disabled' | 'readOnly' | 'required'
> {
  /** Unique HTML id for label htmlFor binding and field selection */
  id: string;
  /** Human-readable text label for the field */
  label: ReactNode;
  /** Active validation error message if present */
  error?: string | FieldError;
  /** react-hook-form field registration bindings */
  registration?: UseFormRegisterReturn;
  /** Disables the field input if true */
  disabled?: boolean;
  /** Optional placeholder text inside the input */
  placeholder?: string;
  /** Optional Lucide icon rendering as a leading prefix */
  icon?: LucideIcon;
  /** Additional helper text displayed beneath the input when there is no error */
  helperText?: string;
  /** Sets the field as read-only */
  readOnly?: boolean;
  /** Displays a required marker on the label */
  required?: boolean;
  /** Optional additional CSS classes for container customisation */
  className?: string;
  /** Optional custom child input elements */
  children?: ReactNode;
  /** Displays a verified indicator on the label row */
  verified?: boolean;
  /** Displays a verifying pending state indicator on the label row */
  verifying?: boolean;
}

/**
 * Reusable FormField component
 *
 * Standardised layout for form fields, complete with validation handling, prefix icon alignment,
 * and high-fidelity accessibility bindings for screen reader support.
 */
export function FormField({
  id,
  label,
  error,
  registration,
  disabled = false,
  placeholder,
  icon: Icon,
  helperText,
  readOnly = false,
  required = false,
  className = '',
  children,
  verified,
  verifying,
  'aria-describedby': ariaDescribedByProp,
  ...props
}: FormFieldProps) {
  const errorId = `${id}-error`;
  const descId = `${id}-description`;

  const errorMessage = typeof error === 'string' ? error : error?.message;

  // Merged (space-separated, per the ARIA spec) rather than letting a
  // caller-supplied aria-describedby silently win via the {...props} spread
  // below — a caller passing their own value here previously overwrote this
  // field's own error/helper-text association outright, most visibly
  // breaking the no-error case: `aria-describedby={hasError ? errorId :
  // undefined}` at call sites evaluated to `undefined` once the field was
  // valid, severing the link to helperText even though FormField itself
  // renders it and computes descId for exactly that purpose. Any caller
  // still gets its own id included; this field's own description/error is
  // now never silently dropped.
  const ownDescribedBy = errorMessage ? errorId : helperText ? descId : undefined;
  const resolvedDescribedBy =
    [ariaDescribedByProp, ownDescribedBy].filter(Boolean).join(' ') || undefined;

  // Resolve current value from react-hook-form context if present to check for empty state
  const formContext = useFormContext();
  const formValue = formContext ? formContext.watch(id) : undefined;
  const isValueEmpty = formValue === undefined || formValue === null || formValue === '';

  // Apply visual styling when a field has no user-provided data and is disabled
  const isEmptyAndDisabled = disabled && isValueEmpty;
  const resolvedPlaceholder = isEmptyAndDisabled ? 'Not Added' : placeholder;
  const inputClassOverride = isEmptyAndDisabled
    ? 'italic placeholder:text-slate-400 dark:placeholder:text-slate-400 font-medium bg-slate-900/10'
    : 'placeholder:text-slate-400/80 dark:placeholder:text-slate-500/85';

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <Label
          htmlFor={id}
          className="text-sm font-semibold text-slate-800 dark:text-slate-200 transition-colors flex items-center"
        >
          {label}
          {required && (
            <span className="text-red-500 ml-1.5 cursor-help text-sm font-bold animate-pulse" title="This field is required" aria-label="required">
              *
              <span className="sr-only"> (required)</span>
            </span>
          )}
          {/* A read-only field (e.g. an IdP-managed email) isn't "optional" —
              the user isn't choosing to skip it, they simply can't edit it
              here at all. Labeling it (Optional) implies the opposite. */}
          {!required && !readOnly && (
            <span className="text-slate-500 dark:text-slate-400 ml-2 text-[13px] font-medium animate-fade-in">
              (Optional)
            </span>
          )}
          {readOnly && (
            <span className="text-slate-500 dark:text-slate-400 ml-2 text-[13px] font-medium">
              (Read-only)
            </span>
          )}
        </Label>
        {verifying && (
          <span
            className="text-amber-600 dark:text-amber-400 text-[10px] font-bold tracking-wider uppercase flex items-center gap-1 mr-1 animate-pulse"
            data-testid={`${id}-verifying-badge`}
            aria-label="Verifying field format and validity"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-amber-600 dark:bg-amber-400 animate-ping inline-block" />
            Verifying...
          </span>
        )}
        {!verifying && verified && (
          <span
            className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold tracking-wider uppercase flex items-center gap-0.5 mr-1"
            data-testid={`${id}-verified-badge`}
            aria-label="Field format and validity verified"
          >
            ✓ Verified
          </span>
        )}
      </div>

      {children ? (
        children
      ) : (
        <div className="relative">
          {Icon && (
            <Icon
              className="text-slate-500 pointer-events-none absolute top-3.5 left-3.5 h-4.5 w-4.5"
              aria-hidden="true"
            />
          )}
          <Input
            id={id}
            {...registration}
            disabled={disabled}
            readOnly={readOnly}
            placeholder={resolvedPlaceholder}
            className={`h-12 ${Icon ? 'pl-10' : ''} ${inputClassOverride}`}
            aria-invalid={errorMessage ? 'true' : 'false'}
            aria-describedby={resolvedDescribedBy}
            aria-required={required}
            {...props}
          />
        </div>
      )}

      {errorMessage && (
        <p
          id={errorId}
          className="text-destructive ml-1 text-[13px] font-semibold"
          role="alert"
          aria-live="polite"
        >
          {errorMessage}
        </p>
      )}

      {helperText && !errorMessage && (
        <p id={descId} className="ml-1 text-[12px] font-medium text-slate-500 dark:text-slate-300">
          {helperText}
        </p>
      )}
    </div>
  );
}
