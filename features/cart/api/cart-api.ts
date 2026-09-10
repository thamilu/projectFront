import { apiClient } from '@/core/client';
import { API_ENDPOINTS } from '@/shared/constants/api/endpoints';
import { CartDTO } from '@/domains/cart/contracts/cart.types';

// Time Complexity: O(1) - single HTTP request
// Space Complexity: O(n) where n is number of cart items
export const cartApi = {
  // X-Bypass-Toast: ambient background read (header cart badge, cart
  // preview) — not a user-initiated action. See wishlist-api.ts's
  // getWishlist for the full reasoning (same pattern, same failure mode).
  getCart: async (): Promise<CartDTO> => {
    const { data } = await apiClient.get<CartDTO>(API_ENDPOINTS.CART.GET, {
      headers: { 'X-Bypass-Toast': 'true' },
    });
    return data;
  },

  addToCart: async (productId: number, quantity: number): Promise<CartDTO> => {
    const { data } = await apiClient.post<CartDTO>(API_ENDPOINTS.CART.ADD, {
      productId,
      quantity,
    });
    return data;
  },

  updateCartItem: async (itemId: number, quantity: number): Promise<CartDTO> => {
    const { data } = await apiClient.put<CartDTO>(API_ENDPOINTS.CART.UPDATE(String(itemId)), {
      quantity,
    });
    return data;
  },

  removeCartItem: async (itemId: number): Promise<CartDTO> => {
    const { data } = await apiClient.delete<CartDTO>(API_ENDPOINTS.CART.REMOVE(String(itemId)));
    return data;
  },

  clearCart: async (): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.CART.CLEAR);
  },
};
