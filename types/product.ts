/**
 * Type definitions for product-related entities
 */

export interface Category {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  active: boolean;
  parentCategory?: Category | null;
  parent_id?: number | null;
  children?: Category[];
  createdAt: string;
}

export interface Brand {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  logoUrl?: string;
}

/**
 * Backend API format for product creation (aligned with ProductCreateRequest.java)
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
  tags?: string[]; // Backend expects Set<String>, JSON treats this as list
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
