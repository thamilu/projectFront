import { SellerOnboardingValues, SellerProfileUpdateValues } from '../schemas';
import { SellerRegisterRequest, SellerProfile } from '../types';

/**
 * Maps onboarding form data to backend registration request.
 * Handles the dual-address split.
 */
export function mapOnboardingToRequest(data: SellerOnboardingValues): SellerRegisterRequest {
  return {
    identityType: data.identityType,
    shopName: data.shopName,
    businessName: data.businessName,
    businessTypes: data.businessTypes,
    description: data.description,
    
    // Personal Address
    addressLine1: data.addressLine1,
    addressLine2: data.addressLine2,
    city: data.city,
    district: data.district,
    state: data.state,
    pincode: data.pincode,
    country: data.country,
    
    // Store Address
    storeAddressLine1: data.storeAddressLine1,
    storeAddressLine2: data.storeAddressLine2,
    storeCity: data.storeCity,
    storeDistrict: data.storeDistrict,
    storeState: data.storeState,
    storePincode: data.storePincode,
    storeCountry: data.storeCountry,
    
    googleMapsUrl: data.googleMapsUrl,
    phone: data.phone,
    businessPhone: data.businessPhone,
  };
}

/**
 * Maps SellerProfile to form values for editing.
 */
export function mapProfileToFormValues(profile: SellerProfile): Partial<SellerProfileUpdateValues> {
  return {
    identityType: profile.identityType,
    shopName: profile.shopName,
    businessName: profile.businessName,
    businessTypes: profile.businessTypes,
    description: profile.description,
    
    // Personal Address
    addressLine1: profile.addressLine1,
    addressLine2: profile.addressLine2,
    city: profile.city,
    district: profile.district,
    state: profile.state,
    pincode: profile.pincode,
    country: profile.country,
    
    // Store Address
    storeAddressLine1: profile.storeAddressLine1,
    storeAddressLine2: profile.storeAddressLine2,
    storeCity: profile.storeCity,
    storeDistrict: profile.storeDistrict,
    storeState: profile.storeState,
    storePincode: profile.storePincode,
    storeCountry: profile.storeCountry,
    
    googleMapsUrl: profile.googleMapsUrl,
    phone: profile.businessMobileNumber, // Backend uses this field
    businessPhone: profile.businessMobileNumber,
  };
}

/**
 * Maps a SellerProfile (from registration) to a Store creation request.
 */
export function storeCreateRequestFromSellerProfile(profile: SellerProfile) {
  return {
    storeName: profile.shopName,
    description: profile.description || '',
    email: '', 
    phone: profile.businessMobileNumber || '',
    addressLine1: profile.storeAddressLine1 || '',
    addressLine2: profile.storeAddressLine2 || '',
    city: profile.storeCity || '',
    district: profile.storeDistrict || '',
    state: profile.storeState || '',
    pincode: profile.storePincode || '',
    country: profile.storeCountry || 'India',
    googleMapsUrl: profile.googleMapsUrl || '',
    logoUrl: '',
  };
}

/**
 * Maps Store form data to the final API request format.
 */
export function storeCreateRequestFromForm(data: any) {
  return {
    storeName: data.storeName,
    description: data.description,
    email: data.email,
    phone: data.phone,
    addressLine1: data.addressLine1,
    addressLine2: data.addressLine2,
    city: data.city,
    district: data.district,
    state: data.state,
    pincode: data.pincode,
    country: data.country,
    googleMapsUrl: data.googleMapsUrl,
    logoUrl: data.shopLogoUrl, // FIXED: Correctly map from form key
  };
}
