import { apiClient } from '@/core/client';
import { RequestOptions } from '@/core/client/types';
import { API_ENDPOINTS } from '@/shared/constants/api/endpoints';
import { PageResponse, PageRequest } from '@/shared/types';
import { ProductDTO, ProductFilters, CategoryDTO, BrandDTO, TagDTO } from '@/domains/catalog/contracts/catalog.types';

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
      signal: options.signal
    });
    
    const page = resp?.data ?? resp;
    return {
      content: page?.content ?? [],
      totalElements: page?.totalElements ?? 0,
      totalPages: page?.totalPages ?? 0,
      size: page?.size ?? params.size,
      number: page?.number ?? params.page,
      first: page?.first ?? true,
      last: page?.last ?? true,
    };
  },

  /**
   * Get a single product by ID.
   */
  getById: async (
    id: number | string,
    options: RequestOptions = {}
  ): Promise<ProductDTO> => {
    const { data } = await apiClient.get<ProductDTO>(
      API_ENDPOINTS.PRODUCTS.DETAIL(String(id)),
      { signal: options.signal }
    );
    return data;
  },

  /**
   * Get a single product by URL slug.
   */
  getByUrl: async (
    slug: string,
    options: RequestOptions = {}
  ): Promise<ProductDTO | null> => {
    const { data: resp } = await apiClient.get<any>(API_ENDPOINTS.PRODUCTS.LIST, {
      params: { slug, size: 1 },
      signal: options.signal
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

    const { data } = await apiClient.post<ProductDTO>(
      API_ENDPOINTS.PRODUCTS.CREATE,
      payload,
      { 
        headers,
        signal: options.signal 
      }
    );
    return data;
  },

  /**
   * Get category tree.
   */
  getCategoryTree: async (options: RequestOptions = {}): Promise<CategoryDTO[]> => {
    const { data: resp } = await apiClient.get<any>(API_ENDPOINTS.CATEGORIES.TREE, {
      signal: options.signal
    });

    const raw = resp?.data?.data ?? resp?.data ?? resp ?? [];
    return Array.isArray(raw) ? raw : [];
  },

  /**
   * Get all brands.
   */
  getBrands: async (options: RequestOptions = {}): Promise<BrandDTO[]> => {
    const { data: resp } = await apiClient.get<any>(API_ENDPOINTS.BRANDS.LIST, {
      signal: options.signal
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
      signal: options.signal
    });
    const page = resp?.data ?? resp;
    return {
      content: page?.content ?? [],
      totalElements: page?.totalElements ?? 0,
      totalPages: page?.totalPages ?? 0,
      size: page?.size ?? params.size,
      number: page?.number ?? params.page,
      first: page?.first ?? true,
      last: page?.last ?? true,
    };
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
      signal: options.signal
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
      signal: options.signal
    });
    const raw = resp?.data?.data ?? resp?.data ?? resp ?? [];
    return Array.isArray(raw) ? raw : [];
  },
};

// Compatibility exports
export const productApi = productsApi;
export default productsApi;
