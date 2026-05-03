/**
 * Wishlist API
 * @module features/wishlist/api/wishlist-api
 */

import apiClient from '@/lib/axios';

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
