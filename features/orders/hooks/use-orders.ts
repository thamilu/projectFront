import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderApi } from '../api/order-api';
import { PageRequest, CreateOrderRequest, OrderFilters } from '@/types';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

// Time Complexity: O(1) for hook setup, O(n) for order operations where n is orders/items count
// Space Complexity: O(n) where n is number of orders
export function useOrders(params: PageRequest & OrderFilters) {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: () => orderApi.getOrders(params),
  });
}

// Time Complexity: O(1)
// Space Complexity: O(n) where n is order items count
export function useOrder(id: number) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => orderApi.getOrderById(id),
    enabled: !!id,
  });
}

// Time Complexity: O(1)
// Space Complexity: O(n)
export function useOrderByNumber(orderNumber: string) {
  return useQuery({
    queryKey: ['order', 'number', orderNumber],
    queryFn: () => orderApi.getOrderByNumber(orderNumber),
    enabled: !!orderNumber,
  });
}

// Time Complexity: O(1) for hook
// Space Complexity: O(n) where n is order items
export function useCreateOrder() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (orderData: CreateOrderRequest) => orderApi.createOrder(orderData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Order placed successfully');
      router.push(`/orders/${data.id}`);
    },
    onError: () => {
      toast.error('Failed to create order');
    },
  });
}

// Time Complexity: O(1)
// Space Complexity: O(1)
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: import('@/types').OrderStatus }) =>
      orderApi.updateOrderStatus(id, { orderStatus: status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order status updated');
    },
    onError: () => {
      toast.error('Failed to update order status');
    },
  });
}

// Time Complexity: O(1)
// Space Complexity: O(1)
export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: number) => orderApi.cancelOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order cancelled successfully');
    },
    onError: () => {
      toast.error('Failed to cancel order');
    },
  });
}
