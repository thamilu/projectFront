/**
 * Orders API Service
 */

import { apiClient } from '../axios';
import { unwrapData } from './utils';
import type { OrderDTO, OrderStatus, PaginatedResponse, ApiResponse } from '@/types';

const ORDERS_BASE = '/api/orders';

export interface CreateOrderRequest {
  cartId: number;
  shippingAddress: string;
  billingAddress?: string;
  phone: string;
  notes?: string;
}

export const ordersApi = {
  /**
   * Create new order
   * POST /api/orders
   */
  create: async (data: CreateOrderRequest): Promise<OrderDTO> => {
    const response = await apiClient.post<ApiResponse<OrderDTO>>(ORDERS_BASE, data);
    return unwrapData(response);
  },

  /**
   * Get order by ID
   * GET /api/orders/{id}
   */
  getById: async (id: number): Promise<OrderDTO> => {
    const response = await apiClient.get<ApiResponse<OrderDTO>>(`${ORDERS_BASE}/${id}`);
    return unwrapData(response);
  },

  /**
   * Get order by order number
   * GET /api/orders/number/{orderNumber}
   */
  getByNumber: async (orderNumber: string): Promise<OrderDTO> => {
    const response = await apiClient.get<ApiResponse<OrderDTO>>(
      `${ORDERS_BASE}/number/${orderNumber}`
    );
    return unwrapData(response);
  },

  /**
   * Get current user's orders
   * GET /api/orders/my-orders
   */
  getMyOrders: async (params?: { page?: number; size?: number }): Promise<PaginatedResponse<OrderDTO>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<OrderDTO>>>(
      `${ORDERS_BASE}/my-orders`,
      { params }
    );
    return unwrapData(response);
  },

  /**
   * Get all orders (Admin)
   * GET /api/orders
   */
  getAll: async (params?: { page?: number; size?: number }): Promise<PaginatedResponse<OrderDTO>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<OrderDTO>>>(
      ORDERS_BASE,
      { params }
    );
    return unwrapData(response);
  },

  /**
   * Get orders by status
   * GET /api/orders/status/{status}
   */
  getByStatus: async (
    status: OrderStatus,
    params?: { page?: number; size?: number }
  ): Promise<PaginatedResponse<OrderDTO>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<OrderDTO>>>(
      `${ORDERS_BASE}/status/${status}`,
      { params }
    );
    return response.data.data!;
  },

  /**
   * Get shop orders (Seller/Admin)
   * GET /api/orders/shop/{shopId}
   */
  getByShop: async (
    shopId: number,
    params?: { page?: number; size?: number }
  ): Promise<PaginatedResponse<OrderDTO>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<OrderDTO>>>(
      `${ORDERS_BASE}/shop/${shopId}`,
      { params }
    );
    return response.data.data!;
  },

  /**
   * Update order status
   * PUT /api/orders/{orderId}/status
   */
  updateStatus: async (orderId: number, status: OrderStatus): Promise<OrderDTO> => {
    const response = await apiClient.put<ApiResponse<OrderDTO>>(
      `${ORDERS_BASE}/${orderId}/status`,
      { status }
    );
    return unwrapData(response);
  },

  /**
   * Assign delivery agent
   * PUT /api/orders/{orderId}/assign-delivery-agent
   */
  assignDeliveryAgent: async (orderId: number, agentId: number): Promise<OrderDTO> => {
    const response = await apiClient.put<ApiResponse<OrderDTO>>(
      `${ORDERS_BASE}/${orderId}/assign-delivery-agent`,
      { agentId }
    );
    return unwrapData(response);
  },

  /**
   * Get delivery agent's deliveries
   * GET /api/orders/delivery/my-deliveries
   */
  getMyDeliveries: async (params?: { page?: number; size?: number }): Promise<PaginatedResponse<OrderDTO>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<OrderDTO>>>(
      `${ORDERS_BASE}/delivery/my-deliveries`,
      { params }
    );
    return unwrapData(response);
  },
};
