/**
 * Custom hook for wishlist toggle functionality
 * Backed by the real wishlistApi (via useWishlist) — NOT client-only state.
 * Previously this read/wrote a local Zustand store that never reached the
 * backend, so "add to wishlist" from a product card silently diverged from
 * what /wishlist actually showed. See useWishlist for the shared cache.
 */

import { useCallback } from 'react';
import { toast } from 'sonner';
import { useWishlist } from '@/features/wishlist/hooks/use-wishlist';
import { ProductDTO } from '@/domains/catalog/contracts/catalog.types';

export function useWishlistToggle(product: ProductDTO) {
  const { isInWishlist: checkInWishlist, addToWishlist, removeFromWishlist, isMutating } =
    useWishlist();

  const isInWishlist = checkInWishlist(product.id);

  const toggle = useCallback(() => {
    if (isInWishlist) {
      removeFromWishlist(product.id, {
        onSuccess: () => toast.success('Removed from wishlist'),
        onError: () => toast.error('Failed to update wishlist'),
      });
    } else {
      addToWishlist(product.id, {
        onSuccess: () => toast.success('Added to wishlist'),
        onError: () => toast.error('Failed to update wishlist'),
      });
    }
  }, [isInWishlist, product.id, addToWishlist, removeFromWishlist]);

  return { isInWishlist, toggle, isMutating };
}
