'use client';

import { useFormContext } from 'react-hook-form';

import { FormField } from './FormField';
import type { AddressFieldNames, GetErrorFn } from '../address.types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AddressLineFieldsProps {
  /** Resolved field names (prefixed). */
  fieldNames: AddressFieldNames;
  /** Error accessor function. */
  getError: GetErrorFn;
  /** Whether all fields are disabled. */
  disabled: boolean;
  /** Whether all fields are read-only. */
  readOnly?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Renders Address Line 1 and Address Line 2 fields.
 *
 * Uses `FormField` to maintain DRY rendering.
 * Accesses `register` from `useFormContext` to avoid prop drilling.
 */
export function AddressLineFields({
  fieldNames,
  getError,
  disabled,
  readOnly = false,
}: AddressLineFieldsProps) {
  const { register } = useFormContext();

  return (
    <div className="space-y-3">
      <FormField
        fieldId={fieldNames.addressLine1}
        label="Address Line 1"
        registration={register(fieldNames.addressLine1)}
        getError={getError}
        placeholder="Street address, Apartment, etc."
        disabled={disabled}
        readOnly={readOnly}
        // Genuinely required in the schema (min 5 chars, no .optional()),
        // unlike Address Line 2 below.
        required
      />

      <FormField
        fieldId={fieldNames.addressLine2}
        label="Address Line 2 (Optional)"
        registration={register(fieldNames.addressLine2)}
        getError={getError}
        placeholder="Landmark, Floor, etc."
        disabled={disabled}
        readOnly={readOnly}
      />
    </div>
  );
}
