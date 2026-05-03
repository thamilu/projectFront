/**
 * Cart API Service
 */

import { apiClient } from '../axios';
import type { CartDTO, ApiResponse } from '@/types';

const CART_BASE = '/api/cart';

export interface AddToCartRequest {
  productId: number;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export const cartApi = {
  /**
   * Get current user's cart
   * GET /api/cart
   */
  getCart: async (): Promise<CartDTO> => {
    const response = await apiClient.get<ApiResponse<CartDTO>>(CART_BASE);
    return response.data.data!;
  },

  /**
   * Add item to cart
   * POST /api/cart/items
   */
  addItem: async (data: AddToCartRequest): Promise<CartDTO> => {
    const response = await apiClient.post<ApiResponse<CartDTO>>(
      `${CART_BASE}/items`,
      data
    );
    return response.data.data!;
  },

  /**
   * Update cart item quantity
   * PUT /api/cart/items/{itemId}
   */
  updateItem: async (itemId: number, data: UpdateCartItemRequest): Promise<CartDTO> => {
    const response = await apiClient.put<ApiResponse<CartDTO>>(
      `${CART_BASE}/items/${itemId}`,
      data
    );
    return response.data.data!;
  },

  /**
   * Remove item from cart
   * DELETE /api/cart/items/{itemId}
   */
  removeItem: async (itemId: number): Promise<CartDTO> => {
    const response = await apiClient.delete<ApiResponse<CartDTO>>(
      `${CART_BASE}/items/${itemId}`
    );
    return response.data.data!;
  },

  /**
   * Clear entire cart
   * DELETE /api/cart/clear
   */
  clearCart: async (): Promise<void> => {
    await apiClient.delete(`${CART_BASE}/clear`);
  },
};
