import * as DTOs from './dto';
import * as Models from './models';

/**
 * Location Mapper Layer (DTO -> Domain Model)
 */
export const locationMapper = {
  toState: (dto: DTOs.StateDTO): Models.State => ({
    id: dto.id,
    name: dto.name,
    code: dto.stateCode,
  }),

  toDistrict: (dto: DTOs.DistrictDTO): Models.District => ({
    id: dto.id,
    name: dto.name,
    stateId: dto.stateId,
  }),

  toTaluk: (dto: DTOs.TalukDTO): Models.Taluk => ({
    id: dto.id,
    name: dto.name,
    districtId: dto.districtId,
  }),

  toPincode: (dto: DTOs.PincodeDTO): Models.Pincode => ({
    id: dto.id,
    code: dto.code,
    districtId: dto.districtId,
    taluk: dto.taluk,
    officeName: dto.officeName,
  }),

  toLocationDetail: (dto: DTOs.LocationResponseDTO): Models.LocationDetail => ({
    pincode: dto.pincode,
    country: dto.country ?? '',
    countryCode: dto.countryCode ?? '',
    state: dto.state ?? '',
    stateCode: dto.stateCode ?? '',
    district: dto.district ?? '',
    taluk: dto.taluk ?? '',
    localities: dto.localities.map(l => ({
      locality: l.locality,
      postOffice: l.postOffice,
    })),
  }),

  toCountry: (dto: DTOs.CountryDTO): Models.Country => ({
    id: dto.id,
    name: dto.name,
    code: dto.isoCode,
  }),
};
