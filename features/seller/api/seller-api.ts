import apiClient from '@/lib/axios';
import { logger } from '@/lib/observability/logger';
import { ProductDTO, PageResponse, PageRequest } from '@/types';
import { Store, StoreCreateRequest, StoreUpdateRequest } from '../types';
import { API_ENDPOINTS } from '@/constants/api/endpoints';

// Time Complexity: O(1) - single HTTP request
// Space Complexity: O(n) where n is size of response data
export const sellerApi = {
  getMyStore: async (): Promise<Store | null> => {
    try {
      const response = await apiClient.get<unknown>(API_ENDPOINTS.SELLER_STORE.MY_STORE);
      const responseData: unknown = response.data;

      // Unwrap ApiResponse<T> if present.
      if (responseData && typeof responseData === 'object' && 'data' in responseData) {
        return (responseData as { data: Store }).data;
      }
      return responseData as Store;
    } catch (error: unknown) {
      const err = error as { status?: number; message?: string };
      // Only 404 means "no store yet". Other statuses should surface to the UI.
      if (err?.status === 404) return null;
      throw error;
    }
  },

  checkStoreExists: async (): Promise<boolean> => {
    try {
      const response = await apiClient.get<unknown>(API_ENDPOINTS.SELLER_STORE.EXISTS);
      const responseData: unknown = response.data;

      // Unwrap ApiResponse<boolean> if present.
      if (responseData && typeof responseData === 'object' && 'data' in responseData) {
        return Boolean((responseData as { data?: unknown }).data);
      }

      return Boolean(responseData);
    } catch (error: unknown) {
      const err = error as { status?: number };
      if (err?.status === 404 || err?.status === 403 || err?.status === 428) {
        return false;
      }
      throw error;
    }
  },

  createStore: async (storeData: StoreCreateRequest): Promise<Store> => {
    logger.debug('🔍 [createStore] Request payload:', { storeData });

    try {
      const response = await apiClient.post<unknown>(
        API_ENDPOINTS.SELLER_STORE.MY_STORE,
        storeData
      );
      const responseData: unknown = response.data;
      logger.info('✅ [createStore] Success:', { data: responseData });

      // Unwrap ApiResponse<T> if present.
      if (responseData && typeof responseData === 'object' && 'data' in responseData) {
        return (responseData as { data: Store }).data;
      }
      return responseData as Store;
    } catch (error: unknown) {
      const err = error as { status?: number; message?: string };
      logger.error('❌ [createStore] Failed', { status: err?.status, message: err?.message });
      throw error;
    }
  },

  updateStore: async (storeData: Partial<StoreUpdateRequest>): Promise<Store> => {
    const response = await apiClient.put<unknown>(API_ENDPOINTS.SELLER_STORE.MY_STORE, storeData);
    const responseData: unknown = response.data;

    // Unwrap ApiResponse<T> if present.
    if (responseData && typeof responseData === 'object' && 'data' in responseData) {
      return (responseData as { data: Store }).data;
    }
    return responseData as Store;
  },

  getMyProducts: async (params: PageRequest): Promise<PageResponse<ProductDTO>> => {
    const { data } = await apiClient.get<PageResponse<ProductDTO>>(
      API_ENDPOINTS.SELLER_PRODUCTS.LIST,
      {
        params,
      }
    );
    return data;
  },

  createProduct: async (productData: Partial<ProductDTO>): Promise<ProductDTO> => {
    const { data } = await apiClient.post<ProductDTO>(
      API_ENDPOINTS.SELLER_PRODUCTS.CREATE,
      productData
    );
    return data;
  },

  updateProduct: async (id: number, productData: Partial<ProductDTO>): Promise<ProductDTO> => {
    const { data } = await apiClient.put<ProductDTO>(
      API_ENDPOINTS.SELLER_PRODUCTS.UPDATE(id),
      productData
    );
    return data;
  },

  deleteProduct: async (id: number): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.SELLER_PRODUCTS.DELETE(id));
  },

  toggleProductStatus: async (id: number): Promise<ProductDTO> => {
    const { data } = await apiClient.patch<ProductDTO>(
      API_ENDPOINTS.SELLER_PRODUCTS.TOGGLE_STATUS(id)
    );
    return data;
  },
};
