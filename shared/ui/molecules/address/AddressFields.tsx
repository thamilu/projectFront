'use client';

import { useLocations } from '@/features/locations/hooks/use-locations';
import { MapPin } from 'lucide-react';
import { useFormContext } from 'react-hook-form';

import type { AddressFieldsProps } from './address.types';
import { AddressLineFields } from './components/AddressLineFields';
import { CountryField } from './components/CountryField';
import { HierarchyFields } from './components/HierarchyFields';
import { PincodeCityFields } from './components/PincodeCityFields';
import { useFieldNames } from './hooks/useFieldNames';
import { usePincodeAutofill } from './hooks/usePincodeAutofill';

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Enterprise-grade address form field group.
 *
 * Orchestrates:
 * - `useFieldNames`       → prefix-aware field name resolution
 * - `useLocations`        → location data fetching + pincode lookup
 * - `usePincodeAutofill`  → auto-fill side effects
 *
 * Composes four focused sub-components:
 * - `AddressLineFields`   → Address Line 1 + 2
 * - `PincodeCityFields`   → Pincode search + City/Locality
 * - `HierarchyFields`     → Taluk → District → State
 * - `CountryField`        → Country select with cascading clear
 *
 * @example
 * ```tsx
 * <FormProvider {...methods}>
 *   <AddressFields namePrefix="store" title="Store Address" />
 * </FormProvider>
 * ```
 */
export function AddressFields({
  namePrefix = '',
  title = 'Residential Address',
  description = 'Your primary permanent location for billing and shipping.',
  showTitle = false,
  disabled = false,
  readOnly = false,
}: AddressFieldsProps) {
  const {
    formState: { errors },
    watch,
    setValue,
  } = useFormContext();
  const fieldNames = useFieldNames(namePrefix);

  // ── Watch all address field values ────────────────────────────────────────
  const stateValue = watch(fieldNames.state);
  const districtValue = watch(fieldNames.district);
  const talukValue = watch(fieldNames.taluk);
  const pincodeValue = watch(fieldNames.pincode);
  const countryValue = watch(fieldNames.country);
  const cityValue = watch(fieldNames.city);

  // ── Location data ─────────────────────────────────────────────────────────
  const locations = useLocations(countryValue, stateValue, districtValue, talukValue, pincodeValue);

  // ── Pincode autofill side effects ─────────────────────────────────────────
  usePincodeAutofill({
    fieldNames,
    watchedValues: {
      pincode: pincodeValue,
      state: stateValue,
      district: districtValue,
      taluk: talukValue,
      city: cityValue,
    },
    pincodeData: locations.pincodeData,
    localityOptions: locations.localityOptions,
    isValidPincode: locations.isValidPincode,
    isIndia: locations.isIndia,
    setValue,
  });

  // ── Type-safe error accessor (no `as any`) ────────────────────────────────
  const getError = (name: string): string | undefined => {
    const fieldError = (errors as Record<string, { message?: string } | undefined>)?.[name];
    return fieldError?.message;
  };

  return (
    <div className="space-y-4">
      {showTitle && (
        <div className="mb-2 space-y-1">
          <div className="flex items-center gap-3">
            <MapPin className="text-primary h-4 w-4" />
            <h3 className="text-sm font-bold tracking-wider uppercase">{title}</h3>
          </div>
          {description && <p className="text-muted-foreground ml-7 text-xs">{description}</p>}
        </div>
      )}

      <div className="grid gap-3">
        <AddressLineFields
          fieldNames={fieldNames}
          getError={getError}
          disabled={disabled}
          readOnly={readOnly}
        />

        <PincodeCityFields
          fieldNames={fieldNames}
          getError={getError}
          setValue={setValue}
          disabled={disabled || readOnly}
          readOnly={readOnly}
          pincodeValue={pincodeValue}
          cityValue={cityValue}
          isValidPincode={locations.isValidPincode}
          hasLocalities={locations.hasLocalities}
          localityOptions={locations.localityOptions}
          searchedPincodeOptions={locations.searchedPincodeOptions}
          isLoadingPincodeData={locations.isLoadingPincodeData}
          isLoadingPincodeSearch={locations.isLoadingPincodeSearch}
        />

        <HierarchyFields
          fieldNames={fieldNames}
          getError={getError}
          setValue={setValue}
          disabled={disabled || readOnly}
          isIndia={locations.isIndia}
          stateValue={stateValue}
          districtValue={districtValue}
          talukValue={talukValue}
          stateOptions={locations.stateOptions}
          districtOptions={locations.districtOptions}
          talukOptions={locations.talukOptions}
          isLoadingStates={locations.isLoadingStates}
          isLoadingDistricts={locations.isLoadingDistricts}
          isLoadingTaluks={locations.isLoadingTaluks}
        />

        <CountryField
          fieldNames={fieldNames}
          getError={getError}
          setValue={setValue}
          disabled={disabled || readOnly}
          countryValue={countryValue}
          countryOptions={locations.countryOptions}
        />
      </div>
    </div>
  );
}
