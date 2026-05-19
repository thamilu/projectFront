import { SellerIdentityType, SellerBusinessType } from '@/domains/seller/contracts/seller.types';

export enum UserRole {
  SELLER = 'SELLER',
  CUSTOMER = 'CUSTOMER',
  DELIVERY_AGENT = 'DELIVERY_AGENT',
}

export interface UserDTO {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  address?: string;
  active: boolean;
  emailVerified?: boolean;
  image?: string | null;
  createdAt: string;
  updatedAt?: string;
  // Seller-specific fields
  shopName?: string;
  businessName?: string;
  panNumber?: string;
  gstinNumber?: string;
  businessType?: string;
  // Refactored seller types
  sellerIdentityType?: SellerIdentityType;
  sellerBusinessTypes?: SellerBusinessType[];
  isOwnProduce?: boolean;
  // Delivery agent fields
  vehicleType?: string;
}

export type User = UserDTO;

export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone: string;
  address?: string;
  shopName?: string;
  businessName?: string;
  panNumber?: string;
  gstinNumber?: string;
  businessType?: string;
  sellerIdentityType?: SellerIdentityType;
  sellerBusinessTypes?: SellerBusinessType[];
  isOwnProduce?: boolean;
  vehicleType?: string;
}

export interface AuthResponse {
  token?: string;
  user?: UserDTO | null;
  type?: string;
  expiresIn?: number;
}
