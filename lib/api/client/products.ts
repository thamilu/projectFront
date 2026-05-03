/**
 * Products API Service
 * Handles all product-related API calls
 */

import { apiClient } from '../axios';
import { unwrapData } from './utils';
import type {
  ProductDTO,
  PaginatedResponse,
  ApiResponse,
} from '@/types';

const PRODUCTS_BASE = '/api/products';

export interface ProductSearchParams {
  keyword?: string;
  categoryId?: number;
  brandId?: number;
  shopId?: number;
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
  inStock?: boolean;
  featured?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}

export interface ProductCreateRequest {
  name: string;
  description: string;
  sku: string;
  price: number;
  discountPrice?: number;
  stockQuantity: number;
  categoryId: number;
  brandId?: number;
  shopId: number;
  tags?: string[];
  imageUrl?: string;
  active?: boolean;
  featured?: boolean;
}

export interface ProductUpdateRequest extends Partial<ProductCreateRequest> {
  id: number;
}

export const productsApi = {
  /**
   * Get all products (paginated)
   * GET /api/products
   */
  getAll: async (params?: ProductSearchParams): Promise<PaginatedResponse<ProductDTO>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<ProductDTO>>>(
      PRODUCTS_BASE,
      { params }
    );
    return unwrapData(response);
  },

  /**
   * Get product by ID
   * GET /api/products/{id}
   */
  getById: async (id: number): Promise<ProductDTO> => {
    const response = await apiClient.get<ApiResponse<ProductDTO>>(
      `${PRODUCTS_BASE}/${id}`
    );
    return unwrapData(response);
  },

  /**
   * Get product by SKU
   * GET /api/products/sku/{sku}
   */
  getBySku: async (sku: string): Promise<ProductDTO> => {
    const response = await apiClient.get<ApiResponse<ProductDTO>>(
      `${PRODUCTS_BASE}/sku/${sku}`
    );
    return unwrapData(response);
  },

  /**
   * Get product by friendly URL
   * GET /api/products/url/{url}
   */
  getByUrl: async (url: string): Promise<ProductDTO> => {
    const response = await apiClient.get<ApiResponse<ProductDTO>>(
      `${PRODUCTS_BASE}/url/${url}`
    );
    return unwrapData(response);
  },

  /**
   * Search products
   * GET /api/products/search
   */
  search: async (params: ProductSearchParams): Promise<PaginatedResponse<ProductDTO>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<ProductDTO>>>(
      `${PRODUCTS_BASE}/search`,
      { params }
    );
    return unwrapData(response);
  },

  /**
   * Get products by category
   * GET /api/products/category/{categoryId}
   */
  getByCategory: async (
    categoryId: number,
    params?: ProductSearchParams
  ): Promise<PaginatedResponse<ProductDTO>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<ProductDTO>>>(
      `${PRODUCTS_BASE}/category/${categoryId}`,
      { params }
    );
    return unwrapData(response);
  },

  /**
   * Get products by brand
   * GET /api/products/brand/{brandId}
   */
  getByBrand: async (
    brandId: number,
    params?: ProductSearchParams
  ): Promise<PaginatedResponse<ProductDTO>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<ProductDTO>>>(
      `${PRODUCTS_BASE}/brand/${brandId}`,
      { params }
    );
    return unwrapData(response);
  },

  /**
   * Get products by shop
   * GET /api/products/shop/{shopId}
   */
  getByShop: async (
    shopId: number,
    params?: ProductSearchParams
  ): Promise<PaginatedResponse<ProductDTO>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<ProductDTO>>>(
      `${PRODUCTS_BASE}/shop/${shopId}`,
      { params }
    );
    return unwrapData(response);
  },

  /**
   * Get products by tags
   * GET /api/products/tags
   */
  getByTags: async (
    tags: string[],
    params?: ProductSearchParams
  ): Promise<PaginatedResponse<ProductDTO>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<ProductDTO>>>(
      `${PRODUCTS_BASE}/tags`,
      { params: { ...params, tags } }
    );
    return unwrapData(response);
  },

  /**
   * Get featured products
   * GET /api/products/featured
   */
  getFeatured: async (params?: ProductSearchParams): Promise<PaginatedResponse<ProductDTO>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<ProductDTO>>>(
      `${PRODUCTS_BASE}/featured`,
      { params }
    );
    return unwrapData(response);
  },

  /**
   * Create product (Seller/Admin)
   * POST /api/products
   */
  create: async (data: ProductCreateRequest): Promise<ProductDTO> => {
    const response = await apiClient.post<ApiResponse<ProductDTO>>(
      PRODUCTS_BASE,
      data
    );
    return unwrapData(response);
  },

  /**
   * Update product (Seller/Admin)
   * PUT /api/products/{id}
   */
  update: async (id: number, data: ProductUpdateRequest): Promise<ProductDTO> => {
    const response = await apiClient.put<ApiResponse<ProductDTO>>(
      `${PRODUCTS_BASE}/${id}`,
      data
    );
    return unwrapData(response);
  },

  /**
   * Delete product (Seller/Admin)
   * DELETE /api/products/{id}
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${PRODUCTS_BASE}/${id}`);
  },

  /**
   * Update product stock
   * PATCH /api/products/{id}/stock
   */
  updateStock: async (id: number, quantity: number): Promise<ProductDTO> => {
    const response = await apiClient.patch<ApiResponse<ProductDTO>>(
      `${PRODUCTS_BASE}/${id}/stock`,
      { quantity }
    );
    return unwrapData(response);
  },
};
