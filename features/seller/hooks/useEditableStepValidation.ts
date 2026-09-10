'use client';

import { useState, useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import type { SellerOnboardingValues } from '@/domains/seller/contracts/seller.schema';

interface UseEditableStepValidationOptions {
  /** Whether the step is currently in edit mode */
  isEditing: boolean;
  /** State setter for edit mode */
  setIsEditing: (editing: boolean) => void;
  /** Field names to validate when locking */
  fieldNames: ReadonlyArray<keyof SellerOnboardingValues | string>;
  /** Optional callback when validation fails */
  onValidationError?: (error: unknown) => void;
}

interface UseEditableStepValidationReturn {
  /** Whether validation is in progress */
  isValidating: boolean;
  /** Whether edit mode has been toggled at least once (for aria-live timing) */
  hasToggled: boolean;
  /** Handler for edit toggle button */
  handleToggleEdit: () => Promise<void>;
  /** Whether the validation/save was completed successfully */
  isSaved: boolean;
  /** Save/validation error details */
  saveError: string | null;
}

/**
 * Shared hook for editable form steps with validation on lock.
 *
 * Encapsulates the common pattern of:
 * 1. Toggle to edit mode → enable fields
 * 2. Toggle to lock mode → validate fields first
 * 3. Only lock if validation passes
 * 4. Track toggle state for accessibility announcements
 *
 * @example
 * ```tsx
 * const { isValidating, hasToggled, handleToggleEdit, isSaved, saveError } = useEditableStepValidation({
 *   isEditing,
 *   setIsEditing,
 *   fieldNames: PERSONAL_INFO_FIELDS,
 * });
 * ```
 */
export function useEditableStepValidation({
  isEditing,
  setIsEditing,
  fieldNames,
  onValidationError,
}: UseEditableStepValidationOptions): UseEditableStepValidationReturn {
  const [isValidating, setIsValidating] = useState(false);
  const [hasToggled, setHasToggled] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { trigger } = useFormContext<SellerOnboardingValues>();

  const handleToggleEdit = useCallback(async () => {
    setHasToggled(true);

    // Entering edit mode — no validation needed
    if (!isEditing) {
      try {
        setIsSaved(false);
        setSaveError(null);
        setIsEditing(true);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        setSaveError(`Toggle to edit mode failed: ${msg}`);
        console.error('[useEditableStepValidation] Toggle to edit mode failed:', error);
        onValidationError?.(error);
      }
      return;
    }

    // Exiting edit mode — validate first
    setIsSaved(false);
    setSaveError(null);
    setIsValidating(true);

    try {
      const isValid = await trigger(fieldNames as unknown as Parameters<typeof trigger>[0]);

      if (isValid) {
        setIsSaved(true);
        setIsEditing(false);
      } else {
        setSaveError('Validation failed. Please check the fields below.');
      }
      // If invalid: stay in editing mode, errors shown inline via form state
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      setSaveError(`Validation failed: ${msg}`);
      console.error('[useEditableStepValidation] Validation failed:', error);
      onValidationError?.(error);
    } finally {
      setIsValidating(false);
    }
  }, [isEditing, setIsEditing, trigger, fieldNames, onValidationError]);

  return {
    isValidating,
    hasToggled,
    handleToggleEdit,
    isSaved,
    saveError,
  };
}
