'use client';

import React, { useCallback, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/shared/ui/atoms/input';
import { FormField } from '@/shared/ui/molecules/FormField';
import { PanInput } from '@/shared/ui/molecules/pan-input';
import { GstinInput } from '@/shared/ui/molecules/gstin-input';
import { Icon } from '@/shared/ui/atoms/icons/Icon';
import { useKycVerification } from '../../hooks/use-kyc-verification';
import { formatGSTIN } from '@/shared/utils';
import type { SellerOnboardingFormData } from '@/domains/seller/contracts/seller.schema';

/**
 * BusinessKycForm Component
 *
 * Handles step-wise identity and tax registration for seller organizations.
 * Standardized inputs (PanInput, GstinInput) ensure consistency with Design Tokens,
 * and high-fidelity accessibility attributes support screen readers.
 */
export function BusinessKycForm(): React.ReactElement {
  const {
    register,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useFormContext<SellerOnboardingFormData>();

  // RHF's default onChange is intentionally discarded here — handleGstinChange
  // below replaces it via setValue() to apply live GSTIN formatting.
  const { onChange: _gstinRegisterOnChange, ...gstinRegister } = register('gstin');

  // Extract memoized verification queries and status states from dedicated custom hook
  const {
    isBusinessPanVerified,
    isBusinessPanVerifying,
    isGstinVerified,
    isGstinVerifying,
  } = useKycVerification(control, errors);

  // Handle GSTIN updates programmatically using RHF setValue instead of direct DOM mutation
  const handleGstinChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatGSTIN(e.target.value);
      setValue('gstin', formatted, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    },
    [setValue]
  );

  // Sanitized paste handler to ensure dashes/spaces are stripped during paste
  const handleGstinPaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pastedText = e.clipboardData.getData('text');
      const formatted = formatGSTIN(pastedText);
      setValue('gstin', formatted, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    },
    [setValue]
  );

  // Form-level error list for accessibility error summary
  const errorItems = useMemo(() => {
    const items = [];
    if (errors.businessName) {
      items.push({ id: 'businessName', message: `Legal Business Name: ${errors.businessName.message}` });
    }
    if (errors.businessPan) {
      items.push({ id: 'businessPan', message: `Business PAN: ${errors.businessPan.message}` });
    }
    if (errors.gstin) {
      items.push({ id: 'gstin', message: `GSTIN: ${errors.gstin.message}` });
    }
    return items;
  }, [errors]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Screen Reader and Accessibility Live Announcement Region */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {isBusinessPanVerifying && 'Verifying Business PAN...'}
        {isBusinessPanVerified && 'Business PAN verified successfully.'}
        {isGstinVerifying && 'Verifying GSTIN...'}
        {isGstinVerified && 'GSTIN verified successfully.'}
      </div>

      {/* Form-level Error Summary Region (WCAG 3.3.1 Error Identification) */}
      {errorItems.length > 0 && (
        <div
          role="alert"
          aria-live="assertive"
          className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm space-y-2 animate-in fade-in"
          data-testid="kyc-error-summary"
        >
          <div className="flex items-center gap-2 font-semibold">
            <Icon name="AlertCircle" className="h-4 w-4 shrink-0" />
            <span>Please correct the errors in the following fields:</span>
          </div>
          <ul className="list-disc pl-5 space-y-1 font-medium">
            {errorItems.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="hover:underline focus:outline-none focus:ring-2 focus:ring-destructive rounded"
                >
                  {item.message}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Legal Business Name */}
      <FormField
        id="businessName"
        label="Legal Business Name"
        error={errors.businessName}
        required
        helperText="Ensure this matches your official registered company name exactly."
      >
        <Input
          id="businessName"
          placeholder="As written on your incorporation documents"
          className="h-12 animate-in fade-in"
          aria-invalid={!!errors.businessName}
          aria-describedby={errors.businessName ? 'businessName-error' : 'businessName-description'}
          disabled={isSubmitting}
          autoComplete="organization"
          {...register('businessName')}
        />
      </FormField>

      {/* PAN & GSTIN Grid */}
      <div className="grid gap-6 sm:grid-cols-2">
        <PanInput
          id="businessPan"
          label="Business PAN"
          error={errors.businessPan}
          disabled={isSubmitting}
          required
          verified={isBusinessPanVerified}
          verifying={isBusinessPanVerifying}
          helperText="Enter the 10-digit PAN registered to your business entity."
          {...register('businessPan')}
        />

        <GstinInput
          id="gstin"
          label="GSTIN (Tax ID)"
          error={errors.gstin}
          required
          verified={isGstinVerified}
          verifying={isGstinVerifying}
          helperText="Provide the 15-digit Goods and Services Tax Identification Number."
          onChange={handleGstinChange}
          onPaste={handleGstinPaste}
          {...gstinRegister}
        />
      </div>
    </div>
  );
}
