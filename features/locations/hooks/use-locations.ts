import { useMemo } from 'react';
import { useDebounce } from '@/shared/hooks';
import {
  useStatesQuery,
  useDistrictsQuery,
  useTaluksQuery,
  usePincodesQuery,
  usePincodeDetailQuery,
  usePincodeSearchQuery,
  useCountriesQuery,
} from '../queries';

/**
 * useLocations Hook [ENTERPRISE]
 *
 * Provides a hybrid approach to location selection:
 * 1. Pincode-first auto-fill (primary).
 * 2. Step-by-step master data selection (secondary/manual).
 * 3. Uses formalized query layer for enterprise-grade fetching.
 */
export function useLocations(
  countryValue?: string,
  stateValue?: string,
  districtValue?: string,
  talukValue?: string,
  pincodeValue?: string
) {
  const isIndia = countryValue === 'India' || !countryValue;
  const isValidPincodeFormat = Boolean(
    isIndia && pincodeValue?.length === 6 && /^\d+$/.test(pincodeValue)
  );

  // 1. Pincode Lookup (Primary)
  const { data: pincodeData, isLoading: isLoadingPincodeData } = usePincodeDetailQuery(
    pincodeValue,
    isValidPincodeFormat
  );

  const debouncedPincodeValue = useDebounce(pincodeValue, 300);

  // 2. Pincode Search (Autocomplete)
  const { data: apiSearchedPincodes, isLoading: isLoadingPincodeSearch } = usePincodeSearchQuery(
    debouncedPincodeValue,
    !!debouncedPincodeValue &&
      debouncedPincodeValue.length >= 1 &&
      debouncedPincodeValue.length <= 6
  );

  const searchedPincodeOptions = useMemo(() => {
    if (!apiSearchedPincodes) return [];
    return apiSearchedPincodes.map((p) => ({ label: p, value: p }));
  }, [apiSearchedPincodes]);

  // 3. Countries
  const { data: apiCountries, isLoading: isLoadingCountries } = useCountriesQuery();

  const countryOptions = useMemo(() => {
    return apiCountries?.map((c) => ({ label: c.name, value: c.name })) || [];
  }, [apiCountries]);

  // 4. States
  const { data: apiStates, isLoading: isLoadingStates } = useStatesQuery(isIndia);

  const stateOptions = useMemo(() => {
    if (!isIndia) return [];
    if (isValidPincodeFormat && pincodeData?.state) {
      return [{ label: pincodeData.state, value: pincodeData.state }];
    }
    return apiStates?.map((s) => ({ label: s.name, value: s.name })) || [];
  }, [isIndia, apiStates, pincodeData, isValidPincodeFormat]);

  const selectedStateId = useMemo(() => {
    if (!stateValue || !apiStates) return undefined;
    return apiStates.find((s) => s.name === stateValue)?.id;
  }, [stateValue, apiStates]);

  // 5. Districts
  const { data: apiDistricts, isLoading: isLoadingDistricts } = useDistrictsQuery(selectedStateId);

  const districtOptions = useMemo(() => {
    if (!isIndia || !stateValue) return [];
    if (isValidPincodeFormat && pincodeData?.district) {
      return [{ label: pincodeData.district, value: pincodeData.district }];
    }
    const combined = Array.from(new Set(apiDistricts?.map((d) => d.name) || []));
    return combined.map((d) => ({ label: d, value: d }));
  }, [isIndia, stateValue, apiDistricts, pincodeData, isValidPincodeFormat]);

  const selectedDistrictId = useMemo(() => {
    if (!districtValue || !apiDistricts) return undefined;
    return apiDistricts.find((d) => d.name === districtValue)?.id;
  }, [districtValue, apiDistricts]);

  // 6. Taluks
  const { data: apiTaluks, isLoading: isLoadingTaluks } = useTaluksQuery(selectedDistrictId);

  const talukOptions = useMemo(() => {
    if (!isIndia || !districtValue) return [];
    if (isValidPincodeFormat && pincodeData?.taluk) {
      return [{ label: pincodeData.taluk, value: pincodeData.taluk }];
    }
    const combined = Array.from(new Set(apiTaluks?.map((t) => t.name) || []));
    return combined.map((t) => ({ label: t, value: t }));
  }, [isIndia, districtValue, apiTaluks, pincodeData, isValidPincodeFormat]);

  const selectedTalukId = useMemo(() => {
    if (!talukValue || !apiTaluks) return undefined;
    return apiTaluks.find((t) => t.name === talukValue)?.id;
  }, [talukValue, apiTaluks]);

  // 7. Pincodes (List for manual selection if needed)
  const { data: apiPincodes, isLoading: isLoadingPincodes } = usePincodesQuery(
    selectedTalukId ? 'taluk' : 'district',
    selectedTalukId || selectedDistrictId
  );

  const pincodeOptions = useMemo(() => {
    if (!isIndia || !districtValue || !apiPincodes) return [];
    const combined = Array.from(new Set(apiPincodes.map((p) => p.code)));
    return combined.map((p) => ({ label: p, value: p }));
  }, [isIndia, districtValue, apiPincodes]);

  // 8. Localities (from pincode lookup)
  const localityOptions = useMemo(() => {
    if (isValidPincodeFormat && pincodeData?.localities) {
      const combined = Array.from(new Set(pincodeData.localities.map((l) => l.locality)));
      return combined.map((l) => ({ label: l, value: l }));
    }
    return [];
  }, [isValidPincodeFormat, pincodeData]);

  return {
    stateOptions,
    districtOptions,
    talukOptions,
    pincodeOptions,
    localityOptions,
    countryOptions,
    pincodeData,
    searchedPincodeOptions,
    isIndia,
    isValidPincode: isValidPincodeFormat,
    isLoadingCountries,
    isLoadingStates,
    isLoadingDistricts,
    isLoadingTaluks,
    isLoadingPincodes,
    isLoadingPincodeData,
    isLoadingPincodeSearch,
    isLoading:
      isLoadingCountries ||
      isLoadingStates ||
      isLoadingDistricts ||
      isLoadingTaluks ||
      isLoadingPincodes ||
      isLoadingPincodeData ||
      isLoadingPincodeSearch,
    hasStates: stateOptions.length > 0,
    hasDistricts: districtOptions.length > 0,
    hasTaluks: talukOptions.length > 0,
    hasPincodes: pincodeOptions.length > 0,
    hasLocalities: localityOptions.length > 0,
  };
}
