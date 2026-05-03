/**
 * Wishlist API Service
 */

import { apiClient } from '../axios';
import type { ProductDTO, ApiResponse } from '@/types';

const WISHLIST_BASE = '/api/wishlist';

export const wishlistApi = {
  add: async (productId: number): Promise<void> => {
    await apiClient.post(`${WISHLIST_BASE}/add`, { productId });
  },

  remove: async (productId: number): Promise<void> => {
    await apiClient.delete(`${WISHLIST_BASE}/remove`, { data: { productId } });
  },

  check: async (productId: number): Promise<boolean> => {
    const response = await apiClient.get<ApiResponse<boolean>>(
      `${WISHLIST_BASE}/check`,
      { params: { productId } }
    );
    return response.data.data || false;
  },

  getItems: async (userId: number): Promise<ProductDTO[]> => {
    const response = await apiClient.get<ApiResponse<ProductDTO[]>>(
      `${WISHLIST_BASE}/user/${userId}/items`
    );
    return response.data.data!;
  },

  getCount: async (userId: number): Promise<number> => {
    const response = await apiClient.get<ApiResponse<number>>(
      `${WISHLIST_BASE}/user/${userId}/count`
    );
    return response.data.data || 0;
  },

  clear: async (userId: number): Promise<void> => {
    await apiClient.delete(`${WISHLIST_BASE}/user/${userId}/clear`);
  },

  moveToCart: async (productId: number): Promise<void> => {
    await apiClient.post(`${WISHLIST_BASE}/move-to-cart`, { productId });
  },
};
