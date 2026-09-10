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
  currencyCode?: string;
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
  currencyCode?: string;
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
    const { data } = await apiClient.get(API_ENDPOINTS.DASHBOARD.SELLER, {
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

  getMyProfile: async (options?: RequestOptions): Promise<SellerProfile | null> => {
    try {
      const { data: resp } = await apiClient.get<any>(API_ENDPOINTS.SELLER.PROFILE, {
        headers: {
          'X-Bypass-Toast': 'true',
          ...options?.headers,
        },
        signal: options?.signal,
      });
      return resp?.data ?? resp;
    } catch (error: any) {
      // 404 = profile not found; 403/428 = not yet a seller — all mean "no profile yet"
      const NO_PROFILE_CODES = [403, 404, 412, 428];
      if (NO_PROFILE_CODES.includes(error?.statusCode)) return null;
      throw error;
    }
  },

  profileExists: async (): Promise<boolean> => {
    try {
      const { data: resp } = await apiClient.get<any>(API_ENDPOINTS.SELLER.PROFILE_EXISTS, {
        headers: { 'X-Bypass-Toast': 'true' },
      });
      const data = resp?.data ?? resp;
      return typeof data === 'boolean' ? data : Boolean(data);
    } catch {
      // Any error means we cannot confirm the profile exists — treat as false
      return false;
    }
  },

  // ============================================================================
  // Store Management
  // ============================================================================

  getMyStore: async (): Promise<Store | null> => {
    try {
      const { data: resp } = await apiClient.get<any>(API_ENDPOINTS.SELLER.STORE, {
        headers: { 'X-Bypass-Toast': 'true' },
      });
      return resp?.data ?? resp;
    } catch (error: any) {
      // 404 = store not created yet
      // 403 = seller not approved (cannot have a store yet)
      // 412 / 428 = precondition: seller profile incomplete
      const NO_STORE_CODES = [403, 404, 412, 428];
      if (NO_STORE_CODES.includes(error?.statusCode)) return null;
      throw error;
    }
  },

  checkStoreExists: async (): Promise<boolean> => {
    try {
      const { data: resp } = await apiClient.get<any>(`${API_ENDPOINTS.SELLER.STORE}/exists`, {
        headers: { 'X-Bypass-Toast': 'true' },
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
    const { data: resp } = await apiClient.post<any>(API_ENDPOINTS.SELLER.STORE, storeData);
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
    const { data: resp } = await apiClient.get<any>(API_ENDPOINTS.SELLER.PRODUCTS, {
      params,
      headers: { 'X-Bypass-Toast': 'true' },
    });
    return resp?.data ?? resp;
  },

  createProduct: async (productData: Partial<ProductDTO>): Promise<ProductDTO> => {
    const { data: resp } = await apiClient.post<any>(API_ENDPOINTS.SELLER.PRODUCTS, productData);
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

  // SECURITY: these three functions previously fell back to a pure
  // client-side regex format check — presented to the UI as `verified: true`
  // — whenever the real verification endpoint returned 404. A PAN/GSTIN/
  // Aadhaar number merely LOOKING correctly formatted is not the same as it
  // being verified against the government registry, which is the entire
  // point of a KYC gate on a marketplace seller. That fallback also added an
  // artificial 800ms delay specifically to make the fake check look like a
  // real network verification call. If the backend verification route is
  // unavailable for any reason, this MUST fail closed (report "could not
  // verify," never a fabricated pass) rather than silently downgrading a
  // compliance control to a format check.
  verifyPan: async (panNumber: string, options: RequestOptions = {}): Promise<{ verified: boolean; message?: string }> => {
    const { data } = await apiClient.post('/api/v1/sellers/verify/pan', { panNumber }, {
      signal: options.signal,
      headers: {
        'X-Bypass-Toast': 'true',
      },
    });
    return data?.data ?? data;
  },

  verifyGstin: async (gstin: string, options: RequestOptions = {}): Promise<{ verified: boolean; message?: string }> => {
    const { data } = await apiClient.post('/api/v1/sellers/verify/gstin', { gstin }, {
      signal: options.signal,
      headers: {
        'X-Bypass-Toast': 'true',
      },
    });
    return data?.data ?? data;
  },

  verifyAadhar: async (aadhar: string, options: RequestOptions = {}): Promise<{ verified: boolean; message?: string }> => {
    const { data } = await apiClient.post('/api/v1/sellers/verify/aadhar', { aadhar }, {
      signal: options.signal,
      headers: {
        'X-Bypass-Toast': 'true',
      },
    });
    return data?.data ?? data;
  },
};
