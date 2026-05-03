import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderApi } from '@/features/orders/api/order-api';
import { queryKeys } from '@/lib/query-keys';
import { withDefaults } from '@/lib/utils/pagination';
import {
  OrderDTO,
  PageResponse,
  PageRequest,
  CreateOrderRequest,
  UpdateOrderStatusRequest,
  UpdatePaymentStatusRequest,
  OrderFilters,
} from '@/types';

export function useOrders(params?: PageRequest & OrderFilters) {
  const p = withDefaults<PageRequest & OrderFilters>(params);

  return useQuery<PageResponse<OrderDTO>>({
    queryKey: queryKeys.orders.list(p),
    queryFn: () => orderApi.getOrders(p),
    enabled: true,
  });
}

export function useOrder(id: number) {
  return useQuery<OrderDTO>({
    queryKey: queryKeys.orders.detail(id),
    queryFn: () => orderApi.getOrderById(id),
    enabled: !!id,
  });
}

export function useOrderByNumber(orderNumber: string) {
  return useQuery<OrderDTO>({
    queryKey: queryKeys.orders.detail(orderNumber),
    queryFn: () => orderApi.getOrderByNumber(orderNumber),
    enabled: !!orderNumber,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation<OrderDTO, unknown, CreateOrderRequest>({
    mutationFn: (orderData) => orderApi.createOrder(orderData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.list({ page: 0, size: 10 }) });
    },
  });
}

export function useUpdateOrderStatus(id: number) {
  const queryClient = useQueryClient();
  return useMutation<OrderDTO, unknown, UpdateOrderStatusRequest>({
    mutationFn: (statusData) => orderApi.updateOrderStatus(id, statusData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(id) });
    },
  });
}

export function useUpdatePaymentStatus(id: number) {
  const queryClient = useQueryClient();
  return useMutation<OrderDTO, unknown, UpdatePaymentStatusRequest>({
    mutationFn: (paymentData) => orderApi.updatePaymentStatus(id, paymentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(id) });
    },
  });
}
