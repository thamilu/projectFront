import { UserDTO } from '@/domains/auth/contracts/auth.types';

export enum SellerIdentityType {
  INDIVIDUAL = 'INDIVIDUAL',
  BUSINESS = 'BUSINESS',
}

export enum SellerBusinessType {
  FARMER = 'FARMER',
  WHOLESALER = 'WHOLESALER',
  RETAILER = 'RETAILER',
}

export const SELLER_BUSINESS_TYPE_LABELS: Record<SellerBusinessType, string> = {
  [SellerBusinessType.FARMER]: 'Farmer / Producer',
  [SellerBusinessType.WHOLESALER]: 'Wholesaler',
  [SellerBusinessType.RETAILER]: 'Retailer',
};

export interface ShopDTO {
  id: number;
  shopName: string;
  description: string;
  logoUrl?: string;
  email?: string;
  phone?: string;
  address?: string;
  active: boolean;
  seller?: UserDTO;
  createdAt: string;
}

export interface StoreDTO {
  id: number;
  storeName: string;
  description: string;
  logoUrl?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  taluk?: string;
  district?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  domain?: string;
  rating?: number;
  active: boolean;
  seller: UserDTO;
  sellerId?: number;
  sellerUsername?: string;
  createdAt: string;
  updatedAt?: string;
}
