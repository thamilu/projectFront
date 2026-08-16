import React, { memo, useCallback, useMemo, useId } from 'react';
import { useFormContext } from 'react-hook-form';
import { useI18n } from '@/core/i18n';
import type { SellerOnboardingValues } from '@/domains/seller/contracts/seller.schema';
import { PanInput, AadhaarInput, GstinInput, SectionHeader } from '@/shared/ui/molecules';
import { useKycVerification } from '../../hooks/use-kyc-verification';
import { Icon } from '@/shared/ui/atoms/icons/Icon';
import { formatAadhaar, formatGSTIN, toUpperCaseAlphanumeric } from '@/shared/utils';

/**
 * BusinessVerificationForm Component
 *
 * Renders the organization tax and identity verification step fields.
 * Includes inline formatting, live gov API verification visual states,
 * and high-fidelity accessibility compliance (error summaries, status announcements).
 */
export const BusinessVerificationForm = memo(function BusinessVerificationForm(): React.ReactElement {
  const {
    register,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useFormContext<SellerOnboardingValues>();
  const { t } = useI18n();

  // Unique layout identifiers to prevent accessibility DOM collisions
  const taxSectionId = useId();
  const identitySectionId = useId();

  // Extract memoized verification states and server-side query indicators from custom hook
  const {
    isPanNumberVerified,
    isPanNumberVerifying,
    isBusinessPanVerified,
    isBusinessPanVerifying,
    isAadharVerified,
    isAadharVerifying,
    isGstinVerified,
    isGstinVerifying,
  } = useKycVerification(control, errors);

  // Destructure registers to isolate and prevent RHF onChange overrides in custom inputs —
  // each field's own handleXChange below replaces the discarded onChange via setValue().
  const { onChange: _panOnChange, ...panRegister } = register('panNumber');
  const { onChange: _bizPanOnChange, ...bizPanRegister } = register('businessPan');
  const { onChange: _aadharOnChange, ...aadharRegister } = register('aadhar');
  const { onChange: _gstinOnChange, ...gstinRegister } = register('gstin');

  // Change and Paste Handlers to format and sanitize user values programmatically (XSS/ReDoS safe)
  const handlePanNumberChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = toUpperCaseAlphanumeric(e.target.value);
      setValue('panNumber', formatted, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    },
    [setValue]
  );

  const handlePanNumberPaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData('text');
      const formatted = toUpperCaseAlphanumeric(pasted);
      setValue('panNumber', formatted, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    },
    [setValue]
  );

  const handleBusinessPanChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = toUpperCaseAlphanumeric(e.target.value);
      setValue('businessPan', formatted, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    },
    [setValue]
  );

  const handleBusinessPanPaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData('text');
      const formatted = toUpperCaseAlphanumeric(pasted);
      setValue('businessPan', formatted, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    },
    [setValue]
  );

  const handleAadharChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatAadhaar(e.target.value);
      setValue('aadhar', formatted, {
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
      const pasted = e.clipboardData.getData('text');
      const formatted = formatAadhaar(pasted);
      setValue('aadhar', formatted, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    },
    [setValue]
  );

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

  const handleGstinPaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData('text');
      const formatted = formatGSTIN(pasted);
      setValue('gstin', formatted, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    },
    [setValue]
  );

  // Form-level error summary list (WCAG 3.3.1)
  const errorItems = useMemo(() => {
    const items = [];
    if (errors.panNumber) {
      items.push({ id: 'panNumber', message: `${t('sellerOnboarding.verification.fields.panRepresentative')}: ${errors.panNumber.message}` });
    }
    if (errors.businessPan) {
      items.push({ id: 'businessPan', message: `${t('sellerOnboarding.verification.fields.businessPan')}: ${errors.businessPan.message}` });
    }
    if (errors.aadhar) {
      items.push({ id: 'aadhar', message: `${t('sellerOnboarding.verification.fields.aadhar')}: ${errors.aadhar.message}` });
    }
    if (errors.gstin) {
      items.push({ id: 'gstin', message: `${t('sellerOnboarding.verification.fields.gstin')}: ${errors.gstin.message}` });
    }
    return items;
  }, [errors, t]);

  return (
    <fieldset
      disabled={isSubmitting}
      className="m-0 space-y-8 border-0 p-0 animate-in fade-in duration-300"
      data-testid="business-verification-form"
    >
      <legend className="sr-only">{t('sellerOnboarding.verification.title')}</legend>

      {/* Screen Reader status announcements (WCAG 4.1.3) */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {isPanNumberVerifying && 'Verifying Representative PAN...'}
        {isPanNumberVerified && 'Representative PAN verified successfully.'}
        {isBusinessPanVerifying && 'Verifying Business PAN...'}
        {isBusinessPanVerified && 'Business PAN verified successfully.'}
        {isAadharVerifying && 'Verifying Aadhaar...'}
        {isAadharVerified && 'Aadhaar verified successfully.'}
        {isGstinVerifying && 'Verifying GSTIN...'}
        {isGstinVerified && 'GSTIN verified successfully.'}
      </div>

      {/* Form-level Error Summary Region (WCAG 3.3.1 Error Identification) */}
      {errorItems.length > 0 && (
        <div
          role="alert"
          aria-live="assertive"
          className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm space-y-2 animate-in fade-in"
          data-testid="verification-error-summary"
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

      {/* Tax Section */}
      <section aria-labelledby={taxSectionId} className="space-y-4">
        <SectionHeader
          id={taxSectionId}
          iconName="FileText"
          title={t('sellerOnboarding.verification.sections.tax')}
        />
        <div className="grid gap-6 md:grid-cols-2">
          <PanInput
            id="panNumber"
            label={t('sellerOnboarding.verification.fields.panRepresentative')}
            error={errors.panNumber}
            disabled={isSubmitting}
            verified={isPanNumberVerified}
            verifying={isPanNumberVerifying}
            data-testid="pan-number-input"
            onChange={handlePanNumberChange}
            onPaste={handlePanNumberPaste}
            {...panRegister}
          />
          <PanInput
            id="businessPan"
            label={t('sellerOnboarding.verification.fields.businessPan')}
            error={errors.businessPan}
            disabled={isSubmitting}
            verified={isBusinessPanVerified}
            verifying={isBusinessPanVerifying}
            data-testid="business-pan-input"
            onChange={handleBusinessPanChange}
            onPaste={handleBusinessPanPaste}
            {...bizPanRegister}
          />
        </div>
      </section>

      {/* Identity & GST Section */}
      <section aria-labelledby={identitySectionId} className="space-y-4">
        <SectionHeader
          id={identitySectionId}
          iconName="User"
          title={t('sellerOnboarding.verification.sections.identity')}
        />
        <div className="grid gap-6 md:grid-cols-2">
          <AadhaarInput
            id="aadhar"
            label={t('sellerOnboarding.verification.fields.aadhar')}
            error={errors.aadhar}
            disabled={isSubmitting}
            verified={isAadharVerified}
            verifying={isAadharVerifying}
            data-testid="aadhar-input"
            onChange={handleAadharChange}
            onPaste={handleAadharPaste}
            {...aadharRegister}
          />
          <GstinInput
            id="gstin"
            label={t('sellerOnboarding.verification.fields.gstin')}
            error={errors.gstin}
            required={false}
            disabled={isSubmitting}
            verified={isGstinVerified}
            verifying={isGstinVerifying}
            data-testid="gstin-input"
            onChange={handleGstinChange}
            onPaste={handleGstinPaste}
            {...gstinRegister}
          />
        </div>
      </section>
    </fieldset>
  );
});

BusinessVerificationForm.displayName = 'BusinessVerificationForm';
