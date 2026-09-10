'use client';

import React from 'react';
import { Label } from '@/shared/ui/atoms/label';
import { ModernDatePicker, DateOfBirthPicker, DeliveryDatePicker } from './date-picker';
import { cn } from '@/shared/utils';

export interface DatePickerFieldProps {
  id: string;
  label: string;
  value?: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  error?: string;
  className?: string;
  /** Component variant ('default' | 'dob' | 'delivery') */
  variant?: 'default' | 'dob' | 'delivery';
  /** Minimum required age (for DOB variant, e.g. 18) */
  minAge?: number;
  /** Maximum valid age (for DOB variant) */
  maxAge?: number;
  /** Custom placeholder */
  placeholder?: string;
  /** Hint text below field */
  hint?: string;
}

export function DatePickerField({
  id,
  label,
  value,
  onChange,
  disabled,
  error,
  className,
  variant = 'default',
  minAge,
  maxAge,
  placeholder,
  hint,
}: DatePickerFieldProps) {
  return (
    <div className="w-full space-y-1.5">
      <Label
        htmlFor={id}
        className="text-muted-foreground ml-1 text-xs font-semibold tracking-wider uppercase"
      >
        {label}
      </Label>
      <div className="group relative">
        {variant === 'dob' ? (
          <DateOfBirthPicker
            id={id}
            value={value}
            onChange={onChange}
            disabled={disabled}
            minAge={minAge}
            maxAge={maxAge}
            placeholder={placeholder ?? 'DD / MM / YYYY'}
            error={error}
            className={className}
          />
        ) : variant === 'delivery' ? (
          <DeliveryDatePicker
            id={id}
            value={value}
            onChange={(date) => onChange(date)}
            disabled={disabled}
            error={error}
            className={className}
          />
        ) : (
          <ModernDatePicker
            id={id}
            value={value ?? ''}
            onChange={onChange}
            disabled={disabled}
            error={error}
            placeholder={placeholder ?? 'Select Date'}
            className={cn(
              disabled ? 'bg-muted/30 cursor-not-allowed border-none shadow-inner' : '',
              error ? 'border-destructive ring-destructive/10' : '',
              className
            )}
          />
        )}
      </div>
      {hint && !error && (
        <p className="text-muted-foreground ml-1 text-[11px] font-normal">{hint}</p>
      )}
      {error && (
        <p className="text-destructive animate-in slide-in-from-top-1 ml-1 text-[10px] font-semibold tracking-tighter uppercase">
          {error}
        </p>
      )}
    </div>
  );
}

export default DatePickerField;
