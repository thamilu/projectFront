/**
 * Wishlist Hook
 * @module features/wishlist/hooks/use-wishlist
 *
 * Single source of truth for wishlist membership — backed by the real
 * wishlistApi via React Query. See use-wishlist-toggle.ts for the
 * per-product toggle used by product cards / PDP.
 */

import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { wishlistApi } from '../api/wishlist-api';
import type { WishlistItemDTO } from '@/domains/wishlist/contracts/wishlist.types';

const EMPTY_ITEMS: WishlistItemDTO[] = [];

export function useWishlist() {
  const queryClient = useQueryClient();
  const { status } = useSession();
  const isAuthenticated = status === 'authenticated';

  // Same reasoning as useCart(): the wishlist endpoint is authenticated-only,
  // but this hook is called from components that render for every visitor
  // (header wishlist button, product cards) — without `enabled`, a guest
  // triggers a guaranteed-403 request on every page load.
  const { data: wishlist, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: wishlistApi.getWishlist,
    enabled: isAuthenticated,
  });

  const items: WishlistItemDTO[] = useMemo(
    () => wishlist?.data?.content ?? EMPTY_ITEMS,
    [wishlist]
  );

  const isInWishlist = useCallback(
    (productId: number) => items.some((item) => Number(item.productId) === productId),
    [items]
  );

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
    items,
    isLoading,
    isInWishlist,
    isMutating: addMutation.isPending || removeMutation.isPending,
    addToWishlist: addMutation.mutate,
    removeFromWishlist: removeMutation.mutate,
    // Awaitable variant for bulk operations (see wishlist page's "Clear
    // wishlist" bulk action, which needs to know per-item success/failure
    // to build a single aggregated result).
    removeFromWishlistAsync: removeMutation.mutateAsync,
  };
}
