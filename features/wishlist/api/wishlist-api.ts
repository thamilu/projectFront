/**
 * Wishlist API
 * @module features/wishlist/api/wishlist-api
 */

import { apiClient } from '@/lib/http/services';

export const wishlistApi = {
  // TODO: Implement wishlist API methods
  getWishlist: async () => {
    return apiClient.get('/wishlist');
  },
  
  addToWishlist: async (productId: string) => {
    return apiClient.post('/wishlist', { productId });
  },
  
  removeFromWishlist: async (productId: string) => {
    return apiClient.delete(`/wishlist/${productId}`);
  },
};
