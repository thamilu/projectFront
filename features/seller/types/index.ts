import { 
  SellerIdentityType, 
  SellerBusinessType,
  SELLER_BUSINESS_TYPE_LABELS
} from '@/types';

export { SellerIdentityType, SellerBusinessType, SELLER_BUSINESS_TYPE_LABELS };

export enum SellerStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
}

export interface SellerProfile {
  id: string;
  userId: string;
  identityType: SellerIdentityType;
  shopName: string;
  displayName?: string; // Legacy support
  shopHandle?: string;
  shopLogoUrl?: string;
  businessName?: string;
  businessTypes: SellerBusinessType[];
  description?: string;
  status: SellerStatus;
  createdAt: string;
  updatedAt: string;
  email?: string;
  
  // New Dual Address System
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  district?: string;
  taluk?: string;
  state?: string;
  pincode?: string;
  country?: string;
  
  // Store specific address (if different)
  storeAddressLine1?: string;
  storeAddressLine2?: string;
  storeCity?: string;
  storeDistrict?: string;
  storeTaluk?: string;
  storeState?: string;
  storePincode?: string;
  storeCountry?: string;
  
  googleMapsUrl?: string;
  businessMobileNumber?: string;
  
  // Nested structures for modular backend
  kyc?: {
    idType: string;
    idNumber: string;
    verified: boolean;
    panNumber?: string;
    aadhar?: string;
    gstin?: string;
  };
  bankAccountNumber?: string; // Quick access for profile view
  documents?: Array<{
    id: string;
    type: string;
    url: string;
    status: string;
  }>;
  bankAccounts?: Array<{
    id: string;
    accountNumber: string;
    bankName: string;
    ifscCode: string;
    isPrimary: boolean;
  }>;
}

export interface SellerRegisterRequest {
  identityType: SellerIdentityType;
  shopName: string;
  businessName?: string;
  businessTypes: SellerBusinessType[];
  description?: string;
  
  // Personal / Permanent Address
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  district?: string;
  taluk?: string;
  state?: string;
  pincode?: string;
  country?: string;
  
  // Store / Warehouse Address
  storeAddressLine1?: string;
  storeAddressLine2?: string;
  storeCity?: string;
  storeDistrict?: string;
  storeTaluk?: string;
  storeState?: string;
  storePincode?: string;
  storeCountry?: string;
  
  googleMapsUrl?: string;
  phone?: string;          // Personal phone
  businessPhone?: string;  // Customer support phone
}

export type SellerOnboardingRequest = SellerRegisterRequest;

export interface SellerOnboardingResponse {
  success: boolean;
  message: string;
  seller: SellerProfile;
}

export interface Store {
  id: string;
  storeName: string;
  shopHandle?: string;
  description: string;
  email?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  district?: string;
  taluk?: string;
  state?: string;
  pincode?: string;
  country?: string;
  address?: string;
  logoUrl?: string;
  googleMapsUrl?: string;
  isVerified?: boolean;
  rating?: number;
  totalRatings?: number;
}

export interface StoreCreateRequest extends Omit<Store, 'id' | 'rating' | 'totalRatings' | 'isVerified'> {}

export interface StoreUpdateRequest extends Partial<StoreCreateRequest> {
  id?: string;
}
