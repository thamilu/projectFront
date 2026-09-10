import { cache } from 'react';
import { apiClient } from '@/core/client';
import { API_ENDPOINTS } from '@/shared/constants/api/endpoints';
import type { ApiResponse } from '@/shared/types/api';
import type { PageResponse, StoreDTO } from '@/shared/types';

/**
 * Public storefront directory API — browsing seller stores as a visitor.
 * Distinct from sellerApi (domains/seller/infrastructure/api/seller-api.ts),
 * which is the authenticated seller's self-service API for managing their
 * own store; this is the read-only public-facing counterpart.
 *
 * Both methods are wrapped in React's cache() because app/(public)/stores/
 * and app/(public)/stores/[id]/ each call their loader from both
 * generateMetadata() and the page body — cache() dedupes that to one
 * network round trip per request instead of two.
 */
export const publicStoreApi = {
  list: cache(
    async (page = 0, size = 24): Promise<PageResponse<StoreDTO>> => {
      const { data: response } = await apiClient.get<ApiResponse<PageResponse<StoreDTO>>>(
        API_ENDPOINTS.STORES.LIST,
        { params: { page, size } }
      );
      return (
        response?.data ?? {
          content: [],
          totalElements: 0,
          totalPages: 0,
          number: page,
          size,
          first: page === 0,
          last: true,
        }
      );
    }
  ),

  getById: cache(async (id: string): Promise<StoreDTO | null> => {
    try {
      const { data: response } = await apiClient.get<ApiResponse<StoreDTO>>(
        API_ENDPOINTS.STORES.DETAIL(id)
      );
      return response?.data ?? null;
    } catch (error) {
      const err = error as { statusCode?: number };
      if (err?.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }),
};
