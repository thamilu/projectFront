import { ShopDTO } from '@/domains/seller/contracts/seller.types';

export interface CategoryDTO {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  active: boolean;
  parentCategory?: CategoryDTO;
  children?: CategoryDTO[];
  createdAt: string;
}

export interface BrandDTO {
  id: number;
  name: string;
  description?: string;
  logoUrl?: string;
  active: boolean;
  createdAt: string;
}

export interface TagDTO {
  id: number;
  name: string;
  createdAt: string;
}

export interface ProductDTO {
  id: number;
  name: string;
  description: string;
  sku: string;
  price: number;
  discountPrice?: number;
  stockQuantity: number;
  imageUrl?: string;
  active: boolean;
  featured: boolean;
  category: CategoryDTO;
  brand?: BrandDTO;
  shop: ShopDTO;
  tags?: TagDTO[];
  createdAt: string;
  updatedAt?: string;
}

export interface ProductFilters {
  categoryId?: number;
  brandId?: number;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  featured?: boolean;
  search?: string;
}

/**
 * Backend API format for product creation
 */
export interface BackendProductRequest {
  name: string;
  description?: string;
  sku: string;
  friendlyUrl?: string;
  price: number;
  discountPrice?: number;
  stockQuantity: number;
  imageUrl?: string;
  categoryId: number;
  subCategory?: string;
  brandId?: number;
  storeId?: number;
  tags?: string[];
  featured?: boolean;
}

export interface CategoryAttributes {
  type?: string;
  brand?: string;
  size?: string;
  availableSizes?: string[];
  color?: string;
  availableColors?: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}
