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
  categoryName?: string;
  brandName?: string;
  masterProductId?: number;
  /** SEO-friendly slug used for /products/[slug] routing; falls back to id when absent */
  urlSlug?: string;

  // Detail fields returned by backend
  originalPrice?: number;
  msrp?: number;
  categoryId?: number;
  brandId?: number;
  shortDescription?: string;
  pricing?: {
    taxRate?: number;
  };
  minOrderQuantity?: number;
  maxOrderQuantity?: number;
  lowStockThreshold?: number;
  weight?: number | string;
  weightUnit?: string;
  length?: number | string;
  width?: number | string;
  height?: number | string;
  dimensionUnit?: string;
  shippingCharges?: number;
  freeShipping?: boolean;
  deliveryTime?: number;
  metaTitle?: string;
  metaDescription?: string;
  friendlyUrl?: string;
  newArrival?: boolean;
  hsCode?: string;
  countryOfOrigin?: string;
  attributes?: Record<string, any>;
  categoryAttributes?: Record<string, any>;
  images?: Array<{ id: number; url: string; isPrimary: boolean }>;

  // Aggregate review fields returned by backend on detail/list endpoints
  averageRating?: number;
  reviewCount?: number;
  // Sanitized rich-text description (see shared/utils/sanitize.ts) — falls
  // back to the plain-text `description` above when the backend omits it
  descriptionHtml?: string;
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
  categoryType?: string;
  subCategory?: string;
  brandId?: number;
  storeId?: number;
  tags?: string[];
  featured?: boolean;
  parentMasterProductId?: number;
  attributes?: CategoryAttributes;
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

export interface MasterProductMediaDTO {
  id: number;
  mediaUrl: string;
  mediaType: string;
  isPrimary: boolean;
  sortOrder: number;
  altText?: string;
}

export interface MasterProductDTO {
  id: number;
  name: string;
  slug: string;
  brandId?: number;
  brandName?: string;
  categoryId: number;
  categoryName: string;
  baseDescription?: string;
  shortDescription?: string;
  specifications?: string;
  imageUrl?: string;
  media?: MasterProductMediaDTO[];
  parentMasterProductId?: number;
}
