import { StoreCreateFormData } from '@/domains/seller/contracts/seller.schema';
import { SellerProfile } from '../types';

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
    currencyCode: 'INR', // Default for India Marketplace
  };
}

/**
 * Maps Store form data to the final API request format.
 */
export function storeCreateRequestFromForm(data: StoreCreateFormData) {
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
    logoUrl: data.shopLogoUrl || undefined, // FIXED: Correctly map from form key and sanitize null to undefined
    currencyCode: data.currencyCode || 'INR',
  };
}
