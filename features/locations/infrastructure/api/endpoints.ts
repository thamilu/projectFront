/**
 * Location Domain Endpoints
 * Centralized for scalability.
 */
export const LOCATION_ENDPOINTS = {
  COUNTRIES: '/api/v1/locations/countries',
  STATES: '/api/v1/locations/states',
  DISTRICTS: (stateId: string) => `/api/v1/locations/districts?stateId=${stateId}`,
  TALUKS: (districtId: string) => `/api/v1/locations/taluks?districtId=${districtId}`,
  PINCODES_BY_DISTRICT: (districtId: string) =>
    `/api/v1/locations/pincodes?districtId=${districtId}`,
  PINCODES_BY_TALUK: (talukId: string) => `/api/v1/locations/pincodes?talukId=${talukId}`,
  GET_BY_PINCODE: (code: string) => `/api/v1/locations/pincode/${code}`,
  SEARCH_PINCODE: (query: string) => `/api/v1/locations/pincode/search?query=${query}`,
} as const;
