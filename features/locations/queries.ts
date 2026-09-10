import { useQuery } from '@tanstack/react-query';
import { locationService } from './infrastructure/api';

/**
 * Location Query Keys Factory [ENTERPRISE]
 */
export const locationKeys = {
  all: ['locations'] as const,
  countries: () => [...locationKeys.all, 'countries'] as const,
  states: () => [...locationKeys.all, 'states'] as const,
  districts: (stateId: number | string) =>
    [...locationKeys.all, 'districts', String(stateId)] as const,
  taluks: (districtId: number | string) =>
    [...locationKeys.all, 'taluks', String(districtId)] as const,
  pincodes: (parentType: 'district' | 'taluk', parentId: number | string) =>
    [...locationKeys.all, 'pincodes', parentType, String(parentId)] as const,
  pincodeDetail: (code: string) => [...locationKeys.all, 'pincode', 'detail', code] as const,
  pincodeSearch: (query: string) => [...locationKeys.all, 'pincode', 'search', query] as const,
};

/**
 * Location Queries with Enterprise Policies
 */

export const useCountriesQuery = () => {
  return useQuery({
    queryKey: locationKeys.countries(),
    queryFn: ({ signal }) => locationService.getCountries({ signal }),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    retry: 2,
  });
};

export const useStatesQuery = (enabled = true) => {
  return useQuery({
    queryKey: locationKeys.states(),
    queryFn: ({ signal }) => locationService.getStates({ signal }),
    enabled,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    retry: 2,
  });
};

export const useDistrictsQuery = (stateId?: number | string) => {
  return useQuery({
    queryKey: locationKeys.districts(stateId!),
    queryFn: ({ signal }) => locationService.getDistricts(String(stateId!), { signal }),
    enabled: !!stateId,
    staleTime: 1000 * 60 * 60, // 1 hour
    retry: 2,
  });
};

export const useTaluksQuery = (districtId?: number | string) => {
  return useQuery({
    queryKey: locationKeys.taluks(districtId!),
    queryFn: ({ signal }) => locationService.getTaluks(String(districtId!), { signal }),
    enabled: !!districtId,
    staleTime: 1000 * 60 * 60, // 1 hour
    retry: 2,
  });
};

export const usePincodesQuery = (parentType: 'district' | 'taluk', parentId?: number | string) => {
  return useQuery({
    queryKey: locationKeys.pincodes(parentType, parentId!),
    queryFn: ({ signal }) =>
      parentType === 'taluk'
        ? locationService.getPincodesByTaluk(String(parentId!), { signal })
        : locationService.getPincodes(String(parentId!), { signal }),
    enabled: !!parentId,
    staleTime: 1000 * 60 * 60, // 1 hour
    retry: 2,
  });
};

export const usePincodeDetailQuery = (pincode?: string, enabled = true) => {
  return useQuery({
    queryKey: locationKeys.pincodeDetail(pincode!),
    queryFn: ({ signal }) => locationService.getByPinCode(pincode!, { signal }),
    enabled: enabled && !!pincode && pincode.length === 6,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours (Pincodes are static)
    retry: 1,
  });
};

export const usePincodeSearchQuery = (query?: string, enabled = true) => {
  return useQuery({
    queryKey: locationKeys.pincodeSearch(query!),
    queryFn: ({ signal }) => locationService.searchPincodes(query!, { signal }),
    enabled: enabled && !!query && query.length >= 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 0, // No retry for autocomplete
  });
};
