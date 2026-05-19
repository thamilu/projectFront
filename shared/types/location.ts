/**
 * Location Types
 * [HARDEN] Centralized types for geographic data used across API and Hooks.
 */

export interface State {
  id: string;
  name: string;
  code: string;
}

export interface District {
  id: string;
  name: string;
  stateId: string;
}

export interface Pincode {
  id: string;
  code: string;
  districtId: string;
  taluk?: string;
  officeName?: string;
}

export interface Taluk {
  id: string;
  name: string;
  districtId: string;
}

export interface LocationResponse {
  pincode: string;
  country: string;
  countryCode: string;
  state: string;
  stateCode: string;
  district: string;
  taluk?: string;
  localities: {
    locality: string;
    postOffice: string;
  }[];
}

export interface CountryDTO {
  id: number;
  name: string;
  isoCode: string;
}

// Kept for backward compatibility if needed in dropdowns
export interface Country {
  label: string;
  value: string;
}
