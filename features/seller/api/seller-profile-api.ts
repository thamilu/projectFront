import apiClient from '@/lib/axios';
import { API_ENDPOINTS } from '@/constants/api/endpoints';
import type { SellerProfile, SellerOnboardingRequest } from '@/features/seller/types';
import { logger } from '@/lib/observability/logger';

/**
 * Seller Profile API (KYC/onboarding profile)
 *
 * Uses the shared axios client which injects NextAuth access tokens.
 */
export const sellerProfileApi = {
  getMyProfile: async (): Promise<SellerProfile | null> => {
    try {
      const response = await apiClient.get<unknown>(API_ENDPOINTS.SELLERS.PROFILE);
      const responseData = (response as { data?: unknown }).data;
      // Unwrap ApiResponse<T> if present.
      if (responseData && typeof responseData === 'object' && 'data' in responseData) {
        return (responseData as { data: SellerProfile | null }).data;
      }
      return responseData as SellerProfile;
    } catch (error: any) {
      const status = error?.status || error?.response?.status;
      // Distinguish between Not Found (404) and Forbidden (403/Sync issue)
      if (status === 404) return null;

      logger.error('[sellerProfileApi.getMyProfile] failed', {
        message: error?.message || error?.response?.data?.message,
        status,
      });
      throw error;
    }
  },

  profileExists: async (): Promise<boolean> => {
    try {
      const response = await apiClient.get<unknown>(API_ENDPOINTS.SELLERS.PROFILE_EXISTS);
      const responseData = (response as { data?: unknown }).data;

      // If response is wrapped in ApiResponse<T>
      if (responseData && typeof responseData === 'object' && 'data' in responseData) {
        const innerData = (responseData as { data?: unknown }).data;
        return typeof innerData === 'boolean' ? innerData : Boolean(innerData);
      }

      // Direct boolean or truthy value
      return typeof responseData === 'boolean' ? responseData : Boolean(responseData);
    } catch (error: any) {
      const status = error?.status || error?.response?.status;
      // 404 explicitly means it does not exist
      if (status === 404) return false;
      // For other errors (500, etc.), we don't assume it exists
      return false;
    }
  },

  updateProfile: async (data: Partial<SellerOnboardingRequest>): Promise<SellerProfile> => {
    const response = await apiClient.put<unknown>(API_ENDPOINTS.SELLERS.PROFILE, data);
    const responseData = (response as { data?: unknown }).data;
    if (responseData && typeof responseData === 'object' && 'data' in responseData) {
      return (responseData as { data: SellerProfile }).data;
    }
    return responseData as SellerProfile;
  },
};
