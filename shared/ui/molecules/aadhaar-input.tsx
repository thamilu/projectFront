import { forwardRef, useCallback } from 'react';
import { FieldError } from 'react-hook-form';
import { Input } from '@/shared/ui/atoms/input';
import { FormField } from '@/shared/ui/molecules/FormField';
import { formatAadhaar } from '@/shared/utils';

export interface AadhaarInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'id' | 'placeholder' | 'className' | 'disabled' | 'readOnly' | 'required'
> {
  id: string;
  label?: string;
  error?: FieldError | string;
  disabled?: boolean;
  required?: boolean;
  verified?: boolean;
  verifying?: boolean;
  helperText?: string;
}

export const AadhaarInput = forwardRef<HTMLInputElement, AadhaarInputProps>(
  (
    {
      id,
      label = 'Aadhaar Number (12 Digits)',
      error,
      disabled,
      required = true,
      verified,
      verifying,
      helperText,
      onChange,
      ...props
    },
    ref
  ) => {
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        e.target.value = formatAadhaar(e.target.value);
        onChange?.(e);
      },
      [onChange]
    );

    return (
      <FormField
        id={id}
        label={label}
        error={error}
        required={required}
        verified={verified}
        verifying={verifying}
        helperText={helperText}
      >
        <Input
          ref={ref}
          id={id}
          placeholder="1234 5678 9012"
          className="h-12 font-mono tracking-widest animate-in fade-in"
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : helperText ? `${id}-description` : undefined}
          disabled={disabled}
          maxLength={14}
          inputMode="numeric"
          autoComplete="off"
          data-lpignore="true"
          data-form-type="other"
          data-1p-ignore
          data-hj-suppress
          data-fs-mask="true"
          data-private
          onChange={handleChange}
          {...props}
        />
      </FormField>
    );
  }
);

AadhaarInput.displayName = 'AadhaarInput';
