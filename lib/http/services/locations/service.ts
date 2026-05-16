import axios from 'axios';
import { locationApi } from './api';
import { locationMapper } from './mapper';
import * as DTOs from './dto';
import * as Models from './models';
import { RequestOptions } from '../../types';
import { z } from 'zod';

/**
 * Location Service Layer (Business Logic + Validation + Orchestration)
 * [ENTERPRISE] Validates at boundary and maps to domain models.
 */
export const locationService = {
  getCountries: async (options: RequestOptions = {}): Promise<Models.Country[]> => {
    const rawData = await locationApi.getCountries(options);
    const validated = DTOs.CountryDTOSchema.array().parse(rawData);
    return validated.map(locationMapper.toCountry);
  },

  getStates: async (options: RequestOptions = {}): Promise<Models.State[]> => {
    const rawData = await locationApi.getStates(options);
    const validated = DTOs.StateDTOSchema.array().parse(rawData);
    return validated.map(locationMapper.toState);
  },

  getDistricts: async (stateId: string, options: RequestOptions = {}): Promise<Models.District[]> => {
    const rawData = await locationApi.getDistricts(stateId, options);
    const validated = DTOs.DistrictDTOSchema.array().parse(rawData);
    return validated.map(locationMapper.toDistrict);
  },

  getTaluks: async (districtId: string, options: RequestOptions = {}): Promise<Models.Taluk[]> => {
    const rawData = await locationApi.getTaluks(districtId, options);
    const validated = DTOs.TalukDTOSchema.array().parse(rawData);
    return validated.map(locationMapper.toTaluk);
  },

  getPincodes: async (districtId: string, options: RequestOptions = {}): Promise<Models.Pincode[]> => {
    const rawData = await locationApi.getPincodesByDistrict(districtId, options);
    const validated = DTOs.PincodeDTOSchema.array().parse(rawData);
    return validated.map(locationMapper.toPincode);
  },

  getPincodesByTaluk: async (talukId: string, options: RequestOptions = {}): Promise<Models.Pincode[]> => {
    const rawData = await locationApi.getPincodesByTaluk(talukId, options);
    const validated = DTOs.PincodeDTOSchema.array().parse(rawData);
    return validated.map(locationMapper.toPincode);
  },

  getByPinCode: async (code: string, options: RequestOptions = {}): Promise<Models.LocationDetail | null> => {
    try {
      const rawData = await locationApi.getByPinCode(code, options);
      const validated = DTOs.LocationResponseSchema.parse(rawData);
      return locationMapper.toLocationDetail(validated);
    } catch (error) {
      // Ignore canceled requests (standard React Query/SWR behavior)
      if (axios.isCancel(error)) {
        return null;
      }
      
      console.error('[LocationService] Pincode lookup failed:', error);
      return null;
    }
  },

  searchPincodes: async (query: string, options: RequestOptions = {}): Promise<string[]> => {
    const rawData = await locationApi.searchPincodes(query, options);
    // Assuming search returns array of strings (pincode codes)
    return z.array(z.string()).parse(rawData);
  },
};
