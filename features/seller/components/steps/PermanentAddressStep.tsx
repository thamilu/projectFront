'use client';

/**
 * PermanentAddressStep - Step 2 of seller onboarding.
 *
 * Collects and validates the seller's permanent residential address
 * for KYC and identity verification purposes.
 *
 * Features:
 * - Pre-filled from session data when available
 * - Read-only by default with edit mode toggle
 * - Validates all address fields before locking
 * - Accessible with screen reader announcements for state changes
 * - Explicit TypeScript interface and FC typing
 * - Save confirmation and inline error messages
 * - Accessibility: focus management, readOnly on locked fields, aria-busy validation state
 * - Unsaved changes prompt (beforeunload)
 * - Initial loading skeleton state to prevent layout shift (CLS)
 * - Keyboard shortcuts (Alt+E to toggle editing, Escape to cancel)
 * - Analytics instrumentation (views, toggles, saves, validation failures)
 */

import { memo, useState, useEffect, useRef, useCallback } from 'react';
import type { ReactElement } from 'react';
import { useI18n } from '@/core/i18n';
import { cn } from '@/shared/utils';
import { Icon } from '@/shared/ui/atoms';
import { trackEvent } from '@/core/providers/analytics-provider';

import { AddressFields } from '@/shared/ui/molecules/AddressFields';
import { StepLayout } from '@/shared/ui/organisms/StepLayout';
import { EditToggleButton } from '@/features/seller/components/shared/EditToggleButton';
import { useEditableStepValidation } from '@/features/seller/hooks/useEditableStepValidation';
import { PERMANENT_ADDRESS_FIELDS } from '@/features/seller/config/permanent-address.config';

// ─── Component Props ──────────────────────────────────────────────────────────

export interface PermanentAddressStepProps {
  /** Optional callback when step completed successfully */
  onStepComplete?: () => void;
}

// ─── Loading Skeleton ────────────────────────────────────────────────────────

const AddressFieldsSkeleton = () => (
  <div className="space-y-4 animate-pulse" data-testid="permanent-address-skeleton">
    <div className="grid gap-3">
      {/* Address line fields */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-1/5" />
          <div className="h-10 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-1/5" />
          <div className="h-10 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl" />
        </div>
      </div>
      {/* Pincode & City */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
          <div className="h-10 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
          <div className="h-10 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl" />
        </div>
      </div>
      {/* Hierarchy Fields */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
          <div className="h-10 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
          <div className="h-10 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl" />
        </div>
      </div>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const PermanentAddressStep = memo<PermanentAddressStepProps>(
  function PermanentAddressStep({ onStepComplete }: PermanentAddressStepProps): ReactElement {
    const { t } = useI18n();

    // Local UI state
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const editToggleRef = useRef<HTMLButtonElement>(null);

    const { isValidating, hasToggled, handleToggleEdit, isSaved, saveError } =
      useEditableStepValidation({
        isEditing,
        setIsEditing,
        fieldNames: PERMANENT_ADDRESS_FIELDS,
      });

    // ── 1. Initial hydration skeleton timer to prevent CLS ───────────────────
    useEffect(() => {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 150);
      return () => clearTimeout(timer);
    }, []);

    // ── 2. Analytics Funnel Events ───────────────────────────────────────────
    useEffect(() => {
      trackEvent('seller_onboarding_step_viewed', {
        step: 'permanent_address',
        step_number: 2,
      });
    }, []);

    const handleToggleWithTracking = useCallback(async () => {
      trackEvent('seller_onboarding_address_toggle', {
        action: isEditing ? 'lock_attempted' : 'edit_started',
      });
      await handleToggleEdit();
    }, [isEditing, handleToggleEdit]);

    useEffect(() => {
      if (isSaved) {
        trackEvent('seller_onboarding_address_saved', {
          step: 'permanent_address',
        });
        onStepComplete?.();
      }
    }, [isSaved, onStepComplete]);

    useEffect(() => {
      if (saveError) {
        trackEvent('seller_onboarding_address_save_error', {
          error: saveError,
        });
      }
    }, [saveError]);

    // ── 3. Unsaved changes beforeunload prevention ───────────────────────────
    useEffect(() => {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        if (isEditing) {
          e.preventDefault();
          e.returnValue = 'You have unsaved changes. Leave anyway?';
          return e.returnValue;
        }
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isEditing]);

    // ── 4. Accessibility focus management ────────────────────────────────────
    useEffect(() => {
      if (isEditing) {
        // Move focus to the first editable input in the address form
        const firstField = document.getElementById('addressLine1');
        firstField?.focus();
      } else if (hasToggled) {
        // Return focus to the toggle button after locking
        editToggleRef.current?.focus();
      }
    }, [isEditing, hasToggled]);

    // ── 5. Keyboard shortcuts (Alt+E: toggle, Escape: cancel) ────────────────
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.altKey && e.key.toLowerCase() === 'e') {
          e.preventDefault();
          handleToggleWithTracking();
        }
        if (e.key === 'Escape' && isEditing) {
          e.preventDefault();
          setIsEditing(false);
          trackEvent('seller_onboarding_address_edit_cancelled');
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isEditing, handleToggleWithTracking, setIsEditing]);

    // ── 6. Derived announcement string ───────────────────────────────────────
    const srAnnouncement = hasToggled
      ? isEditing
        ? t('sellerOnboarding.permanentAddress.ariaEditing')
        : t('sellerOnboarding.permanentAddress.ariaLocked')
      : '';

    if (isLoading) {
      return (
        <StepLayout
          title={t('sellerOnboarding.permanentAddress.title')}
          description={t('sellerOnboarding.permanentAddress.description')}
          data-testid="permanent-address-step-loading"
        >
          <AddressFieldsSkeleton />
        </StepLayout>
      );
    }

    return (
      <StepLayout
        title={t('sellerOnboarding.permanentAddress.title')}
        description={t('sellerOnboarding.permanentAddress.description')}
        data-testid="permanent-address-step"
      >
        {/* ── Screen Reader Announcement ─────────────────────────────────────── */}
        <div
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
          data-testid="permanent-address-sr-announcement"
        >
          {srAnnouncement || '\u00A0'}
        </div>

        {/* ── Form Content ───────────────────────────────────────────────────── */}
        <div
          role="group"
          aria-label={t('sellerOnboarding.permanentAddress.title')}
          aria-busy={isValidating}
          className={cn(
            'space-y-6 transition-opacity duration-200',
            isValidating && 'pointer-events-none opacity-60'
          )}
          data-testid="permanent-address-form"
        >
          {/* Edit Toggle & Status Block */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border/40 pb-4">
            <div className="flex items-center gap-2">
              {isSaved && !isEditing && (
                <div
                  role="status"
                  className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1.5"
                  data-testid="permanent-address-save-success"
                >
                  <Icon name="Check" className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>
                    {t('sellerOnboarding.permanentAddress.savedConfirmation', {
                      defaultValue: 'Address saved successfully.',
                    })}
                  </span>
                </div>
              )}
              {saveError && (
                <div
                  role="alert"
                  className="text-destructive text-xs font-semibold flex items-center gap-1.5"
                  data-testid="permanent-address-save-error"
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
                editLabel={t('sellerOnboarding.permanentAddress.editLabel')}
                lockLabel={t('sellerOnboarding.permanentAddress.lockLabel')}
                className="w-full sm:w-auto"
                data-testid="permanent-address-edit-toggle"
              />
            </div>
          </div>

          {/* Address Form Fields */}
          <AddressFields
            readOnly={!isEditing}
            disabled={isValidating}
            data-testid="permanent-address-fields"
          />
        </div>
      </StepLayout>
    );
  }
);

PermanentAddressStep.displayName = 'PermanentAddressStep';
