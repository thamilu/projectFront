import apiClient from '@/lib/axios';
import {
  OrderDTO,
  PageResponse,
  PageRequest,
  CreateOrderRequest,
  UpdateOrderStatusRequest,
  UpdatePaymentStatusRequest,
  OrderFilters,
} from '@/types';

// Time Complexity: O(1) - single HTTP request
// Space Complexity: O(n) where n is number of orders/items
export const orderApi = {
  createOrder: async (orderData: CreateOrderRequest): Promise<OrderDTO> => {
    const { data } = await apiClient.post<OrderDTO>('/orders', orderData);
    return data;
  },

  getOrders: async (params: PageRequest & OrderFilters): Promise<PageResponse<OrderDTO>> => {
    const { data } = await apiClient.get<PageResponse<OrderDTO>>('/orders', { params });
    return data;
  },

  getOrderById: async (id: number): Promise<OrderDTO> => {
    const { data } = await apiClient.get<OrderDTO>(`/orders/${id}`);
    return data;
  },

  getOrderByNumber: async (orderNumber: string): Promise<OrderDTO> => {
    const { data } = await apiClient.get<OrderDTO>(`/orders/number/${orderNumber}`);
    return data;
  },

  updateOrderStatus: async (
    id: number,
    statusData: UpdateOrderStatusRequest
  ): Promise<OrderDTO> => {
    const { data } = await apiClient.patch<OrderDTO>(`/orders/${id}/status`, statusData);
    return data;
  },

  updatePaymentStatus: async (
    id: number,
    paymentData: UpdatePaymentStatusRequest
  ): Promise<OrderDTO> => {
    const { data } = await apiClient.patch<OrderDTO>(`/orders/${id}/payment`, paymentData);
    return data;
  },

  cancelOrder: async (id: number): Promise<OrderDTO> => {
    const { data } = await apiClient.post<OrderDTO>(`/orders/${id}/cancel`);
    return data;
  },
};
