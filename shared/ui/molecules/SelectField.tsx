import React from 'react';
import { Label } from '@/shared/ui/atoms/label';
import { RequiredMark } from '@/shared/ui/atoms/required-mark';
import { cn } from '@/shared/utils';

interface Option {
  value: string;
  label: string;
}

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: readonly Option[] | Option[];
  error?: string;
  id: string;
  /**
   * Marks the field as required, both visually (an asterisk) and for
   * assistive tech (`aria-required` on the select, plus screen-reader-only
   * "(required)" text — WCAG 3.3.2). Mirrors StepInput's `required` prop and
   * the pattern already established by shared/ui/molecules/FormField.tsx.
   */
  required?: boolean;
}

export const SelectField = React.forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, options, error, id, className, disabled, required, ...props }, ref) => {
    const errorId = React.useId();
    return (
      <div className="w-full space-y-1.5">
        <Label
          htmlFor={id}
          className="text-muted-foreground ml-1 text-xs font-semibold tracking-wider uppercase"
        >
          {label}
          {required && <RequiredMark />}
        </Label>
        <div className="group relative">
          <select
            id={id}
            ref={ref}
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            aria-required={required}
            className={cn(
              'focus:ring-primary/20 focus:border-primary border-input bg-background text-foreground flex h-11 w-full appearance-none rounded-md border px-3 py-2 pr-10 text-sm transition-all hover:border-accent-foreground/30 focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
              error ? 'border-destructive ring-destructive/10' : '',
              className
            )}
            {...props}
          >
            <option value="">Select {label}</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {/* Custom dropdown arrow */}
          <div className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
        {error && (
          <p
            id={errorId}
            role="alert"
            className="text-destructive animate-in slide-in-from-top-1 ml-1 text-[10px] font-semibold tracking-tighter uppercase"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

SelectField.displayName = 'SelectField';
export default SelectField;
