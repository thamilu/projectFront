'use client';

import { Globe } from 'lucide-react';

import type { ComboboxOption } from '@/shared/ui/atoms/combobox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/atoms/select';
import { ADDRESS_STYLES } from '../address.types';
import type { AddressFieldNames, GetErrorFn, SetValueFn } from '../address.types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CountryFieldProps {
  /** Resolved field names (prefixed). */
  fieldNames: AddressFieldNames;
  /** Error accessor function. */
  getError: GetErrorFn;
  /** react-hook-form's setValue. */
  setValue: SetValueFn;
  /** Whether the field is disabled. */
  disabled: boolean;
  /** Current country value from watch. */
  countryValue: string | undefined;
  /** Available country options. */
  countryOptions: ComboboxOption[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SET_OPTIONS = { shouldDirty: true, shouldValidate: true } as const;

/**
 * Fields to clear when the country changes.
 * Order does not matter — all are cleared in one batch.
 */
const DEPENDENT_FIELDS = ['state', 'district', 'taluk', 'pincode'] as const;

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Renders the Country select dropdown.
 *
 * On country change, cascading clears:
 * state, district, taluk, pincode.
 */
export function CountryField({
  fieldNames,
  getError,
  setValue,
  disabled,
  countryValue,
  countryOptions,
}: CountryFieldProps) {
  const countryError = getError(fieldNames.country);

  const handleCountryChange = (val: string) => {
    setValue(fieldNames.country, val, SET_OPTIONS);

    for (const field of DEPENDENT_FIELDS) {
      setValue(fieldNames[field], '', SET_OPTIONS);
    }
  };

  return (
    <div className={`${ADDRESS_STYLES.fieldGroup} max-w-sm`}>
      <label htmlFor={fieldNames.country} className={ADDRESS_STYLES.label}>
        Country
      </label>
      <Select
        value={countryValue || 'India'}
        onValueChange={handleCountryChange}
        disabled={disabled}
      >
        <SelectTrigger className="bg-background/50 border-muted-foreground/20 h-10 pl-9 shadow-sm">
          <Globe className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
          <SelectValue placeholder="Select Country" />
        </SelectTrigger>
        <SelectContent>
          {countryOptions.map((c) => (
            <SelectItem key={String(c.value)} value={String(c.value)}>
              {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {countryError && (
        <p className={ADDRESS_STYLES.error} role="alert">
          {countryError}
        </p>
      )}
    </div>
  );
}
