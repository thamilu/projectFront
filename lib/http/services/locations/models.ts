/**
 * Location Domain Models (Frontend specific)
 */

export interface State {
  id: number;
  name: string;
  code: string;
}

export interface District {
  id: number;
  name: string;
  stateId?: number;
}

export interface Taluk {
  id: number;
  name: string;
  districtId?: number;
}

export interface Pincode {
  id: number;
  code: string;
  districtId?: number;
  taluk?: string;
  officeName?: string;
}

export interface Locality {
  locality: string;
  postOffice: string;
}

export interface LocationDetail {
  pincode: string;
  country: string;
  countryCode: string;
  state: string;
  stateCode: string;
  district: string;
  taluk?: string;
  localities: Locality[];
}

export interface Country {
  id: number;
  name: string;
  code: string; // Unified with DTO isoCode
}
