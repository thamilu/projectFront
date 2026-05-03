/**
 * Seller API Client
 *
 * API methods for seller operations
 */

import { apiClient } from '@/lib/axios';
import { logger } from '@/lib/observability/logger';
import { API_ENDPOINTS } from '@/constants/api/endpoints';
import { sellerProfileApi } from '@/features/seller/api/seller-profile-api';
import type { SellerOnboardingRequest, SellerOnboardingResponse, SellerProfile } from './types';

interface ApiResponse<T> {
  success: boolean;
  message: string | null;
  data: T;
}

/**
 * Register a new seller (onboard user as seller)
 */
export async function registerSeller(
  data: SellerOnboardingRequest,
  accessToken?: string
): Promise<SellerOnboardingResponse> {
  try {
    // Transform frontend data to match backend DTO
    // Transform frontend data to match backend DTO
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawData = data as any;
    const payload: any = {
      ...data,
      accountNumber: rawData.bankAccountNumber,
      ifscCode: rawData.bankIfscCode,
      aadhar: rawData.aadhaar,

      // Sanitize optional fields to convert "" to undefined
      businessName: rawData.businessName || undefined,
      taxId: rawData.taxId || undefined,
      description: rawData.description || undefined,
      businessPan: rawData.businessPan || undefined,
      registrationProof: rawData.registrationProof || undefined,
      authorizedSignatory: rawData.authorizedSignatory || undefined,
      pan: rawData.pan || undefined,
    };

    // Always hit the Next.js onboarding proxy so the token is read from
    // the NextAuth session cookie (prevents "no response" when accessToken
    // is not explicitly passed from the client).
    const { safeFetch } = await import('@/lib/utils/fetch-utils');
    const responseData = await safeFetch<any>('/api/onboarding/seller', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    // Unwrap ApiResponse if present
    if (responseData.success && responseData.data) {
      return responseData.data;
    }

    return responseData;
  } catch (error: any) {
    // apiClient interceptor already transforms errors, but handle common 'already exists' case
    const status = error.response?.status;
    const detail = error.response?.data?.detail || error.response?.data?.message || error.message;

    if (
      status === 400 &&
      typeof detail === 'string' &&
      detail.includes('already has a seller profile')
    ) {
      logger.warn('Registration returned 400: profile exists. Fetching existing profile...');
      try {
        if (accessToken) {
          const existing = await sellerProfileApi.getMyProfile();
          if (existing) {
            return existing as unknown as SellerOnboardingResponse;
          }
        }
        // If profile couldn't be fetched, fall through to logging the original error
      } catch (fetchErr) {
        logger.error('Failed to fetch existing seller profile after registration 400', {
          fetchError: fetchErr,
        });
      }
    }

    logger.error('Seller registration failed', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
}

/**
 * Backwards-compatible wrapper for role-upgrade terminology. New callers should use `upgradeToSeller`.
 */
export async function upgradeToSeller(
  data: SellerOnboardingRequest,
  accessToken?: string
): Promise<SellerOnboardingResponse> {
  return registerSeller(data, accessToken);
}

/**
 * Update seller profile
 */
export async function updateSellerProfile(
  data: Partial<SellerOnboardingRequest>,
  accessToken: string
): Promise<SellerProfile> {
  try {
    // Transform frontend data to match backend DTO
    // Transform frontend data to match backend DTO
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawData = data as any;
    const payload: any = {
      ...data,
      accountNumber: rawData.bankAccountNumber,
      ifscCode: rawData.bankIfscCode,
      aadhar: rawData.aadhaar,

      // Sanitize optional fields
      businessName: rawData.businessName || undefined,
      taxId: rawData.taxId || undefined,
      description: rawData.description || undefined,
      businessPan: rawData.businessPan || undefined,
      registrationProof: rawData.registrationProof || undefined,
      authorizedSignatory: rawData.authorizedSignatory || undefined,
      pan: rawData.pan || undefined,
    };

    const response = await apiClient.put<ApiResponse<SellerProfile>>(
      API_ENDPOINTS.SELLERS.PROFILE,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        // Keep validateStatus to default or custom as needed
      }
    );

    // Check if response is wrapped in ApiResponse structure
    if (response.data && (response.data as any).success && (response.data as any).data) {
      return (response.data as any).data;
    }

    // Or if it returns direct data
    return response.data as unknown as SellerProfile;
  } catch (error: any) {
    logger.error('Failed to update seller profile', { error });
    throw error;
  }
}
