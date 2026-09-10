'use client';

/**
 * ProfileStep
 *
 * Step to confirm and review personal profile details and permanent address.
 *
 * Features:
 * - Localized support with useI18n
 * - Fully accessible label-field associations and live announcements
 * - Form subscriptions using useWatch to prevent stale states
 * - Standardized design system step inputs and layouts
 * - Animation conforming to user's reduced-motion preferences
 * - Telemetry analytics and validation error instrumentation
 */

import { memo, useEffect } from 'react';
import type { ReactElement } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { motion, useReducedMotion } from 'framer-motion';
import { useI18n } from '@/core/i18n';
import { trackEvent } from '@/core/providers/analytics-provider';

import { StepLayout } from '@/shared/ui/organisms/StepLayout';
import { StepInput } from '@/shared/ui/molecules/StepInput';
import { FormFieldGroup } from '@/shared/ui/molecules/FormFieldGroup';
import { AddressFields } from '@/shared/ui/molecules/AddressFields';

import type { SellerOnboardingValues } from '@/domains/seller/contracts/seller.schema';
import { getFieldStateClass } from '@/features/seller/utils/form-field-styles';
import { PERSONAL_INFO_FIELD_CONFIG } from '@/features/seller/config/personal-info.config';

// ─── Constants ────────────────────────────────────────────────────────────────

const READONLY_FIELD_CLASS = getFieldStateClass(false);
const EDITABLE_FIELD_CLASS = getFieldStateClass(true);

// ─── Main Component ───────────────────────────────────────────────────────────

export const ProfileStep = memo(function ProfileStep(): ReactElement {
  const { t } = useI18n();
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<SellerOnboardingValues>();

  const shouldReduceMotion = useReducedMotion();

  // Subscribe to form fields using useWatch for real-time reactivity without any unsafe casts
  const firstName = useWatch({ control, name: 'firstName' });
  const lastName = useWatch({ control, name: 'lastName' });
  const email = useWatch({ control, name: 'email' });

  // ── 1. Analytics & Telemetry ───────────────────────────────────────────────
  useEffect(() => {
    trackEvent('seller_onboarding_step_viewed', {
      step: 'profile',
      step_number: 1.5,
    });
  }, []);

  // Track validation failures for telemetry error analysis
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      trackEvent('seller_onboarding_profile_validation_error', {
        fields: Object.keys(errors),
      });
    }
  }, [errors]);

  // ── 2. Accessibility Live Announcement for errors ──────────────────────────
  const errorKeys = Object.keys(errors);
  const errorAnnouncement = errorKeys.length > 0
    ? t('sellerOnboarding.personalInfo.saveError', {
        defaultValue: `The form has ${errorKeys.length} validation error(s). Please review the fields.`,
      })
    : '';

  // ── 3. Animation Variants ──────────────────────────────────────────────────
  const containerVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 10 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: shouldReduceMotion ? 0 : -10 },
  };

  return (
    <StepLayout
      title={t('sellerOnboarding.profile.title')}
      description={t('sellerOnboarding.profile.description')}
      data-testid="profile-step"
    >
      {/* Screen Reader error announcement region */}
      <div
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        data-testid="profile-sr-announcement"
      >
        {errorAnnouncement || '\u00A0'}
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="space-y-6"
      >
        <div
          role="group"
          aria-label={t('sellerOnboarding.personalInfo.title')}
          className="space-y-6"
          data-testid="profile-form"
        >
          {/* Personal Information Fields Group */}
          <FormFieldGroup label={t('sellerOnboarding.personalInfo.title')}>
            <div className="grid gap-6 sm:grid-cols-2">
              <StepInput
                id="firstName"
                label={t('sellerOnboarding.personalInfo.fields.firstName')}
                icon={PERSONAL_INFO_FIELD_CONFIG.firstName.icon}
                autoComplete={PERSONAL_INFO_FIELD_CONFIG.firstName.autoComplete}
                value={firstName || ''}
                readOnly
                placeholder={t('sellerOnboarding.profile.placeholders.notProvided')}
                className={READONLY_FIELD_CLASS}
                data-testid="profile-first-name"
              />
              <StepInput
                id="lastName"
                label={t('sellerOnboarding.personalInfo.fields.lastName')}
                icon={PERSONAL_INFO_FIELD_CONFIG.lastName.icon}
                autoComplete={PERSONAL_INFO_FIELD_CONFIG.lastName.autoComplete}
                value={lastName || ''}
                readOnly
                placeholder={t('sellerOnboarding.profile.placeholders.notProvided')}
                className={READONLY_FIELD_CLASS}
                data-testid="profile-last-name"
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <StepInput
                id="email"
                label={t('sellerOnboarding.personalInfo.fields.email')}
                type="email"
                icon={PERSONAL_INFO_FIELD_CONFIG.email.icon}
                autoComplete={PERSONAL_INFO_FIELD_CONFIG.email.autoComplete}
                value={email || ''}
                readOnly
                verified={true}
                hint={t('sellerOnboarding.profile.emailLockedHint')}
                placeholder={t('sellerOnboarding.profile.placeholders.notProvided')}
                className={READONLY_FIELD_CLASS}
                data-testid="profile-email"
              />
              <StepInput
                id="phone"
                label={t('sellerOnboarding.personalInfo.fields.phone')}
                type="tel"
                icon={PERSONAL_INFO_FIELD_CONFIG.phone.icon}
                autoComplete={PERSONAL_INFO_FIELD_CONFIG.phone.autoComplete}
                placeholder="+91 98765 43210"
                {...register('phone')}
                error={errors.phone?.message}
                className={EDITABLE_FIELD_CLASS}
                data-testid="profile-phone"
              />
            </div>
          </FormFieldGroup>

          {/* Address Fields Group */}
          <div className="pt-2">
            <FormFieldGroup label={t('sellerOnboarding.permanentAddress.title')}>
              <AddressFields data-testid="profile-address-fields" />
            </FormFieldGroup>
          </div>
        </div>
      </motion.div>
    </StepLayout>
  );
});

ProfileStep.displayName = 'ProfileStep';
