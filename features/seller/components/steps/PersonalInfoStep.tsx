'use client';

/**
 * PersonalInfoStep
 *
 * Step 1 of seller onboarding — collects personal identity and contact details.
 *
 * Features:
 * - Read-only by default (pre-filled from session)
 * - Toggle to edit mode with validation on lock
 * - Full error display on all fields
 * - Accessible: aria-live announcements
 * - Memoized for performance
 * - Ref forwarding, focus tracking on success/failure
 * - Keyboard shortcuts (Alt+E to toggle, Escape to cancel)
 * - Analytics/observability hooks
 */

import { memo, useState, useEffect, useRef, useCallback } from 'react';
import type { ReactElement } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { useI18n } from '@/core/i18n';
import { cn } from '@/shared/utils';
import { Icon } from '@/shared/ui/atoms';
import { trackEvent } from '@/core/providers/analytics-provider';

import { StepLayout } from '@/shared/ui/organisms/StepLayout';
import { StepInput } from '@/shared/ui/molecules/StepInput';
import { SelectField } from '@/shared/ui/molecules/SelectField';
import { DatePickerField } from '@/shared/ui/molecules/DatePickerField';
import { FormFieldGroup } from '@/shared/ui/molecules/FormFieldGroup';
import { EditToggleButton } from '@/features/seller/components/shared/EditToggleButton';

import type { SellerOnboardingValues } from '@/domains/seller/contracts/seller.schema';
import { useSellerFormUI } from '@/features/seller/hooks/useSellerFormUI';
import { useEditableStepValidation } from '@/features/seller/hooks/useEditableStepValidation';
import { getFieldStateClass } from '@/features/seller/utils/form-field-styles';
import {
  GENDER_OPTIONS,
  LANGUAGE_OPTIONS,
  PERSONAL_INFO_EDITABLE_FIELDS,
  PERSONAL_INFO_FIELD_CONFIG,
} from '@/features/seller/config/personal-info.config';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Email field is always locked — precompute the class at module scope */
const EMAIL_LOCKED_CLASS = getFieldStateClass(false);

// ─── Component Props ──────────────────────────────────────────────────────────

export interface PersonalInfoStepProps {
  /** Optional callback when step completed successfully */
  onStepComplete?: () => void;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const PersonalInfoStep = memo<PersonalInfoStepProps>(
  function PersonalInfoStep({ onStepComplete }: PersonalInfoStepProps): ReactElement {
    const { t } = useI18n();

    const {
      register,
      control,
      formState: { errors },
    } = useFormContext<SellerOnboardingValues>();

    // Localize UI edit state to prevent global re-render cascades
    const [isEditing, setIsEditing] = useState(false);
    const { mobileVerified } = useSellerFormUI();

    const editToggleRef = useRef<HTMLButtonElement>(null);

    const { isValidating, hasToggled, handleToggleEdit, isSaved, saveError } = useEditableStepValidation({
      isEditing,
      setIsEditing,
      fieldNames: PERSONAL_INFO_EDITABLE_FIELDS,
    });

    // ── Derived values ──────────────────────────────────────────────────────────
    const fieldClass = getFieldStateClass(isEditing);

    // ── 1. Analytics Instrumentation ─────────────────────────────────────────
    useEffect(() => {
      trackEvent('seller_onboarding_step_viewed', {
        step: 'personal_info',
        step_number: 1,
      });
    }, []);

    const handleToggleWithTracking = useCallback(async () => {
      trackEvent('seller_onboarding_personal_info_toggle', {
        action: isEditing ? 'lock_attempted' : 'edit_started',
      });
      await handleToggleEdit();
    }, [isEditing, handleToggleEdit]);

    useEffect(() => {
      if (isSaved) {
        trackEvent('seller_onboarding_personal_info_saved', {
          step: 'personal_info',
        });
        onStepComplete?.();
      }
    }, [isSaved, onStepComplete]);

    useEffect(() => {
      if (saveError) {
        trackEvent('seller_onboarding_personal_info_save_error', {
          error: saveError,
        });
      }
    }, [saveError]);

    // ── 2. Accessibility Focus Management ────────────────────────────────────
    useEffect(() => {
      if (isEditing) {
        // Focus first editable input when edit mode starts
        const firstField = document.getElementById('firstName');
        firstField?.focus();
      } else if (hasToggled && !saveError) {
        // Return focus to toggle button when locking successfully
        editToggleRef.current?.focus();
      }
    }, [isEditing, hasToggled, saveError]);

    useEffect(() => {
      if (saveError) {
        // Find and focus the first invalid field when validation fails
        const firstInvalidField = PERSONAL_INFO_EDITABLE_FIELDS.find(
          (field) => errors[field]
        );
        if (firstInvalidField) {
          const el = document.getElementById(firstInvalidField);
          el?.focus();
        }
      }
    }, [saveError, errors]);

    // ── 3. Keyboard Shortcuts (Alt+E: toggle, Escape: cancel) ────────────────
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.altKey && e.key.toLowerCase() === 'e') {
          e.preventDefault();
          handleToggleWithTracking();
        }
        if (e.key === 'Escape' && isEditing) {
          e.preventDefault();
          setIsEditing(false);
          trackEvent('seller_onboarding_personal_info_edit_cancelled');
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isEditing, handleToggleWithTracking, setIsEditing]);

    // ── 4. Screen Reader Live Regions ────────────────────────────────────────
    const srAnnouncement = hasToggled
      ? isEditing
        ? t('sellerOnboarding.personalInfo.ariaEditing')
        : t('sellerOnboarding.personalInfo.ariaLocked')
      : '';

    // ── Render ──────────────────────────────────────────────────────────────────
    return (
      <StepLayout
        title={t('sellerOnboarding.personalInfo.title')}
        description={t('sellerOnboarding.personalInfo.description')}
        data-testid="personal-info-step"
      >
        {/* Visually hidden live region for screen readers */}
        <div
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
          data-testid="personal-info-sr-announcement"
        >
          {srAnnouncement || '\u00A0'}
        </div>

        <div
          role="group"
          aria-label={t('sellerOnboarding.personalInfo.title')}
          aria-busy={isValidating}
          className={cn(
            'space-y-6 transition-opacity duration-200',
            isValidating && 'pointer-events-none opacity-60'
          )}
          data-testid="personal-info-form"
        >
          {/* Edit Toggle & Status Alerts */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border/40 pb-4">
            <div className="flex items-center gap-2">
              {isSaved && !isEditing && (
                <div
                  role="status"
                  className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1.5"
                  data-testid="personal-info-save-success"
                >
                  <Icon name="Check" className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>
                    {t('sellerOnboarding.personalInfo.savedConfirmation', {
                      defaultValue: 'Personal information saved successfully.',
                    })}
                  </span>
                </div>
              )}
              {saveError && (
                <div
                  role="alert"
                  className="text-destructive text-xs font-semibold flex items-center gap-1.5"
                  data-testid="personal-info-save-error"
                >
                  <Icon name="AlertCircle" className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{saveError}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end self-end sm:self-auto">
              <EditToggleButton
                ref={editToggleRef}
                isEditing={isEditing}
                onToggle={handleToggleWithTracking}
                isValidating={isValidating}
                editLabel={t('sellerOnboarding.personalInfo.editLabel')}
                lockLabel={t('sellerOnboarding.personalInfo.lockLabel')}
                className="w-full sm:w-auto"
                data-testid="personal-info-edit-toggle"
              />
            </div>
          </div>

          <div className="grid gap-6">
            {/* Name Group */}
            <FormFieldGroup label={t('sellerOnboarding.personalInfo.groups.name')}>
              <StepInput
                id="firstName"
                label={t('sellerOnboarding.personalInfo.fields.firstName')}
                icon={PERSONAL_INFO_FIELD_CONFIG.firstName.icon}
                autoComplete={PERSONAL_INFO_FIELD_CONFIG.firstName.autoComplete}
                {...register('firstName')}
                readOnly={!isEditing}
                error={errors.firstName?.message}
                className={fieldClass}
              />
              <StepInput
                id="lastName"
                label={t('sellerOnboarding.personalInfo.fields.lastName')}
                icon={PERSONAL_INFO_FIELD_CONFIG.lastName.icon}
                autoComplete={PERSONAL_INFO_FIELD_CONFIG.lastName.autoComplete}
                {...register('lastName')}
                readOnly={!isEditing}
                error={errors.lastName?.message}
                className={fieldClass}
              />
            </FormFieldGroup>

            {/* Contact Group */}
            <FormFieldGroup label={t('sellerOnboarding.personalInfo.groups.contact')}>
              <StepInput
                id="email"
                label={t('sellerOnboarding.personalInfo.fields.email')}
                type="email"
                icon={PERSONAL_INFO_FIELD_CONFIG.email.icon}
                autoComplete={PERSONAL_INFO_FIELD_CONFIG.email.autoComplete}
                {...register('email')}
                readOnly
                verified={true}
                error={errors.email?.message}
                hint={t('sellerOnboarding.personalInfo.emailLockedHint')}
                className={EMAIL_LOCKED_CLASS}
              />
              <StepInput
                id="phone"
                label={t('sellerOnboarding.personalInfo.fields.phone')}
                type="tel"
                icon={PERSONAL_INFO_FIELD_CONFIG.phone.icon}
                autoComplete={PERSONAL_INFO_FIELD_CONFIG.phone.autoComplete}
                placeholder="+91 98765 43210"
                {...register('phone')}
                readOnly={!isEditing}
                verified={mobileVerified}
                error={errors.phone?.message}
                className={fieldClass}
              />
            </FormFieldGroup>

            {/* Demographic Group */}
            <FormFieldGroup label={t('sellerOnboarding.personalInfo.groups.demographics')}>
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <SelectField
                    id="gender"
                    label={t('sellerOnboarding.personalInfo.fields.gender')}
                    options={GENDER_OPTIONS}
                    value={field.value}
                    onChange={field.onChange}
                    disabled={!isEditing}
                    error={errors.gender?.message}
                    className={fieldClass}
                  />
                )}
              />

              <Controller
                name="dateOfBirth"
                control={control}
                render={({ field }) => (
                  <DatePickerField
                    id="dateOfBirth"
                    label={t('sellerOnboarding.personalInfo.fields.dateOfBirth')}
                    value={field.value}
                    onChange={field.onChange}
                    disabled={!isEditing}
                    variant="dob"
                    minAge={18}
                    error={errors.dateOfBirth?.message}
                    className={fieldClass}
                  />
                )}
              />
            </FormFieldGroup>

            {/* Preferences Group */}
            <FormFieldGroup label={t('sellerOnboarding.personalInfo.groups.preferences')}>
              <StepInput
                id="alternatePhone"
                label={t('sellerOnboarding.personalInfo.fields.alternatePhone')}
                type="tel"
                icon={PERSONAL_INFO_FIELD_CONFIG.alternatePhone.icon}
                autoComplete={PERSONAL_INFO_FIELD_CONFIG.alternatePhone.autoComplete}
                {...register('alternatePhone')}
                readOnly={!isEditing}
                error={errors.alternatePhone?.message}
                className={fieldClass}
              />

              <Controller
                name="preferredLanguage"
                control={control}
                render={({ field }) => (
                  <SelectField
                    id="preferredLanguage"
                    label={t('sellerOnboarding.personalInfo.fields.preferredLanguage')}
                    options={LANGUAGE_OPTIONS}
                    value={field.value}
                    onChange={field.onChange}
                    disabled={!isEditing}
                    error={errors.preferredLanguage?.message}
                    className={fieldClass}
                  />
                )}
              />
            </FormFieldGroup>
          </div>
        </div>
      </StepLayout>
    );
  }
);

PersonalInfoStep.displayName = 'PersonalInfoStep';
