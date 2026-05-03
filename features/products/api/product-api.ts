import apiClient from '@/lib/axios';
import { env } from '@/env';

// Determine the base API URL for native fetch calls (mostly used in Server Components)
const API_URL =
  typeof window === 'undefined'
    ? env.backendApiUrl ||
    (process.env.NEXT_PUBLIC_API_URL
      ? process.env.NEXT_PUBLIC_API_URL.replace('/api/v1', '')
      : '')
    : env.apiBaseUrl;

async function serverFetch<T>(endpoint: string, init?: RequestInit): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  } catch (error: any) {
    // Graceful handling for unreachable backend in local development
    if (error.cause?.code === 'ECONNREFUSED' || error.message?.includes('fetch failed')) {
      throw new Error('Backend Unreachable');
    }
    throw error;
  }
}
import { API_ENDPOINTS } from '@/constants/api/endpoints';
import {
  ProductDTO,
  PageResponse,
  PageRequest,
  ProductFilters,
  CategoryDTO,
  BrandDTO,
  TagDTO,
} from '@/types';

/**
 * Utility to identify if an error is due to an unreachable backend
 */
export const isBackendDown = (error: any): boolean => {
  const msg = (error?.message || '').toLowerCase();
  return (
    msg.includes('backend unreachable') ||
    msg.includes('econnrefused') ||
    msg.includes('fetch failed') ||
    msg.includes('network error') ||
    msg.includes('unable to reach the server')
  );
};

// Time Complexity: O(1) - single HTTP request
// Space Complexity: O(n) where n is number of products in response
export const productApi = {
  getProducts: async (params: PageRequest & ProductFilters): Promise<PageResponse<ProductDTO>> => {
    // Use apiClient (axios) so this works from both Server and Client Components
    const { data: resp } = await apiClient.get<any>(API_ENDPOINTS.PRODUCTS.LIST, { params });
    // Handle nested ApiResponse wrapper: { data: PageResponse } or plain PageResponse
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

  getProductById: async (id: number): Promise<ProductDTO> => {
    const { data } = await apiClient.get<ProductDTO>(API_ENDPOINTS.PRODUCTS.DETAIL(String(id)));
    return data;
  },

  updateProduct: async (id: number, payload: Partial<ProductDTO>): Promise<ProductDTO> => {
    const { data } = await apiClient.put<ProductDTO>(
      API_ENDPOINTS.PRODUCTS.UPDATE(String(id)),
      payload
    );
    return data;
  },

  deleteProduct: async (id: number): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.PRODUCTS.DELETE(String(id)));
  },

  createProduct: async (
    payload: Partial<Record<string, unknown>>,
    options?: { correlationId?: string }
  ): Promise<ProductDTO> => {
    const headers = options?.correlationId
      ? { 'X-Correlation-Id': options.correlationId }
      : undefined;

    const { data } = await apiClient.post<ProductDTO>(API_ENDPOINTS.PRODUCTS.CREATE, payload, {
      headers,
    });
    return data;
  },

  searchProducts: async (
    query: string,
    params?: PageRequest
  ): Promise<PageResponse<ProductDTO>> => {
    const queryParams = new URLSearchParams();
    queryParams.append('query', query);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }

    const queryString = queryParams.toString();
    const endpoint = `${API_ENDPOINTS.PRODUCTS.SEARCH}?${queryString}`;

    return serverFetch<PageResponse<ProductDTO>>(endpoint, { cache: 'no-store' });
  },

  getFeaturedProducts: async (): Promise<ProductDTO[]> => {
    const data = await serverFetch<any>('/api/v1/products/featured', { next: { revalidate: 60 } });
    return data?.data || data;
  },

  getCategories: async (): Promise<CategoryDTO[]> => {
    // Use the /tree endpoint — it returns ALL categories unpaginated.
    // The paginated /list endpoint only returns the first page (A-B alphabetically),
    // which is why Fashion, Electronics, etc. were missing from the filter sidebar.
    const { data: resp } = await apiClient.get<any>(API_ENDPOINTS.CATEGORIES.TREE);
    const raw = resp?.data?.data ?? resp?.data ?? resp ?? [];
    const arr: CategoryDTO[] = Array.isArray(raw) ? raw : [];

    // Tree entries are already root-level; deduplicate by name just in case
    const seenNames = new Set<string>();
    return arr.filter((c) => {
      const key = c.name.toLowerCase();
      if (seenNames.has(key)) return false;
      seenNames.add(key);
      return true;
    });
  },

  getCategoryTree: async (): Promise<CategoryDTO[]> => {
    const data = await serverFetch<any>(API_ENDPOINTS.CATEGORIES.TREE, {
      next: { revalidate: 3600 },
    });

    if (data?.data && Array.isArray(data.data)) {
      return data.data;
    }
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  },

  getBrands: async (): Promise<BrandDTO[]> => {
    const { data: resp } = await apiClient.get<any>(API_ENDPOINTS.BRANDS.LIST);
    const raw = resp?.data?.data ?? resp?.data ?? resp ?? [];
    return Array.isArray(raw) ? raw : [];
  },

  getTags: async (): Promise<TagDTO[]> => {
    const data = await serverFetch<any>(API_ENDPOINTS.TAGS.LIST, { next: { revalidate: 3600 } });
    return data?.data || data;
  },
};
