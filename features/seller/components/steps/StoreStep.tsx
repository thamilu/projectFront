'use client';

/**
 * StoreStep
 *
 * Step 5 of seller onboarding — defines shop display configuration, handle, description, and location.
 *
 * Features:
 * - Localized using useI18n
 * - Fully type safe Form bindings without as any casting
 * - Live screen reader validation error announcer (polite and actionable)
 * - Analytics step views and error telemetry (safeguarded and aliased)
 * - Error boundary to prevent render crashes
 * - Focus management on mount and on validation errors
 */

import { memo, useEffect, useMemo, useRef } from 'react';
import type { ReactElement } from 'react';
import { useFormContext } from 'react-hook-form';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { useI18n } from '@/core/i18n';
import { trackEvent } from '@/core/providers/analytics-provider';
import { StoreDetailsFields } from '@/features/seller/components/StoreDetailsFields';
import type { StoreStepFormValues } from '@/features/seller/components/StoreDetailsFields';
import { BankDetailsFields } from './BankDetailsFields';
import type { SellerOnboardingValues } from '@/domains/seller/contracts/seller.schema';
import { StepLayout } from '@/shared/ui/organisms/StepLayout';
import { ErrorBoundary } from '@/shared/ui/error-boundary';
import { StepErrorFallback } from '@/shared/ui/molecules/StepErrorFallback';

// ─── Constants & Configurations ──────────────────────────────────────────────

const STORE_STEP_FIELDS = [
  'shopName',
  'businessPhone',
  'shopHandle',
  'shopLogoUrl',
  'description',
  'storeAddressLine1',
  'storeAddressLine2',
  'storeCity',
  'storeDistrict',
  'storeTaluk',
  'storeState',
  'storePincode',
  'storeCountry',
  'farmLocationVillage',
  'isOwnProduce',
  'googleMapsUrl',
  'bankAccountNumber',
  'bankAccountNumberConfirm',
  'bankIfsc',
] as const;

const FIELD_ANALYTICS_ALIASES: Record<string, string> = {
  shopName: 'store_name',
  businessPhone: 'business_phone',
  description: 'store_description',
  shopHandle: 'shop_handle',
  shopLogoUrl: 'shop_logo_url',
  googleMapsUrl: 'google_maps_url',
  farmLocationVillage: 'farm_location_village',
  isOwnProduce: 'is_own_produce',
};

// ─── Local Helper Hooks ──────────────────────────────────────────────────────

/**
 * Hook to build and stabilize field config objects to avoid re-renders.
 */
function useStoreFieldConfig(t: ReturnType<typeof useI18n>['t']) {
  return useMemo(() => ({
    storeName: {
      id: 'shopName' as const,
      label: t('sellerOnboarding.store.fields.storeName.label'),
      placeholder: t('sellerOnboarding.store.fields.storeName.placeholder'),
    },
    phone: {
      id: 'businessPhone' as const,
      label: t('sellerOnboarding.store.fields.phone.label'),
      placeholder: t('sellerOnboarding.store.fields.phone.placeholder'),
    },
    description: {
      id: 'description' as const,
      label: t('sellerOnboarding.store.fields.description.label'),
      placeholder: t('sellerOnboarding.store.fields.description.placeholder'),
    },
  }), [t]);
}

/**
 * Hook to manage screen tracking and validation error telemetry.
 */
function useStoreStepAnalytics(errors: FieldErrors<StoreStepFormValues>) {
  useEffect(() => {
    try {
      trackEvent('seller_onboarding_step_viewed', {
        step: 'store_setup',
        step_number: 5,
      });
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[StoreStep] Failed to track step view:', err);
      }
    }
  }, []);

  const errorFingerprint = Object.keys(errors).sort().join(',');

  useEffect(() => {
    if (!errorFingerprint) return;

    try {
      const fieldKeys = errorFingerprint.split(',');
      const aliasedFields = fieldKeys.map((key) => FIELD_ANALYTICS_ALIASES[key] ?? key);

      trackEvent('seller_onboarding_store_validation_error', {
        fields: aliasedFields,
      });
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[StoreStep] Failed to track validation error:', err);
      }
    }
  }, [errorFingerprint]);
}

// ─── Helper Functions ────────────────────────────────────────────────────────

/**
 * Builds localized, screen-reader friendly and actionable validation error description.
 */
function buildErrorAnnouncement(
  errors: FieldErrors<StoreStepFormValues>,
  t: ReturnType<typeof useI18n>['t']
): string {
  const errorKeys = Object.keys(errors) as (keyof StoreStepFormValues)[];
  if (errorKeys.length === 0) return '';

  const descriptions = errorKeys
    .map((key) => {
      const message = errors[key]?.message;
      if (!message) return '';

      let label = '';
      if (key === 'shopName') label = t('sellerOnboarding.store.fields.storeName.label');
      else if (key === 'businessPhone') label = t('sellerOnboarding.store.fields.phone.label');
      else if (key === 'description') label = t('sellerOnboarding.store.fields.description.label');
      else if (key === 'shopHandle') label = t('sellerOnboarding.store.fields.shopHandle.label');
      else if (key === 'shopLogoUrl') label = t('sellerOnboarding.store.fields.shopLogoUrl.label');
      else if (key === 'farmLocationVillage') label = t('sellerOnboarding.store.fields.farmLocationVillage.label');
      else if (key === 'isOwnProduce') label = t('sellerOnboarding.store.fields.isOwnProduce.label');
      else if (key === 'googleMapsUrl') label = t('sellerOnboarding.store.fields.googleMapsUrl.label');
      else if (key === 'bankAccountNumber') label = 'Bank Account Number';
      else if (key === 'bankAccountNumberConfirm') label = 'Confirm Bank Account Number';
      else if (key === 'bankIfsc') label = 'IFSC Code';

      const fieldLabel = label ? `${label}: ` : '';
      return `${fieldLabel}${message}`;
    })
    .filter(Boolean)
    .join('. ');

  const summary = t('sellerOnboarding.store.validationSummary', { count: errorKeys.length });
  // Handle raw key fallback in tests or locales with missing keys
  const baseSummary = summary.includes('validationSummary')
    ? `The form has ${errorKeys.length} validation error(s). Please review the fields.`
    : summary;

  return baseSummary + (descriptions ? ` ${descriptions}` : '');
}

// ─── Main Component ──────────────────────────────────────────────────────────

export const StoreStep = memo(function StoreStep(): ReactElement {
  const { t } = useI18n();
  const {
    register,
    formState: { errors, isSubmitting },
  } = useFormContext<SellerOnboardingValues>();

  // Scope validation errors for ISP compliance
  const storeErrors = errors as FieldErrors<StoreStepFormValues>;

  // ── 1. Analytics Telemetry ─────────────────────────────────────────────────
  useStoreStepAnalytics(storeErrors);

  // ── 2. Memoized Field Config ───────────────────────────────────────────────
  const fieldConfig = useStoreFieldConfig(t);

  // ── 3. Screen Reader Live Announcements ─────────────────────────────────────
  const errorKeys = Object.keys(storeErrors) as (keyof StoreStepFormValues)[];
  const errorAnnouncement = buildErrorAnnouncement(storeErrors, t);

  // ── 4. Focus Management (Mount & Validation Errors) ─────────────────────────
  const firstInputRef = useRef<boolean>(false);

  useEffect(() => {
    // Focus first input on mount for screen readers and keyboard users
    if (!firstInputRef.current) {
      firstInputRef.current = true;
      const el = document.getElementById('shopName');
      el?.focus();
    }
  }, []);

  useEffect(() => {
    if (errorKeys.length > 0) {
      // Find the first field in error list and focus/scroll to it
      const firstErrorField = STORE_STEP_FIELDS.find(
        (field) => storeErrors[field as keyof StoreStepFormValues]
      );
      if (firstErrorField) {
        const el = document.getElementById(firstErrorField);
        if (el) {
          el.focus();
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }, [errorKeys.length, storeErrors]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <StepLayout
      title={t('sellerOnboarding.store.title')}
      description={t('sellerOnboarding.store.description')}
      variant="plain"
      data-testid="store-step"
    >
      {/* Polite screen reader live region announcement for form validations */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        data-testid="store-sr-announcement"
      >
        {errorAnnouncement || '\u00A0'}
      </div>

      <ErrorBoundary
        fallback={
          <StepErrorFallback
            error={null}
            resetErrorBoundary={() => window.location.reload()}
          />
        }
      >
        <div data-testid="store-form">
          <StoreDetailsFields
            register={register as unknown as UseFormRegister<StoreStepFormValues>}
            errors={storeErrors}
            storeName={fieldConfig.storeName}
            phone={fieldConfig.phone}
            description={fieldConfig.description}
            disabled={isSubmitting}
          />
          <BankDetailsFields />
        </div>
      </ErrorBoundary>
    </StepLayout>
  );
});

StoreStep.displayName = 'StoreStep';
