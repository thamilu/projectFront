/**
 * Custom hook for wishlist toggle functionality
 * Provides optimized wishlist state management with memoization
 */

import { useCallback, useMemo } from 'react';
import { useWishlistStore } from '@/store/wishlist-store';
import { ProductDTO } from '@/types';

interface WishlistItemInput {
  productId: number;
  name: string;
  price: number;
  originalPrice: number;
  image: string;
  category: string;
  rating: number;
  reviews: number;
  inStock: boolean;
  priceDropAlert: boolean;
}

export function useWishlistToggle(product: ProductDTO) {
  const wishlists = useWishlistStore((state) => state.wishlists);
  const addItem = useWishlistStore((state) => state.addItemToWishlist);
  const removeItem = useWishlistStore((state) => state.removeItemFromWishlist);

  // Memoize wishlist item lookup
  const wishlistItem = useMemo(
    () => wishlists.flatMap((w) => w.items).find((i) => i.productId === product.id),
    [wishlists, product.id]
  );

  const isInWishlist = Boolean(wishlistItem);
  const defaultWishlistId = wishlists[0]?.id;

  const toggle = useCallback(async () => {
    const wishlistId = defaultWishlistId ?? crypto.randomUUID();

    if (isInWishlist && wishlistItem) {
      await removeItem(wishlistId, wishlistItem.id);
      return { action: 'removed' as const, success: true };
    } else {
      const itemData: WishlistItemInput = {
        productId: product.id,
        name: product.name,
        price: product.discountPrice ?? product.price,
        originalPrice: product.price,
        image: product.imageUrl ?? '',
        category: product.category?.name ?? '',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rating: (product as any).averageRating ?? 0, // TODO: Add to ProductDTO
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        reviews: (product as any).reviewCount ?? 0, // TODO: Add to ProductDTO
        inStock: product.stockQuantity > 0,
        priceDropAlert: false,
      };
      await addItem(wishlistId, itemData);
      return { action: 'added' as const, success: true };
    }
  }, [isInWishlist, wishlistItem, defaultWishlistId, product, addItem, removeItem]);

  return { isInWishlist, toggle };
}
