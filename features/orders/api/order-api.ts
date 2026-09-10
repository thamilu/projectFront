import { apiClient } from '@/core/client';
import { API_ENDPOINTS } from '@/shared/constants/api/endpoints';
import { PageResponse, PageRequest } from '@/shared/types';
import { RequestOptions } from '@/core/client/types';
import {
  OrderDTO,
  CreateOrderRequest,
  UpdateOrderStatusRequest,
  UpdatePaymentStatusRequest,
  OrderFilters,
} from '@/domains/order/contracts/order.types';

/**
 * A return/refund request as submitted by a customer.
 *
 * Item-level rather than whole-order: the previous UI could only return an
 * entire order, which is wrong for any multi-item basket where one thing
 * arrived damaged.
 */
export interface CreateReturnRequest {
  reason: string;
  details?: string;
  /** Order item ids being returned. Empty means the whole order. */
  itemIds?: number[];
}

/** Backend acknowledgement, carrying the reference a customer can quote. */
export interface ReturnRequestDTO {
  id: number;
  orderId: number;
  status: string;
  reason: string;
  createdAt: string;
  /** Human-readable reference, e.g. RET-2026-00123. */
  reference?: string;
}

/** One scan/checkpoint in a shipment's journey. */
export interface TrackingEventDTO {
  status: string;
  location?: string;
  timestamp: string;
  description?: string;
  /**
   * Carrier-reported position, when available. Optional because most scans are
   * facility events with no geocode — the tracking UI renders a map only when
   * a coordinate is actually present rather than guessing one.
   */
  latitude?: number;
  longitude?: number;
}

/** Live tracking for an order, driven by the order's real status. */
export interface OrderTrackingDTO {
  orderId: number;
  /** Current fulfilment stage, matching the backend's order-status enum. */
  status: string;
  carrier?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  events: TrackingEventDTO[];
}

// Time Complexity: O(1) - single HTTP request
// Space Complexity: O(n) where n is number of orders/items
export const orderApi = {
  createOrder: async (orderData: CreateOrderRequest): Promise<OrderDTO> => {
    const { data } = await apiClient.post<OrderDTO>('/api/v1/orders', orderData);
    return data;
  },

  // `signal` threaded through so React Query can actually cancel an
  // in-flight request on unmount/param-change — without it, e.g. rapidly
  // changing an order-list filter fires N overlapping requests that all run
  // to completion, and a slower stale response can overwrite fresher data.
  getOrders: async (
    params: PageRequest & OrderFilters,
    options: RequestOptions = {}
  ): Promise<PageResponse<OrderDTO>> => {
    const { data } = await apiClient.get<PageResponse<OrderDTO>>('/api/v1/orders', {
      params,
      signal: options.signal,
    });
    return data;
  },

  getOrderById: async (id: number, options: RequestOptions = {}): Promise<OrderDTO> => {
    const { data } = await apiClient.get<OrderDTO>(`/api/v1/orders/${id}`, {
      signal: options.signal,
    });
    return data;
  },

  getOrderByNumber: async (
    orderNumber: string,
    options: RequestOptions = {}
  ): Promise<OrderDTO> => {
    const { data } = await apiClient.get<OrderDTO>(`/api/v1/orders/number/${orderNumber}`, {
      signal: options.signal,
    });
    return data;
  },

  updateOrderStatus: async (
    id: number,
    statusData: UpdateOrderStatusRequest
  ): Promise<OrderDTO> => {
    const { data } = await apiClient.patch<OrderDTO>(`/api/v1/orders/${id}/status`, statusData);
    return data;
  },

  updatePaymentStatus: async (
    id: number,
    paymentData: UpdatePaymentStatusRequest
  ): Promise<OrderDTO> => {
    const { data } = await apiClient.patch<OrderDTO>(`/api/v1/orders/${id}/payment`, paymentData);
    return data;
  },

  cancelOrder: async (id: number): Promise<OrderDTO> => {
    const { data } = await apiClient.post<OrderDTO>(`/api/v1/orders/${id}/cancel`);
    return data;
  },

  // Orders scoped to the products the current seller owns — a distinct
  // backend resource from getOrders() above (a customer's own orders), not
  // a filtered view of it. Previously the seller orders page called an
  // incorrect, hand-guessed path ('/api/v1/orders/seller') directly via a
  // raw apiClient.get, which always failed and silently fell back to
  // hardcoded mock orders. API_ENDPOINTS.SELLER.ORDERS is the confirmed,
  // already-versioned real endpoint for this resource.
  /**
   * Submit a return/refund request.
   *
   * [CORRECTNESS] The returns page previously awaited a 1,200ms `setTimeout`
   * and then told the customer *"Return request submitted! You'll hear from us
   * within 24 hours."* Nothing was ever sent anywhere, so customers believed a
   * refund was in progress while the business held no record — a
   * consumer-protection exposure, not merely a bug.
   */
  createReturnRequest: async (
    orderId: number,
    request: CreateReturnRequest
  ): Promise<ReturnRequestDTO> => {
    const { data } = await apiClient.post<ReturnRequestDTO>(
      API_ENDPOINTS.ORDERS.RETURN(String(orderId)),
      request
    );
    return data;
  },

  /**
   * Fetch live tracking for an order.
   *
   * [CORRECTNESS] The tracking page previously hardcoded `currentStep = 3` and
   * five invented events, so every order — placed, cancelled or delivered —
   * rendered identically as "Shipped" with a fabricated journey through
   * Chennai and Bangalore.
   */
  getOrderTracking: async (
    orderId: number,
    options: RequestOptions = {}
  ): Promise<OrderTrackingDTO> => {
    const { data } = await apiClient.get<OrderTrackingDTO>(
      API_ENDPOINTS.ORDERS.TRACK(String(orderId)),
      { signal: options.signal }
    );
    return data;
  },

  getSellerOrders: async (
    params: PageRequest & OrderFilters,
    options: RequestOptions = {}
  ): Promise<PageResponse<OrderDTO>> => {
    const { data } = await apiClient.get<PageResponse<OrderDTO>>(API_ENDPOINTS.SELLER.ORDERS, {
      params,
      signal: options.signal,
    });
    return data;
  },
};
