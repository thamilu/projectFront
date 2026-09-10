'use client';

import React, { memo, useState, useCallback, useMemo, useId } from 'react';
import { useFormContext, useFormState, useWatch } from 'react-hook-form';
import { useI18n } from '@/core/i18n';
import type { SellerOnboardingValues } from '@/domains/seller/contracts/seller.schema';
import { PanInput, AadhaarInput, SectionHeader } from '@/shared/ui/molecules';
import { useKycVerification } from '../../hooks/use-kyc-verification';
import { Icon } from '@/shared/ui/atoms/icons/Icon';
import { formatAadhaar, toUpperCaseAlphanumeric } from '@/shared/utils';

/**
 * IndividualVerificationForm Component
 *
 * Renders individual tax (PAN) and biometric identity (Aadhaar) fields.
 * Features:
 * - Scoped react-hook-form subscription via useFormState for performance
 * - Biometric input masking/unmasking on focus and blur (UIDAI & DPDP compliance)
 * - Safe manual onChange and paste handling to capture raw data into RHF
 * - Anti-session-replay and browser cache suppression attributes
 * - Safari fieldset disabled leakage prevention
 * - WCAG-compliant status regions and error summaries with focus links
 */
export const IndividualVerificationForm = memo(function IndividualVerificationForm(): React.ReactElement {
  const { register, control, setValue } = useFormContext<SellerOnboardingValues>();
  const { errors, isSubmitting } = useFormState<SellerOnboardingValues>({
    control,
    name: ['panNumber', 'aadhar'],
  });
  const { t } = useI18n();

  // Unique layout identifiers to prevent accessibility DOM collisions
  const taxSectionId = useId();
  const identitySectionId = useId();

  // Local state for tracking focus to mask/unmask fields in UI
  const [isPanFocused, setIsPanFocused] = useState(false);
  const [isAadharFocused, setIsAadharFocused] = useState(false);

  // Watch raw form values to compute visual masking/formatting
  const panValue = useWatch({ control, name: 'panNumber', defaultValue: '' }) || '';
  const aadharValue = useWatch({ control, name: 'aadhar', defaultValue: '' }) || '';

  // Retrieve verification visual states from shared KYC hook
  const {
    isPanNumberVerified,
    isPanNumberVerifying,
    isAadharVerified,
    isAadharVerifying,
  } = useKycVerification(control, errors);

  const panRegister = register('panNumber');
  const aadharRegister = register('aadhar');

  // Compute visual displays for fields when blurred
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

  // Clean value handlers storing raw data in react-hook-form
  const handlePanChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = toUpperCaseAlphanumeric(e.target.value).slice(0, 10);
      setValue('panNumber', raw, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    },
    [setValue]
  );

  const handlePanPaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData('text');
      const raw = toUpperCaseAlphanumeric(pasted).slice(0, 10);
      setValue('panNumber', raw, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    },
    [setValue]
  );

  const handleAadharChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/\D/g, '').slice(0, 12);
      setValue('aadhar', raw, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    },
    [setValue]
  );

  const handleAadharPaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pastedText = e.clipboardData.getData('text');
      const raw = pastedText.replace(/\D/g, '').slice(0, 12);
      setValue('aadhar', raw, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });

      // Clear clipboard to mitigate third-party exposure of sensitive biometric details
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText('').catch(() => {});
      }
    },
    [setValue]
  );

  // Form-level error summary list (WCAG 3.3.1)
  const errorItems = useMemo(() => {
    const items = [];
    if (errors.panNumber) {
      items.push({
        id: 'panNumber',
        message: `${t('sellerOnboarding.verification.fields.panIndividual')}: ${errors.panNumber.message}`,
      });
    }
    if (errors.aadhar) {
      items.push({
        id: 'aadhar',
        message: `${t('sellerOnboarding.verification.fields.aadhar')}: ${errors.aadhar.message}`,
      });
    }
    return items;
  }, [errors, t]);

  // De-duplicate live status messages to prevent simultaneous screen reader announcements
  const liveStatusMessage = useMemo(() => {
    if (isPanNumberVerifying) return 'Verifying PAN Number, please wait...';
    if (isAadharVerifying) return 'Verifying Aadhaar, please wait...';
    if (isPanNumberVerified) return 'PAN Number verified successfully.';
    if (isAadharVerified) return 'Aadhaar verified successfully.';
    return '';
  }, [isPanNumberVerifying, isPanNumberVerified, isAadharVerifying, isAadharVerified]);

  return (
    <div className="space-y-6 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 duration-300">
      {/* Screen Reader status announcements (WCAG 4.1.3) */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {liveStatusMessage}
      </div>

      {/* Form-level Error Summary Region (WCAG 3.3.1 Error Identification) */}
      {errorItems.length > 0 && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm space-y-2 animate-in fade-in"
          data-testid="verification-error-summary"
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
                  className="hover:underline focus:outline-none focus:ring-2 focus:ring-destructive rounded"
                >
                  {item.message}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <fieldset
        disabled={isSubmitting}
        className="m-0 space-y-8 border-0 p-0"
        data-testid="individual-verification-form"
      >
        <legend className="sr-only">{t('sellerOnboarding.verification.title')}</legend>

        {/* Tax Section */}
        <section aria-labelledby={taxSectionId} className="space-y-4">
          <SectionHeader
            id={taxSectionId}
            iconName="FileText"
            title={t('sellerOnboarding.verification.sections.tax')}
          />
          <PanInput
            id="panNumber"
            label={t('sellerOnboarding.verification.fields.panIndividual')}
            error={errors.panNumber}
            disabled={isSubmitting}
            verified={isPanNumberVerified}
            verifying={isPanNumberVerifying}
            helperText={t('sellerOnboarding.verification.helpers.pan', {
              defaultValue: 'Enter your 10-character PAN as it appears on your card (e.g. ABCDE1234F)',
            })}
            value={displayPanValue}
            onChange={handlePanChange}
            onFocus={() => setIsPanFocused(true)}
            onBlur={(e) => {
              setIsPanFocused(false);
              panRegister.onBlur(e);
            }}
            onPaste={handlePanPaste}
            data-testid="pan-number-input"
            data-hj-suppress
            data-fs-mask="true"
            data-private
            autoComplete="off"
            ref={panRegister.ref}
          />
        </section>

        {/* Identity Section */}
        <section aria-labelledby={identitySectionId} className="space-y-4">
          <SectionHeader
            id={identitySectionId}
            iconName="User"
            title={t('sellerOnboarding.verification.sections.identity')}
          />
          <AadhaarInput
            id="aadhar"
            label={t('sellerOnboarding.verification.fields.aadhar')}
            error={errors.aadhar}
            disabled={isSubmitting}
            verified={isAadharVerified}
            verifying={isAadharVerifying}
            helperText={t('sellerOnboarding.verification.helpers.aadhar', {
              defaultValue: 'Enter your 12-digit Aadhaar number',
            })}
            value={displayAadharValue}
            onChange={handleAadharChange}
            onFocus={() => setIsAadharFocused(true)}
            onBlur={(e) => {
              setIsAadharFocused(false);
              aadharRegister.onBlur(e);
            }}
            onPaste={handleAadharPaste}
            data-testid="aadhar-input"
            data-hj-suppress
            data-fs-mask="true"
            data-private
            autoComplete="off"
            inputMode="numeric"
            pattern="[0-9]*"
            ref={aadharRegister.ref}
          />
        </section>
      </fieldset>
    </div>
  );
});

IndividualVerificationForm.displayName = 'IndividualVerificationForm';
