/**
 * Wishlist API
 * @module features/wishlist/api/wishlist-api
 */

import { apiClient } from '@/core/client';
import { API_ENDPOINTS } from '@/shared/constants/api/endpoints';
import type { PageResponse } from '@/shared/types';
import type { WishlistItemDTO } from '@/domains/wishlist/contracts/wishlist.types';

// The backend wraps the paginated wishlist in a { data: PageResponse<...> }
// envelope — matched here so callers (use-wishlist.ts, the wishlist page)
// no longer need an `as any` cast to reach `.data.content`.
export interface WishlistResponse {
  data: PageResponse<WishlistItemDTO>;
}

export const wishlistApi = {
  // X-Bypass-Toast: this is a passive, ambient background read (the header
  // wishlist badge, every product card's heart-icon state) — not something
  // the user explicitly asked for. If it fails, useWishlist() just falls
  // back to an empty list; there's nothing actionable for the user to do
  // with a blocking "Access Denied" toast, and since a failed query has no
  // cached data, every new component that mounts and reads ['wishlist']
  // (each product card, the header badge) retries it independently —
  // without this, a single persistent backend failure fires one toast per
  // mount instead of one, or none.
  getWishlist: async (): Promise<WishlistResponse> => {
    const { data } = await apiClient.get<WishlistResponse>(API_ENDPOINTS.WISHLIST.GET, {
      headers: { 'X-Bypass-Toast': 'true' },
    });
    return data;
  },

  addToWishlist: async (productId: string | number): Promise<WishlistItemDTO> => {
    const { data } = await apiClient.post<WishlistItemDTO>(API_ENDPOINTS.WISHLIST.ADD, {
      productId: Number(productId),
    });
    return data;
  },

  removeFromWishlist: async (productId: string | number): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.WISHLIST.REMOVE(String(productId)));
  },
};
