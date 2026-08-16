'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { PanInput } from '@/shared/ui/molecules/pan-input';
import { AadhaarInput } from '@/shared/ui/molecules/aadhaar-input';
import { Icon } from '@/shared/ui/atoms/icons/Icon';
import { useKycVerification } from '../../hooks/use-kyc-verification';
import { formatAadhaar } from '@/shared/utils';
import type { SellerOnboardingValues } from '@/domains/seller/contracts/seller.schema';

/**
 * IndividualKycForm Component
 *
 * Handles step-wise identity registration for individual seller onboarding.
 * Incorporates strict security masking of biometric data (Aadhaar & PAN) on blur,
 * suppressed autocomplete/session replays, de-concatenated live status announcements,
 * and unified screen reader group fieldsets.
 */
export function IndividualKycForm(): React.ReactElement {
  const {
    register,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useFormContext<SellerOnboardingValues>();

  const [isPanFocused, setIsPanFocused] = useState(false);
  const [isAadharFocused, setIsAadharFocused] = useState(false);

  // Scoped field subscriptions to prevent parent form re-render cascades
  const panValue = useWatch({ control, name: 'panNumber', defaultValue: '' }) || '';
  const aadharValue = useWatch({ control, name: 'aadhar', defaultValue: '' }) || '';

  const panRegister = register('panNumber');
  const aadharRegister = register('aadhar');

  // Extract verification queries and status states from custom hook
  const {
    isPanNumberVerified,
    isPanNumberVerifying,
    isAadharVerified,
    isAadharVerifying,
  } = useKycVerification(control, errors);

  // Mask sensitive PAN and Aadhaar characters when blurred
  const displayPanValue = useMemo(() => {
    if (isPanFocused) {
      return panValue;
    }
    if (panValue.length === 10) {
      return `${panValue.slice(0, 5)}****${panValue.slice(9)}`;
    }
    return panValue;
  }, [panValue, isPanFocused]);

  const displayAadharValue = useMemo(() => {
    const formatted = formatAadhaar(aadharValue);
    if (isAadharFocused) {
      return formatted;
    }
    if (formatted.length === 14) {
      return `XXXX XXXX ${formatted.slice(10)}`;
    }
    return formatted;
  }, [aadharValue, isAadharFocused]);

  // Handle PAN value updates programmatically
  const handlePanChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
      setValue('panNumber', raw, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    },
    [setValue]
  );

  // Handle Aadhaar updates programmatically, storing space-stripped unmasked value in RHF
  const handleAadharChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/\s/g, '').slice(0, 12);
      setValue('aadhar', raw, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    },
    [setValue]
  );

  // Intercept paste on Aadhaar, format cleanly, write to RHF, and clear clipboard for security
  const handleAadharPaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pastedText = e.clipboardData.getData('text');
      const raw = pastedText.replace(/\s/g, '').slice(0, 12);
      setValue('aadhar', raw, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });

      // Clear clipboard to mitigate third-party exposure of sensitive biometric details
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText('').catch(() => {
          // Suppress clipboard write failures silently
        });
      }
    },
    [setValue]
  );

  // Form-level error summary list (WCAG 3.3.1)
  const errorItems = useMemo(() => {
    const items: Array<{ id: string; message: string }> = [];
    if (errors.panNumber?.message) {
      items.push({ id: 'panNumber', message: `PAN Number: ${errors.panNumber.message}` });
    }
    if (errors.aadhar?.message) {
      items.push({ id: 'aadhar', message: `Aadhaar Number: ${errors.aadhar.message}` });
    }
    return items;
  }, [errors.panNumber, errors.aadhar]);

  // De-duplicate live status messages to prevent simultaneous screen reader announcements
  const liveStatusMessage = useMemo(() => {
    if (isPanNumberVerifying) return 'Verifying PAN Number, please wait...';
    if (isAadharVerifying) return 'Verifying Aadhaar Number, please wait...';
    if (isPanNumberVerified) return 'PAN Number verified successfully.';
    if (isAadharVerified) return 'Aadhaar Number verified successfully.';
    return '';
  }, [isPanNumberVerifying, isPanNumberVerified, isAadharVerifying, isAadharVerified]);

  return (
    <div className="space-y-6 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 duration-300">
      {/* Screen Reader status region */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {liveStatusMessage}
      </div>

      {/* Form-level Error Summary Region (WCAG 3.3.1 Error Identification) */}
      {errorItems.length > 0 && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm space-y-2 animate-in fade-in"
          data-testid="kyc-error-summary"
        >
          <div className="flex items-center gap-2 font-semibold">
            <Icon name="AlertCircle" className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Please correct the errors in the following fields:</span>
          </div>
          <ul className="list-disc pl-5 space-y-1 font-medium">
            {errorItems.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive rounded"
                >
                  {item.message}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Programmatic fieldset context for keyboard/AT users */}
      <fieldset disabled={isSubmitting} className="border-0 m-0 p-0 space-y-6">
        <legend className="sr-only">Individual KYC Identity Verification</legend>

        <PanInput
          id="panNumber"
          label="PAN Number"
          error={errors.panNumber}
          required
          verified={isPanNumberVerified}
          verifying={isPanNumberVerifying}
          helperText="Enter your 10-digit Permanent Account Number (PAN) as it appears on your card."
          value={displayPanValue}
          onChange={handlePanChange}
          onFocus={() => setIsPanFocused(true)}
          onBlur={(e) => {
            setIsPanFocused(false);
            panRegister.onBlur(e);
          }}
          disabled={isSubmitting}
          data-hj-suppress
          data-fs-mask="true"
          data-private
          autoComplete="off"
          ref={panRegister.ref}
        />

        <AadhaarInput
          id="aadhar"
          label="Aadhaar Number"
          error={errors.aadhar}
          required={false}
          verified={isAadharVerified}
          verifying={isAadharVerifying}
          helperText="Optional — Provide your 12-digit Aadhaar number to expedite identity verification."
          value={displayAadharValue}
          onChange={handleAadharChange}
          onFocus={() => setIsAadharFocused(true)}
          onBlur={(e) => {
            setIsAadharFocused(false);
            aadharRegister.onBlur(e);
          }}
          onPaste={handleAadharPaste}
          disabled={isSubmitting}
          data-hj-suppress
          data-fs-mask="true"
          data-private
          autoComplete="off"
          ref={aadharRegister.ref}
        />
      </fieldset>
    </div>
  );
}
