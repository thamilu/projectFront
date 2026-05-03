import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cartApi } from '@/features/cart/api/cart-api';
import { queryKeys } from '@/lib/query-keys';
import { CartDTO } from '@/types';

export function useCart() {
  return useQuery<CartDTO>({
    queryKey: queryKeys.cart.detail(),
    queryFn: () => cartApi.getCart(),
    enabled: true,
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();
  return useMutation<CartDTO, unknown, { productId: number; quantity: number }>({
    mutationFn: ({ productId, quantity }) => cartApi.addToCart(productId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.detail() });
    },
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  return useMutation<CartDTO, unknown, { itemId: number; quantity: number }>({
    mutationFn: ({ itemId, quantity }) => cartApi.updateCartItem(itemId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.detail() });
    },
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();
  return useMutation<CartDTO, unknown, { itemId: number }>({
    mutationFn: ({ itemId }) => cartApi.removeCartItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.detail() });
    },
  });
}

export function useClearCart() {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, void>({
    mutationFn: () => cartApi.clearCart(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.detail() });
    },
  });
}
