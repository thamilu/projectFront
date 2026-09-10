import { apiClient } from '@/core/client';
import { RequestOptions } from '@/core/client/types';
import { API_ENDPOINTS } from '@/shared/constants/api/endpoints';
import { PageResponse, PageRequest } from '@/shared/types';
import { toPageResponse } from '@/shared/utils/api-helpers';
import {
  ProductDTO,
  ProductFilters,
  CategoryDTO,
  BrandDTO,
  TagDTO,
  MasterProductDTO,
} from '@/domains/catalog/contracts/catalog.types';

/**
 * [HARDEN] Consolidated Products Catalog API Service
 */
export const productsApi = {
  /**
   * Get paginated products.
   */
  getAll: async (
    params: PageRequest & ProductFilters = { page: 0, size: 10 },
    options: RequestOptions = {}
  ): Promise<PageResponse<ProductDTO>> => {
    const { data: resp } = await apiClient.get<any>(API_ENDPOINTS.PRODUCTS.LIST, {
      params,
      signal: options.signal,
    });
    return toPageResponse<ProductDTO>(resp, params);
  },

  /**
   * Get a single product by ID.
   */
  getById: async (id: number | string, options: RequestOptions = {}): Promise<ProductDTO> => {
    const { data } = await apiClient.get<ProductDTO>(API_ENDPOINTS.PRODUCTS.DETAIL(String(id)), {
      signal: options.signal,
    });
    return data;
  },

  /**
   * Get a single product by URL slug.
   */
  getByUrl: async (slug: string, options: RequestOptions = {}): Promise<ProductDTO | null> => {
    const { data: resp } = await apiClient.get<any>(API_ENDPOINTS.PRODUCTS.LIST, {
      params: { slug, size: 1 },
      signal: options.signal,
    });

    const products = resp?.data?.content ?? resp?.content ?? [];
    return products.length > 0 ? products[0] : null;
  },

  /**
   * Update an existing product.
   */
  update: async (
    id: number,
    payload: Partial<ProductDTO>,
    options: RequestOptions = {}
  ): Promise<ProductDTO> => {
    const { data } = await apiClient.put<ProductDTO>(
      API_ENDPOINTS.PRODUCTS.UPDATE(String(id)),
      payload,
      { signal: options.signal }
    );
    return data;
  },

  /**
   * Delete a product.
   */
  delete: async (id: number, options: RequestOptions = {}): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.PRODUCTS.DELETE(String(id)), {
      signal: options.signal,
    });
  },

  /**
   * Create a new product.
   */
  create: async (
    payload: Partial<Record<string, unknown>>,
    options: RequestOptions = {}
  ): Promise<ProductDTO> => {
    const headers = options.correlationId
      ? { 'X-Correlation-Id': options.correlationId }
      : undefined;

    const { data } = await apiClient.post<ProductDTO>(API_ENDPOINTS.PRODUCTS.CREATE, payload, {
      headers,
      signal: options.signal,
    });
    return data;
  },

  /**
   * Clone/List a product from Master Catalog to Seller Store.
   */
  cloneToStore: async (
    masterProductId: number | string,
    options: RequestOptions = {}
  ): Promise<ProductDTO> => {
    const { data } = await apiClient.post<ProductDTO>(
      API_ENDPOINTS.PRODUCTS.CLONE(String(masterProductId)),
      {},
      { signal: options.signal }
    );
    return data;
  },

  /**
   * Get paginated master catalog products.
   */
  getMasterProducts: async (
    params: PageRequest & { search?: string } = { page: 0, size: 10 },
    options: RequestOptions = {}
  ): Promise<PageResponse<MasterProductDTO>> => {
    const { data: resp } = await apiClient.get<any>(API_ENDPOINTS.PRODUCTS.MASTER, {
      params,
      signal: options.signal,
      headers: options.headers,
    });
    return toPageResponse<MasterProductDTO>(resp, params);
  },

  /**
   * Get a single master catalog product by ID.
   */
  getMasterProductById: async (
    id: number | string,
    options: RequestOptions = {}
  ): Promise<MasterProductDTO> => {
    const { data } = await apiClient.get<any>(`${API_ENDPOINTS.PRODUCTS.MASTER}/${id}`, {
      signal: options.signal,
    });
    return data?.data ?? data;
  },

  /**
   * Get category tree.
   */
  getCategoryTree: async (options: RequestOptions = {}): Promise<CategoryDTO[]> => {
    const { data: resp } = await apiClient.get<any>(API_ENDPOINTS.CATEGORIES.TREE, {
      signal: options.signal,
    });

    const raw = resp?.data?.data ?? resp?.data ?? resp ?? [];
    return Array.isArray(raw) ? raw : [];
  },

  /**
   * Get all brands.
   */
  getBrands: async (options: RequestOptions = {}): Promise<BrandDTO[]> => {
    const { data: resp } = await apiClient.get<any>(API_ENDPOINTS.BRANDS.LIST, {
      signal: options.signal,
    });
    const raw = resp?.data?.data ?? resp?.data ?? resp ?? [];
    return Array.isArray(raw) ? raw : [];
  },

  /**
   * Get paginated products (Alias for getAll).
   */
  getProducts: async (
    params: PageRequest & ProductFilters = { page: 0, size: 10 },
    options: RequestOptions = {}
  ): Promise<PageResponse<ProductDTO>> => {
    return productsApi.getAll(params, options);
  },

  /**
   * Get a single product by ID (Alias for getById).
   */
  getProductById: async (
    id: number | string,
    options: RequestOptions = {}
  ): Promise<ProductDTO> => {
    return productsApi.getById(id, options);
  },

  /**
   * Search products with keyword.
   */
  searchProducts: async (
    keyword: string,
    params: PageRequest = { page: 0, size: 10 },
    options: RequestOptions = {}
  ): Promise<PageResponse<ProductDTO>> => {
    const { data: resp } = await apiClient.get<any>(API_ENDPOINTS.PRODUCTS.SEARCH, {
      params: { ...params, keyword },
      signal: options.signal,
    });
    return toPageResponse<ProductDTO>(resp, params);
  },

  /**
   * Get featured products.
   */
  getFeaturedProducts: async (
    params: PageRequest = { page: 0, size: 10 },
    options: RequestOptions = {}
  ): Promise<ProductDTO[]> => {
    const { data: resp } = await apiClient.get<any>(API_ENDPOINTS.PRODUCTS.FEATURED, {
      params,
      signal: options.signal,
    });
    const content = resp?.data?.content ?? resp?.content ?? resp?.data ?? [];
    return Array.isArray(content) ? content : [];
  },

  /**
   * Get category tree (Alias for getCategoryTree).
   */
  getCategories: async (options: RequestOptions = {}): Promise<CategoryDTO[]> => {
    return productsApi.getCategoryTree(options);
  },

  /**
   * Get all tags.
   */
  getTags: async (options: RequestOptions = {}): Promise<TagDTO[]> => {
    const { data: resp } = await apiClient.get<any>(API_ENDPOINTS.TAGS.LIST, {
      signal: options.signal,
    });
    const raw = resp?.data?.data ?? resp?.data ?? resp ?? [];
    return Array.isArray(raw) ? raw : [];
  },
};

export interface ProductDuplicateCandidateDTO {
  id: number;
  sourceProductId: number;
  matchedProductId: number;
  similarityScore: number;
  reviewStatus: string;
  createdAt: string;
}

export const adminCatalogApi = {
  getDuplicateCandidates: async (
    options: RequestOptions = {}
  ): Promise<ProductDuplicateCandidateDTO[]> => {
    const { data: resp } = await apiClient.get<any>(
      API_ENDPOINTS.ADMIN_CATALOG.DUPLICATE_CANDIDATES,
      {
        signal: options.signal,
      }
    );
    return resp?.data ?? resp ?? [];
  },

  mergeProducts: async (
    sourceId: string | number,
    targetId: string | number,
    options: RequestOptions = {}
  ): Promise<void> => {
    await apiClient.post(
      API_ENDPOINTS.ADMIN_CATALOG.MERGE(sourceId, targetId),
      {},
      { signal: options.signal }
    );
  },

  dismissCandidate: async (id: string | number, options: RequestOptions = {}): Promise<void> => {
    await apiClient.post(API_ENDPOINTS.ADMIN_CATALOG.DISMISS(id), {}, { signal: options.signal });
  },
};

// Compatibility exports
export const productApi = productsApi;
export default productsApi;
