import { useEffect, useRef } from 'react';

import type { AddressFieldNames, SetValueFn } from '../address.types';
import type { ComboboxOption } from '@/shared/ui/atoms/combobox';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PincodeAutofillDeps {
  /** Resolved field names (prefixed). */
  fieldNames: AddressFieldNames;
  /** Current form values for watched fields. */
  watchedValues: {
    pincode: string | undefined;
    state: string | undefined;
    district: string | undefined;
    taluk: string | undefined;
    city: string | undefined;
  };
  /** Pincode detail data returned from the API. */
  pincodeData:
    | {
        state?: string;
        district?: string;
        taluk?: string;
      }
    | null
    | undefined;
  /** Locality options derived from pincode lookup. */
  localityOptions: ComboboxOption[];
  /** Whether the current pincode is a valid format AND has resolved data. */
  isValidPincode: boolean;
  /** Whether the selected country is India. */
  isIndia: boolean;
  /** react-hook-form's setValue. */
  setValue: SetValueFn;
}

// ─── Internal Helpers ─────────────────────────────────────────────────────────

/** Standard options for setValue to mark fields as dirty + validated. */
const SET_OPTIONS = { shouldDirty: true, shouldValidate: true } as const;

/**
 * Conditionally sets a form field only if the current value differs from the target.
 * Prevents unnecessary re-renders and avoids setValue loops.
 */
function setIfChanged(
  setValue: SetValueFn,
  fieldName: string,
  targetValue: string,
  currentValue: string | undefined
): void {
  if (currentValue !== targetValue) {
    setValue(fieldName, targetValue, SET_OPTIONS);
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Manages pincode-first auto-fill side effects.
 *
 * When a valid pincode is entered:
 * - Auto-fills state, district, taluk from pincode lookup data.
 * - Auto-fills city/locality if there is exactly one option.
 *
 * When the pincode is cleared:
 * - Clears all dependent fields (state, district, taluk, city).
 *
 * Uses a `prevPincodeRef` to distinguish "user cleared pincode" from
 * "pincode was already empty on mount".
 */
export function usePincodeAutofill({
  fieldNames,
  watchedValues,
  pincodeData,
  localityOptions,
  isValidPincode,
  isIndia,
  setValue,
}: PincodeAutofillDeps): void {
  const prevPincodeRef = useRef<string | undefined>(watchedValues.pincode);

  useEffect(() => {
    const prevPincode = prevPincodeRef.current;
    prevPincodeRef.current = watchedValues.pincode;

    // ── Auto-fill from valid pincode data ─────────────────────────────────
    if (isValidPincode && pincodeData?.state) {
      setIfChanged(setValue, fieldNames.state, pincodeData.state, watchedValues.state);
      setIfChanged(
        setValue,
        fieldNames.district,
        pincodeData.district ?? '',
        watchedValues.district
      );

      if (pincodeData.taluk) {
        setIfChanged(setValue, fieldNames.taluk, pincodeData.taluk, watchedValues.taluk);
      }

      // Auto-fill locality when there is exactly one unique option
      if (localityOptions.length === 1 && watchedValues.city !== localityOptions[0].value) {
        setValue(fieldNames.city, localityOptions[0].value as string, SET_OPTIONS);
      }

      return;
    }

    // ── Clear dependent fields when pincode is manually cleared ───────────
    if (isIndia && (!watchedValues.pincode || watchedValues.pincode.trim() === '')) {
      const wasPreviouslySet = prevPincode && prevPincode.trim() !== '';
      const hasDependentValues =
        watchedValues.state || watchedValues.district || watchedValues.taluk || watchedValues.city;

      if (wasPreviouslySet && hasDependentValues) {
        const fieldsToClear = [
          fieldNames.state,
          fieldNames.district,
          fieldNames.taluk,
          fieldNames.city,
        ];

        for (const field of fieldsToClear) {
          setValue(field, '', SET_OPTIONS);
        }
      }
    }
  }, [
    pincodeData,
    localityOptions,
    isValidPincode,
    isIndia,
    watchedValues.pincode,
    watchedValues.state,
    watchedValues.district,
    watchedValues.taluk,
    watchedValues.city,
    setValue,
    fieldNames,
  ]);
}
