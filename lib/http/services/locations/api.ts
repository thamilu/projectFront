import { httpClient as apiClient } from '../index';
import { LOCATION_ENDPOINTS } from './endpoints';
import { RequestOptions } from '../../types';

/**
 * Location API Transport Layer (Raw HTTP)
 */
export const locationApi = {
  getCountries: async (options: RequestOptions = {}) => {
    const { data } = await apiClient.get(LOCATION_ENDPOINTS.COUNTRIES, {
      signal: options.signal,
    });
    return data.data;
  },

  getStates: async (options: RequestOptions = {}) => {
    const { data } = await apiClient.get(LOCATION_ENDPOINTS.STATES, {
      signal: options.signal,
    });
    return data.data;
  },

  getDistricts: async (stateId: string, options: RequestOptions = {}) => {
    const { data } = await apiClient.get(LOCATION_ENDPOINTS.DISTRICTS(stateId), {
      signal: options.signal,
    });
    return data.data;
  },

  getTaluks: async (districtId: string, options: RequestOptions = {}) => {
    const { data } = await apiClient.get(LOCATION_ENDPOINTS.TALUKS(districtId), {
      signal: options.signal,
    });
    return data.data;
  },

  getPincodesByDistrict: async (districtId: string, options: RequestOptions = {}) => {
    const { data } = await apiClient.get(LOCATION_ENDPOINTS.PINCODES_BY_DISTRICT(districtId), {
      signal: options.signal,
    });
    return data.data;
  },

  getPincodesByTaluk: async (talukId: string, options: RequestOptions = {}) => {
    const { data } = await apiClient.get(LOCATION_ENDPOINTS.PINCODES_BY_TALUK(talukId), {
      signal: options.signal,
    });
    return data.data;
  },

  getByPinCode: async (code: string, options: RequestOptions = {}) => {
    const { data } = await apiClient.get(LOCATION_ENDPOINTS.GET_BY_PINCODE(code), {
      signal: options.signal,
    });
    return data.data;  // Fixed unwrapping
  },

  searchPincodes: async (query: string, options: RequestOptions = {}) => {
    const { data } = await apiClient.get(LOCATION_ENDPOINTS.SEARCH_PINCODE(query), {
      signal: options.signal,
    });
    return data.data;
  },
};
