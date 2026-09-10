import { apiClient } from '@/core/client';
import { API_ENDPOINTS } from '@/shared/constants/api/endpoints';
import { AppError } from '@/core/http/errors';
import { logger } from '@/core/telemetry/logger';
import type { ApiResponse } from '@/shared/types/api';
import type { SellerProfile } from '@/features/seller/types';

export type SellerOnboardingStatus = 'IDLE' | 'PENDING' | 'SUCCESS';

export const STATUS_MAP: Record<string, SellerOnboardingStatus> = {
  ACTIVE: 'SUCCESS',
  PENDING: 'PENDING',
} as const;

async function checkProfileExists(): Promise<boolean> {
  try {
    const { data } = await apiClient.get<ApiResponse<boolean>>(
      API_ENDPOINTS.SELLER.PROFILE_EXISTS,
      {
        headers: { 'X-Bypass-Toast': 'true' },
      }
    );
    // Support either response wrap formats (resp.data or raw data)
    const exists = data?.data ?? (data as any);
    return exists === true;
  } catch {
    return false;
  }
}

async function fetchSellerStatus(): Promise<SellerOnboardingStatus> {
  const { data: response } = await apiClient.get<ApiResponse<SellerProfile>>(
    API_ENDPOINTS.SELLER.PROFILE,
    {
      cache: 'no-store', // explicit — never cache user-specific data
      headers: {
        'Cache-Control': 'no-store',
        'X-Bypass-Toast': 'true',
      },
    } as any
  );

  const profile = response?.data ?? (response as any);
  const rawStatus = profile?.status ? String(profile.status).toUpperCase() : null;

  return STATUS_MAP[rawStatus ?? ''] ?? 'IDLE';
}

/**
 * Checks and returns the seller onboarding status for the user.
 *
 * - Unauthenticated users default to 'IDLE'.
 * - ACTIVE profile resolves to 'SUCCESS'.
 * - PENDING profile or exists resolves to 'PENDING'.
 * - Any other state resolves to 'IDLE'.
 */
export async function getSellerOnboardingStatus(
  isAuthenticated: boolean
): Promise<SellerOnboardingStatus> {
  if (!isAuthenticated) return 'IDLE';

  try {
    return await fetchSellerStatus();
  } catch (error: any) {
    const err = error as AppError;

    logger.warn('[SellerOnboarding] Status check failed:', {
      statusCode: err?.statusCode,
      code: err?.code,
      message: err?.message,
    });

    if (err?.statusCode === 404) {
      const exists = await checkProfileExists();
      return exists ? 'PENDING' : 'IDLE';
    }

    return 'IDLE';
  }
}
