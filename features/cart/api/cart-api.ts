import apiClient from '@/lib/axios';
import { CartDTO } from '@/types';

// Time Complexity: O(1) - single HTTP request
// Space Complexity: O(n) where n is number of cart items
export const cartApi = {
  getCart: async (): Promise<CartDTO> => {
    const { data } = await apiClient.get<CartDTO>('/cart');
    return data;
  },

  addToCart: async (productId: number, quantity: number): Promise<CartDTO> => {
    const { data } = await apiClient.post<CartDTO>('/cart/items', {
      productId,
      quantity,
    });
    return data;
  },

  updateCartItem: async (itemId: number, quantity: number): Promise<CartDTO> => {
    const { data } = await apiClient.put<CartDTO>(`/cart/items/${itemId}`, {
      quantity,
    });
    return data;
  },

  removeCartItem: async (itemId: number): Promise<CartDTO> => {
    const { data } = await apiClient.delete<CartDTO>(`/cart/items/${itemId}`);
    return data;
  },

  clearCart: async (): Promise<void> => {
    await apiClient.delete('/cart');
  },
};
