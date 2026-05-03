import { useMemo } from 'react';
import { states, districtsByState, pincodesByDistrict, countries } from '@/constants/locations';

export function useLocations(countryValue?: string, stateValue?: string, districtValue?: string) {
  const isIndia = countryValue === 'India';

  const stateOptions = useMemo(() => {
    if (!isIndia) return [];
    return states.map(s => ({ label: s, value: s }));
  }, [isIndia]);

  const availableDistricts = useMemo(() => {
    if (!isIndia || !stateValue) return [];
    return districtsByState[stateValue] || [];
  }, [isIndia, stateValue]);

  const districtOptions = useMemo(() => 
    availableDistricts.map(d => ({ label: d, value: d })), 
  [availableDistricts]);

  const availablePincodes = useMemo(() => {
    if (!isIndia || !districtValue) return [];
    return pincodesByDistrict[districtValue] || [];
  }, [isIndia, districtValue]);

  const pincodeOptions = useMemo(() => 
    availablePincodes.map(p => ({ label: p, value: p })), 
  [availablePincodes]);

  const countryOptions = useMemo(() => countries, []);

  return {
    stateOptions,
    districtOptions,
    pincodeOptions,
    countryOptions,
    isIndia,
    hasStates: stateOptions.length > 0,
    hasDistricts: availableDistricts.length > 0,
    hasPincodes: availablePincodes.length > 0,
  };
}
