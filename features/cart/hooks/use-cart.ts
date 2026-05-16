import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { cartApi } from '../api/cart-api';
import { useCartStore } from '@/features/cart/store/cart-store';
import { toast } from 'sonner';

// Time Complexity: O(1) for hook setup, O(n) for cart operations where n is items count
// Space Complexity: O(n) where n is number of cart items
export function useCart() {
  const queryClient = useQueryClient();
  const { cart, setCart, getItemCount, getTotal } = useCartStore();

  // Time Complexity: O(1) - single API call
  // Space Complexity: O(n) where n is cart items
  const { data, isLoading, error } = useQuery({
    queryKey: ['cart'],
    queryFn: cartApi.getCart,
  });

  // Sync query data → Zustand store AFTER render (never during render)
  useEffect(() => {
    if (data && data !== cart) {
      setCart(data);
    }
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  // Time Complexity: O(1) - single API call
  // Space Complexity: O(n)
  const addToCartMutation = useMutation({
    mutationFn: ({ productId, quantity }: { productId: number; quantity: number }) =>
      cartApi.addToCart(productId, quantity),
    onSuccess: (data) => {
      setCart(data);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Item added to cart');
    },
    onError: () => {
      toast.error('Failed to add item to cart');
    },
  });

  // Time Complexity: O(1) - single API call
  // Space Complexity: O(n)
  const updateCartItemMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: number; quantity: number }) =>
      cartApi.updateCartItem(itemId, quantity),
    onSuccess: (data) => {
      setCart(data);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: () => {
      toast.error('Failed to update cart item');
    },
  });

  // Time Complexity: O(1) - single API call
  // Space Complexity: O(n)
  const removeCartItemMutation = useMutation({
    mutationFn: (itemId: number) => cartApi.removeCartItem(itemId),
    onSuccess: (data) => {
      setCart(data);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Item removed from cart');
    },
    onError: () => {
      toast.error('Failed to remove item from cart');
    },
  });

  // Time Complexity: O(1) - single API call
  // Space Complexity: O(1)
  const clearCartMutation = useMutation({
    mutationFn: cartApi.clearCart,
    onSuccess: () => {
      setCart(null);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Cart cleared');
    },
  });

  return {
    cart: cart || data,
    isLoading,
    error,
    itemCount: getItemCount(),
    total: getTotal(),
    addToCart: addToCartMutation.mutate,
    updateCartItem: updateCartItemMutation.mutate,
    removeCartItem: removeCartItemMutation.mutate,
    clearCart: clearCartMutation.mutate,
    isAdding: addToCartMutation.isPending,
    isUpdating: updateCartItemMutation.isPending,
    isRemoving: removeCartItemMutation.isPending,
  };
}
