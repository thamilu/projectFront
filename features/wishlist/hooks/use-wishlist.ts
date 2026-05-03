/**
 * Wishlist Hook
 * @module features/wishlist/hooks/use-wishlist
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wishlistApi } from '../api/wishlist-api';

export function useWishlist() {
  const queryClient = useQueryClient();

  const { data: wishlist, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: wishlistApi.getWishlist,
  });

  const addMutation = useMutation({
    mutationFn: wishlistApi.addToWishlist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: wishlistApi.removeFromWishlist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });

  return {
    wishlist,
    isLoading,
    addToWishlist: addMutation.mutate,
    removeFromWishlist: removeMutation.mutate,
  };
}
