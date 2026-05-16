import { z } from 'zod';

/**
 * Location API Data Transfer Objects (Boundary Validation)
 */

export const StateDTOSchema = z.object({
  id: z.number(),
  name: z.string(),
  stateCode: z.string(),
});

export const DistrictDTOSchema = z.object({
  id: z.number(),
  name: z.string(),
  stateId: z.number().optional(),
});

export const TalukDTOSchema = z.object({
  id: z.number(),
  name: z.string(),
  districtId: z.number().optional(),
});

export const PincodeDTOSchema = z.object({
  id: z.number(),
  code: z.string(),
  districtId: z.number().optional(),
  taluk: z.string().optional(),
  officeName: z.string().optional(),
});

export const LocalitySchema = z.object({
  locality: z.string(),
  postOffice: z.string(),
});

export const LocationResponseSchema = z.object({
  pincode: z.string(),
  country: z.string().nullable(),
  countryCode: z.string().nullable(),
  state: z.string().nullable(),
  stateCode: z.string().nullable(),
  district: z.string().nullable(),
  taluk: z.string().nullable().optional(),
  localities: z.array(LocalitySchema),
});

export const CountryDTOSchema = z.object({
  id: z.number(),
  name: z.string(),
  isoCode: z.string(),
});

export type StateDTO = z.infer<typeof StateDTOSchema>;
export type DistrictDTO = z.infer<typeof DistrictDTOSchema>;
export type TalukDTO = z.infer<typeof TalukDTOSchema>;
export type PincodeDTO = z.infer<typeof PincodeDTOSchema>;
export type LocationResponseDTO = z.infer<typeof LocationResponseSchema>;
export type CountryDTO = z.infer<typeof CountryDTOSchema>;
