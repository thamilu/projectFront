'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { cartApi } from '../api/cart-api';
import { CartDTO } from '@/domains/cart/contracts/cart.types';
import { toast } from 'sonner';

function publishCartUpdated(cart: CartDTO | null | undefined) {
  if (!cart) return;
  import('@/platform/events')
    .then(({ eventBus }) => {
      eventBus.publish('CartUpdated', {
        cartId: String(cart.id || 'unknown'),
        itemCount: cart.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0,
        totalAmount: cart.totalAmount ?? 0,
      });
    })
    .catch((err) => {
      console.error('Failed to publish CartUpdated event', err);
    });
}

function computeItemCount(cart: CartDTO | null | undefined): number {
  return cart?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
}

/**
 * Single source of truth for cart state — React Query owns the ['cart'] cache
 * entry exclusively. Every mutation writes the server's authoritative response
 * back via setQueryData so all consumers (header badge, mini-cart, cart page)
 * re-render from the same value with no separate client-side copy to drift
 * out of sync (see cart-store.ts removal — it previously duplicated this data
 * in Zustand and required a useEffect to keep the two in sync).
 *
 * Time Complexity: O(1) for hook setup, O(n) for cart operations where n is items count
 * Space Complexity: O(n) where n is number of cart items
 */
export function useCart() {
  const queryClient = useQueryClient();
  const { status } = useSession();
  const isAuthenticated = status === 'authenticated';

  // The cart endpoint is authenticated-only. This hook is called from
  // components that render for every visitor regardless of auth state (the
  // header cart button/badge, product cards) — without `enabled` here, a
  // guest would trigger a guaranteed-403 request on every page load, which
  // a global interceptor turns into a visible "Access Denied" toast for
  // something the user never asked to do.
  const { data, isLoading, error } = useQuery({
    queryKey: ['cart'],
    queryFn: cartApi.getCart,
    enabled: isAuthenticated,
  });

  // Cross-device cart sync: a single app-wide useCartSync() subscription
  // (see CartSyncListener in core/providers) dispatches a 'cart:sync' window
  // event over WebSocket when the cart changes from another device/tab.
  // Every useCart() consumer listens for it and invalidates its cache entry
  // — cheap and idempotent even with many consumers mounted at once (e.g. a
  // product grid). useCartSync() itself is deliberately NOT called here:
  // useCart() mounts once per product card on a listing page, and each
  // mount would open its own WebSocket subscription and fire its own "cart
  // updated" toast — one shared subscription avoids that duplication.
  useEffect(() => {
    if (!isAuthenticated) return;
    const handleSync = () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    };
    window.addEventListener('cart:sync', handleSync);
    return () => window.removeEventListener('cart:sync', handleSync);
  }, [isAuthenticated, queryClient]);

  const addToCartMutation = useMutation({
    mutationFn: ({ productId, quantity }: { productId: number; quantity: number; silent?: boolean }) =>
      cartApi.addToCart(productId, quantity),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(['cart'], data);
      // `silent` lets bulk callers (e.g. wishlist's "Move all to cart") add
      // several items without a toast per item, then show one aggregated
      // summary themselves — the default single-item call path is unchanged.
      if (!variables.silent) toast.success('Item added to cart');
      publishCartUpdated(data);
    },
    onError: (_err, variables) => {
      if (!variables.silent) toast.error('Failed to add item to cart');
    },
  });

  const updateCartItemMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: number; quantity: number }) =>
      cartApi.updateCartItem(itemId, quantity),
    onSuccess: (data) => {
      queryClient.setQueryData(['cart'], data);
      publishCartUpdated(data);
    },
    onError: () => {
      toast.error('Failed to update cart item');
    },
  });

  const removeCartItemMutation = useMutation({
    mutationFn: (itemId: number) => cartApi.removeCartItem(itemId),
    onSuccess: (data) => {
      queryClient.setQueryData(['cart'], data);
      toast.success('Item removed from cart');
      publishCartUpdated(data);
    },
    onError: () => {
      toast.error('Failed to remove item from cart');
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: cartApi.clearCart,
    onSuccess: () => {
      queryClient.setQueryData(['cart'], null);
      toast.success('Cart cleared');
    },
    onError: () => {
      toast.error('Failed to clear cart');
    },
  });

  return {
    cart: data ?? null,
    isLoading,
    error,
    itemCount: computeItemCount(data),
    total: data?.totalAmount ?? 0,
    addToCart: addToCartMutation.mutate,
    // Awaitable variant for bulk operations that need to know per-item
    // success/failure to build a single aggregated result (see wishlist
    // page's "Move all to cart" bulk action).
    addToCartAsync: addToCartMutation.mutateAsync,
    updateCartItem: updateCartItemMutation.mutate,
    removeCartItem: removeCartItemMutation.mutate,
    clearCart: clearCartMutation.mutate,
    isAdding: addToCartMutation.isPending,
    isUpdating: updateCartItemMutation.isPending,
    isRemoving: removeCartItemMutation.isPending,
  };
}
