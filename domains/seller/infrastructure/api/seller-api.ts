import { apiClient } from '@/core/client';
import { RequestOptions } from '@/core/client/types';
import { logger } from '@/core/telemetry/logger';
import { PageResponse, PageRequest } from '@/shared/types';
import { ProductDTO } from '@/domains/catalog/contracts/catalog.types';
import { API_ENDPOINTS } from '@/shared/constants/api/endpoints';

export interface Store {
  id: number;
  name: string;
  description: string;
  handle: string;
  logoUrl?: string;
  bannerUrl?: string;
  status: string;
}

export interface StoreCreateRequest {
  storeName: string;
  description: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  district: string;
  taluk?: string;
  state: string;
  pincode: string;
  country: string;
}

export interface StoreUpdateRequest extends StoreCreateRequest {
  id: number;
  status?: string;
}

export interface SellerProfile {
  id: number;
  businessName: string;
  panNumber: string;
  gstin?: string;
  status: string;
}

export interface SellerOnboardingRequest {
  firstName: string;
  lastName: string;
  phone: string;
  addressLine1: string;
  city: string;
  state: string;
  pincode: string;
  panNumber: string;
  gstin?: string;
  shopName: string;
  storeAddressLine1: string;
  storeCity: string;
  storeState: string;
  storePincode: string;
  bankAccountNumber: string;
  bankIfsc: string;
  acceptedTerms: boolean;
}

export interface SellerOnboardingResponse {
  sellerId: number;
  shopId: number;
  status: string;
}

/**
 * [HARDEN] Consolidated Seller Bounded-Context API Service
 */
export const sellerApi = {
  // ============================================================================
  // Profiles & KYC (decoupled seller domain context logic)
  // ============================================================================

  getProfile: async (options: RequestOptions = {}): Promise<any> => {
    const { data } = await apiClient.get('/api/v1/sellers/profile', {
      signal: options.signal,
    });
    return data;
  },

  updateProfile: async (payload: any, options: RequestOptions = {}): Promise<any> => {
    const { data } = await apiClient.put('/api/v1/sellers/profile', payload, {
      signal: options.signal,
    });
    return data;
  },

  getDashboardStats: async (options: RequestOptions = {}): Promise<any> => {
    const { data } = await apiClient.get('/api/v1/sellers/dashboard/stats', {
      signal: options.signal,
    });
    return data;
  },

  // ============================================================================
  // Onboarding & Registration
  // ============================================================================

  register: async (data: SellerOnboardingRequest): Promise<SellerOnboardingResponse> => {
    logger.debug('🔍 [sellerApi.register] Onboarding request:', { data });
    const { data: resp } = await apiClient.post<any>(API_ENDPOINTS.SELLER.REGISTER, data);
    return resp?.data ?? resp;
  },

  getMyProfile: async (): Promise<SellerProfile | null> => {
    try {
      const { data: resp } = await apiClient.get<any>(API_ENDPOINTS.SELLER.PROFILE, {
        headers: { 'X-Bypass-Toast': 'true' }
      });
      return resp?.data ?? resp;
    } catch (error: any) {
      if (error?.statusCode === 404) return null;
      throw error;
    }
  },

  profileExists: async (): Promise<boolean> => {
    try {
      const { data: resp } = await apiClient.get<any>(API_ENDPOINTS.SELLER.PROFILE_EXISTS, {
        headers: { 'X-Bypass-Toast': 'true' }
      });
      const data = resp?.data ?? resp;
      return typeof data === 'boolean' ? data : Boolean(data);
    } catch (error: any) {
      if (error?.statusCode === 404) return false;
      return false;
    }
  },

  // ============================================================================
  // Store Management
  // ============================================================================

  getMyStore: async (): Promise<Store | null> => {
    try {
      const { data: resp } = await apiClient.get<any>(API_ENDPOINTS.SELLER.STORE, {
        headers: { 'X-Bypass-Toast': 'true' }
      });
      return resp?.data ?? resp;
    } catch (error: any) {
      if (error?.statusCode === 404) return null;
      throw error;
    }
  },

  checkStoreExists: async (): Promise<boolean> => {
    try {
      const { data: resp } = await apiClient.get<any>(`${API_ENDPOINTS.SELLER.STORE}/exists`, {
        headers: { 'X-Bypass-Toast': 'true' }
      });
      const data = resp?.data ?? resp;
      return Boolean(data);
    } catch (error: any) {
      if ([404, 403, 428].includes(error?.statusCode)) {
        return false;
      }
      throw error;
    }
  },

  createStore: async (storeData: StoreCreateRequest): Promise<Store> => {
    const { data: resp } = await apiClient.post<any>(
      API_ENDPOINTS.SELLER.STORE,
      storeData
    );
    return resp?.data ?? resp;
  },

  updateStore: async (storeData: Partial<StoreUpdateRequest>): Promise<Store> => {
    const { data: resp } = await apiClient.put<any>(API_ENDPOINTS.SELLER.STORE, storeData);
    return resp?.data ?? resp;
  },

  // ============================================================================
  // Product Inventory Management
  // ============================================================================

  getMyProducts: async (params: PageRequest): Promise<PageResponse<ProductDTO>> => {
    const { data: resp } = await apiClient.get<any>(
      API_ENDPOINTS.SELLER.PRODUCTS,
      { params }
    );
    return resp?.data ?? resp;
  },

  createProduct: async (productData: Partial<ProductDTO>): Promise<ProductDTO> => {
    const { data: resp } = await apiClient.post<any>(
      API_ENDPOINTS.SELLER.PRODUCTS,
      productData
    );
    return resp?.data ?? resp;
  },

  updateProduct: async (id: number, productData: Partial<ProductDTO>): Promise<ProductDTO> => {
    const { data: resp } = await apiClient.put<any>(
      `${API_ENDPOINTS.SELLER.PRODUCTS}/${id}`,
      productData
    );
    return resp?.data ?? resp;
  },

  deleteProduct: async (id: number): Promise<void> => {
    await apiClient.delete(`${API_ENDPOINTS.SELLER.PRODUCTS}/${id}`);
  },

  toggleProductStatus: async (id: number): Promise<ProductDTO> => {
    const { data: resp } = await apiClient.patch<any>(
      `${API_ENDPOINTS.SELLER.PRODUCTS}/${id}/toggle-status`
    );
    return resp?.data ?? resp;
  },
};

export const sellersApi = sellerApi;
export default sellerApi;
