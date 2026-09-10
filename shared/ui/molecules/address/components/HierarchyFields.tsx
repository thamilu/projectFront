'use client';

import { Combobox } from '@/shared/ui/atoms/combobox';
import type { ComboboxOption } from '@/shared/ui/atoms/combobox';
import { RequiredMark } from '@/shared/ui/atoms/required-mark';
import { ADDRESS_STYLES } from '../address.types';
import type { AddressFieldNames, GetErrorFn, SetValueFn } from '../address.types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface HierarchyFieldsProps {
  /** Resolved field names (prefixed). */
  fieldNames: AddressFieldNames;
  /** Error accessor function. */
  getError: GetErrorFn;
  /** react-hook-form's setValue. */
  setValue: SetValueFn;
  /** Whether all fields are disabled. */
  disabled: boolean;
  /** Whether the selected country is India. */
  isIndia: boolean;
  /** Current state value from watch. */
  stateValue: string | undefined;
  /** Current district value from watch. */
  districtValue: string | undefined;
  /** State dropdown options. */
  stateOptions: ComboboxOption[];
  /** District dropdown options. */
  districtOptions: ComboboxOption[];
  /** Taluk dropdown options. */
  talukOptions: ComboboxOption[];
  /** Current taluk value from watch. */
  talukValue: string | undefined;
  /** Whether states are loading. */
  isLoadingStates: boolean;
  /** Whether districts are loading. */
  isLoadingDistricts: boolean;
  /** Whether taluks are loading. */
  isLoadingTaluks: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SET_OPTIONS = { shouldDirty: true, shouldValidate: true } as const;

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Renders the Taluk → District → State hierarchy row.
 *
 * Each field cascades a clear to its dependents:
 * - Changing State → clears District + Taluk
 * - Changing District → clears Taluk
 */
export function HierarchyFields({
  fieldNames,
  getError,
  setValue,
  disabled,
  isIndia,
  stateValue,
  districtValue,
  talukValue,
  stateOptions,
  districtOptions,
  talukOptions,
  isLoadingStates,
  isLoadingDistricts,
  isLoadingTaluks,
}: HierarchyFieldsProps) {
  const stateError = getError(fieldNames.state);
  const districtError = getError(fieldNames.district);

  return (
    <div className="grid gap-5 sm:gap-6 sm:grid-cols-3">
      {/* Taluk / Tehsil */}
      <div className={ADDRESS_STYLES.fieldGroup}>
        <label htmlFor={fieldNames.taluk} className={ADDRESS_STYLES.label}>
          Taluk / Tehsil
        </label>
        <Combobox
          options={talukOptions}
          value={talukValue}
          onSelect={(val) => setValue(fieldNames.taluk, val as string, SET_OPTIONS)}
          disabled={disabled || !districtValue || !isIndia}
          loading={isLoadingTaluks}
          placeholder="Select Taluk"
          searchPlaceholder="Search taluk..."
          allowCustomValue={true}
          className={ADDRESS_STYLES.input}
        />
      </div>

      {/* District */}
      <div className={ADDRESS_STYLES.fieldGroup}>
        <label htmlFor={fieldNames.district} className={ADDRESS_STYLES.label}>
          District
          <RequiredMark />
        </label>
        <Combobox
          options={districtOptions}
          value={districtValue}
          onSelect={(val) => {
            setValue(fieldNames.district, val as string, SET_OPTIONS);
            setValue(fieldNames.taluk, '', SET_OPTIONS);
          }}
          disabled={disabled || !stateValue || !isIndia}
          loading={isLoadingDistricts}
          placeholder="Select District"
          searchPlaceholder="Search district..."
          allowCustomValue={true}
          className={ADDRESS_STYLES.input}
        />
        {districtError && (
          <p className={ADDRESS_STYLES.error} role="alert">
            {districtError}
          </p>
        )}
      </div>

      {/* State */}
      <div className={ADDRESS_STYLES.fieldGroup}>
        <label htmlFor={fieldNames.state} className={ADDRESS_STYLES.label}>
          State
          <RequiredMark />
        </label>
        <Combobox
          options={stateOptions}
          value={stateValue}
          onSelect={(val) => {
            setValue(fieldNames.state, val as string, SET_OPTIONS);
            setValue(fieldNames.district, '', SET_OPTIONS);
            setValue(fieldNames.taluk, '', SET_OPTIONS);
          }}
          disabled={disabled || !isIndia}
          loading={isLoadingStates}
          placeholder="Select State"
          searchPlaceholder="Search state..."
          className={ADDRESS_STYLES.input}
        />
        {stateError && (
          <p className={ADDRESS_STYLES.error} role="alert">
            {stateError}
          </p>
        )}
      </div>
    </div>
  );
}
