'use client';

import { useFormContext } from 'react-hook-form';
import { Loader2 } from 'lucide-react';

import { Combobox } from '@/shared/ui/atoms/combobox';
import type { ComboboxOption } from '@/shared/ui/atoms/combobox';
import { Input } from '@/shared/ui/atoms/input';
import { Label } from '@/shared/ui/atoms/label';
import { RequiredMark } from '@/shared/ui/atoms/required-mark';
import { ADDRESS_STYLES } from '../address.types';
import type { AddressFieldNames, GetErrorFn, SetValueFn } from '../address.types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PincodeCityFieldsProps {
  /** Resolved field names (prefixed). */
  fieldNames: AddressFieldNames;
  /** Error accessor function. */
  getError: GetErrorFn;
  /** react-hook-form's setValue. */
  setValue: SetValueFn;
  /** Whether all fields are disabled. */
  disabled: boolean;
  /** Whether fields are read-only. */
  readOnly?: boolean;
  /** Current pincode value from watch. */
  pincodeValue: string | undefined;
  /** Current city value from watch. */
  cityValue: string | undefined;
  /** Whether the pincode is valid and has resolved data. */
  isValidPincode: boolean;
  /** Whether localities are available from pincode lookup. */
  hasLocalities: boolean;
  /** Locality options from pincode lookup. */
  localityOptions: ComboboxOption[];
  /** Searched pincode autocomplete options. */
  searchedPincodeOptions: ComboboxOption[];
  /** Whether pincode detail is loading. */
  isLoadingPincodeData: boolean;
  /** Whether pincode search is loading. */
  isLoadingPincodeSearch: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SET_OPTIONS = { shouldDirty: true, shouldValidate: true } as const;

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Renders Pincode (with search combobox) and City/Locality fields.
 *
 * City field conditionally renders as:
 * - A `Combobox` with locality options when a valid pincode has localities.
 * - A plain `Input` otherwise.
 */
export function PincodeCityFields({
  fieldNames,
  getError,
  setValue,
  disabled,
  readOnly = false,
  pincodeValue,
  cityValue,
  isValidPincode,
  hasLocalities,
  localityOptions,
  searchedPincodeOptions,
  isLoadingPincodeData,
  isLoadingPincodeSearch,
}: PincodeCityFieldsProps) {
  const { register } = useFormContext();

  const pincodeError = getError(fieldNames.pincode);
  const cityError = getError(fieldNames.city);

  return (
    <div className="grid gap-5 sm:gap-6 sm:grid-cols-2">
      {/* Pincode / ZIP */}
      <div className={ADDRESS_STYLES.fieldGroup}>
        <Label
          htmlFor={fieldNames.pincode}
          className={`${ADDRESS_STYLES.label} flex items-center gap-2`}
        >
          Pincode / ZIP
          <RequiredMark />
          {(isLoadingPincodeData || isLoadingPincodeSearch) && (
            <Loader2 className="text-primary h-3 w-3 animate-spin" />
          )}
        </Label>
        <Combobox
          options={searchedPincodeOptions}
          value={pincodeValue}
          onSelect={(val) => setValue(fieldNames.pincode, val as string, SET_OPTIONS)}
          disabled={disabled}
          placeholder="Enter 6-digit Pincode"
          searchPlaceholder="Type pincode..."
          allowCustomValue={true}
          className={`${ADDRESS_STYLES.input} font-mono tracking-widest`}
          onSearchChange={(val) => setValue(fieldNames.pincode, val, { shouldDirty: true })}
        />
        {pincodeError && (
          <p className={ADDRESS_STYLES.error} role="alert">
            {pincodeError}
          </p>
        )}
      </div>

      {/* City / Locality */}
      <div className={ADDRESS_STYLES.fieldGroup}>
        <Label htmlFor={fieldNames.city} className={ADDRESS_STYLES.label}>
          City / Locality
          <RequiredMark />
        </Label>
        {isValidPincode && hasLocalities ? (
          <Combobox
            options={localityOptions}
            value={cityValue}
            onSelect={(val) => setValue(fieldNames.city, val as string, SET_OPTIONS)}
            disabled={disabled}
            placeholder="Select Locality"
            searchPlaceholder="Search locality..."
            allowCustomValue={true}
            className={ADDRESS_STYLES.input}
          />
        ) : (
          <Input
            id={fieldNames.city}
            {...register(fieldNames.city)}
            placeholder="Your city"
            disabled={disabled}
            readOnly={readOnly}
            aria-required
            className={ADDRESS_STYLES.input}
          />
        )}
        {cityError && (
          <p className={ADDRESS_STYLES.error} role="alert">
            {cityError}
          </p>
        )}
      </div>
    </div>
  );
}
