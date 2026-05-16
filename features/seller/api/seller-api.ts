import { apiClient } from '@/lib/http/services';
import { logger } from '@/lib/observability/logger';
import { ProductDTO, PageResponse, PageRequest } from '@/types';
import { Store, StoreCreateRequest, StoreUpdateRequest, SellerProfile, SellerOnboardingRequest, SellerOnboardingResponse } from '../types';
import { API_ENDPOINTS } from '@/constants/api/endpoints';

/**
 * [HARDEN] Consolidated Seller API Service
 * 
 * Single source of truth for all seller-related operations.
 * - Store Management
 * - Product Inventory Management
 * - Seller Profile & KYC
 * - Onboarding / Registration
 */
export const sellerApi = {
  // ============================================================================
  // Onboarding & Profile
  // ============================================================================

  /**
   * Register a new seller (onboarding)
   */
  register: async (data: SellerOnboardingRequest): Promise<SellerOnboardingResponse> => {
    logger.debug('🔍 [sellerApi.register] Onboarding request:', { data });
    const { data: resp } = await apiClient.post<any>(API_ENDPOINTS.SELLERS.REGISTER, data);
    return resp?.data ?? resp;
  },

  /**
   * Get current user's seller profile (KYC status, etc.)
   */
  getMyProfile: async (): Promise<SellerProfile | null> => {
    try {
      const { data: resp } = await apiClient.get<any>(API_ENDPOINTS.SELLERS.PROFILE);
      return resp?.data ?? resp;
    } catch (error: any) {
      if (error?.statusCode === 404) return null;
      throw error;
    }
  },

  /**
   * Check if user has an active seller profile
   */
  profileExists: async (): Promise<boolean> => {
    try {
      const { data: resp } = await apiClient.get<any>(API_ENDPOINTS.SELLERS.PROFILE_EXISTS);
      const data = resp?.data ?? resp;
      return typeof data === 'boolean' ? data : Boolean(data);
    } catch (error: any) {
      if (error?.statusCode === 404) return false;
      return false;
    }
  },

  /**
   * Update seller profile details
   */
  updateProfile: async (data: Partial<SellerOnboardingRequest>): Promise<SellerProfile> => {
    const { data: resp } = await apiClient.put<any>(API_ENDPOINTS.SELLERS.PROFILE, data);
    return resp?.data ?? resp;
  },

  // ============================================================================
  // Store Management
  // ============================================================================

  /**
   * Get current user's store details
   */
  getMyStore: async (): Promise<Store | null> => {
    try {
      const { data: resp } = await apiClient.get<any>(API_ENDPOINTS.SELLER_STORE.MY_STORE);
      return resp?.data ?? resp;
    } catch (error: any) {
      if (error?.statusCode === 404) return null;
      throw error;
    }
  },

  /**
   * Check if user has an active store
   */
  checkStoreExists: async (): Promise<boolean> => {
    try {
      const { data: resp } = await apiClient.get<any>(API_ENDPOINTS.SELLER_STORE.EXISTS);
      const data = resp?.data ?? resp;
      return Boolean(data);
    } catch (error: any) {
      if ([404, 403, 428].includes(error?.statusCode)) {
        return false;
      }
      throw error;
    }
  },

  /**
   * Create a new store
   */
  createStore: async (storeData: StoreCreateRequest): Promise<Store> => {
    const { data: resp } = await apiClient.post<any>(
      API_ENDPOINTS.SELLER_STORE.MY_STORE,
      storeData
    );
    return resp?.data ?? resp;
  },

  /**
   * Update existing store details
   */
  updateStore: async (storeData: Partial<StoreUpdateRequest>): Promise<Store> => {
    const { data: resp } = await apiClient.put<any>(API_ENDPOINTS.SELLER_STORE.MY_STORE, storeData);
    return resp?.data ?? resp;
  },

  // ============================================================================
  // Product Inventory Management
  // ============================================================================

  /**
   * Get paginated products for the current seller
   */
  getMyProducts: async (params: PageRequest): Promise<PageResponse<ProductDTO>> => {
    const { data: resp } = await apiClient.get<any>(
      API_ENDPOINTS.SELLER_PRODUCTS.LIST,
      { params }
    );
    return resp?.data ?? resp;
  },

  /**
   * Create a new product as a seller
   */
  createProduct: async (productData: Partial<ProductDTO>): Promise<ProductDTO> => {
    const { data: resp } = await apiClient.post<any>(
      API_ENDPOINTS.SELLER_PRODUCTS.CREATE,
      productData
    );
    return resp?.data ?? resp;
  },

  /**
   * Update a product as a seller
   */
  updateProduct: async (id: number, productData: Partial<ProductDTO>): Promise<ProductDTO> => {
    const { data: resp } = await apiClient.put<any>(
      API_ENDPOINTS.SELLER_PRODUCTS.UPDATE(id),
      productData
    );
    return resp?.data ?? resp;
  },

  /**
   * Delete a product
   */
  deleteProduct: async (id: number): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.SELLER_PRODUCTS.DELETE(id));
  },

  /**
   * Toggle product active/inactive status
   */
  toggleProductStatus: async (id: number): Promise<ProductDTO> => {
    const { data: resp } = await apiClient.patch<any>(
      API_ENDPOINTS.SELLER_PRODUCTS.TOGGLE_STATUS(id)
    );
    return resp?.data ?? resp;
  },
};


