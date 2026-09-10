/**
 * order API integration test.
 *
 * Previously this file was a placeholder (`expect(true).toBe(true)`) that
 * showed green in CI while asserting nothing about orderApi at all — the
 * kind of stub that's worse than no test, since it looks like coverage.
 * This exercises every orderApi method: request shape (method, path,
 * params, body), the abort-signal threading added to the read methods (see
 * order-api.ts's docblock — without it React Query can't actually cancel an
 * in-flight request), and that a rejected request propagates rather than
 * being swallowed.
 */

import { orderApi } from '@/features/orders/api/order-api';
import { apiClient } from '@/core/client';
import { API_ENDPOINTS } from '@/shared/constants/api/endpoints';
import { OrderStatus, PaymentStatus } from '@/domains/order/contracts/order.types';
import type { OrderDTO } from '@/domains/order/contracts/order.types';

jest.mock('@/core/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
  },
}));

const mockedClient = apiClient as jest.Mocked<typeof apiClient>;

function buildOrder(overrides: Partial<OrderDTO> = {}): OrderDTO {
  return {
    id: 1,
    orderNumber: 'ORD-1001',
    customer: {} as OrderDTO['customer'],
    items: [],
    totalAmount: 1000,
    shippingAddress: '123 Main St',
    orderStatus: OrderStatus.PLACED,
    paymentStatus: PaymentStatus.PAID,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('order API integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    it('posts the order payload and returns the created order', async () => {
      const order = buildOrder();
      mockedClient.post.mockResolvedValueOnce({ data: order });

      const result = await orderApi.createOrder({ shippingAddress: '123 Main St' });

      expect(mockedClient.post).toHaveBeenCalledWith('/api/v1/orders', {
        shippingAddress: '123 Main St',
      });
      expect(result).toEqual(order);
    });

    it('propagates a failure rather than swallowing it', async () => {
      mockedClient.post.mockRejectedValueOnce(new Error('Network error'));
      await expect(orderApi.createOrder({ shippingAddress: '123 Main St' })).rejects.toThrow(
        'Network error'
      );
    });
  });

  describe('getOrders', () => {
    it('requests the customer order list with params and an abort signal', async () => {
      const page = { content: [buildOrder()], totalElements: 1, totalPages: 1, size: 20, number: 0, first: true, last: true };
      mockedClient.get.mockResolvedValueOnce({ data: page });
      const controller = new AbortController();

      const result = await orderApi.getOrders(
        { page: 0, size: 20, status: OrderStatus.PLACED },
        { signal: controller.signal }
      );

      expect(mockedClient.get).toHaveBeenCalledWith('/api/v1/orders', {
        params: { page: 0, size: 20, status: OrderStatus.PLACED },
        signal: controller.signal,
      });
      expect(result).toEqual(page);
    });
  });

  describe('getOrderById', () => {
    it('requests a single order by id with an abort signal', async () => {
      const order = buildOrder();
      mockedClient.get.mockResolvedValueOnce({ data: order });
      const controller = new AbortController();

      const result = await orderApi.getOrderById(1, { signal: controller.signal });

      expect(mockedClient.get).toHaveBeenCalledWith('/api/v1/orders/1', {
        signal: controller.signal,
      });
      expect(result).toEqual(order);
    });
  });

  describe('getOrderByNumber', () => {
    it('requests a single order by order number', async () => {
      const order = buildOrder();
      mockedClient.get.mockResolvedValueOnce({ data: order });

      const result = await orderApi.getOrderByNumber('ORD-1001');

      expect(mockedClient.get).toHaveBeenCalledWith('/api/v1/orders/number/ORD-1001', {
        signal: undefined,
      });
      expect(result).toEqual(order);
    });
  });

  describe('updateOrderStatus', () => {
    it('PATCHes the new status and returns the updated order', async () => {
      const order = buildOrder({ orderStatus: OrderStatus.PACKED });
      mockedClient.patch.mockResolvedValueOnce({ data: order });

      const result = await orderApi.updateOrderStatus(1, { orderStatus: OrderStatus.PACKED });

      expect(mockedClient.patch).toHaveBeenCalledWith('/api/v1/orders/1/status', {
        orderStatus: OrderStatus.PACKED,
      });
      expect(result.orderStatus).toBe(OrderStatus.PACKED);
    });
  });

  describe('updatePaymentStatus', () => {
    it('PATCHes the new payment status and returns the updated order', async () => {
      const order = buildOrder({ paymentStatus: PaymentStatus.REFUNDED });
      mockedClient.patch.mockResolvedValueOnce({ data: order });

      const result = await orderApi.updatePaymentStatus(1, {
        paymentStatus: PaymentStatus.REFUNDED,
      });

      expect(mockedClient.patch).toHaveBeenCalledWith('/api/v1/orders/1/payment', {
        paymentStatus: PaymentStatus.REFUNDED,
      });
      expect(result.paymentStatus).toBe(PaymentStatus.REFUNDED);
    });
  });

  describe('cancelOrder', () => {
    it('POSTs to the cancel endpoint and returns the cancelled order', async () => {
      const order = buildOrder({ orderStatus: OrderStatus.CANCELLED });
      mockedClient.post.mockResolvedValueOnce({ data: order });

      const result = await orderApi.cancelOrder(1);

      expect(mockedClient.post).toHaveBeenCalledWith('/api/v1/orders/1/cancel');
      expect(result.orderStatus).toBe(OrderStatus.CANCELLED);
    });

    it('propagates a failure (e.g. the order is no longer cancellable) rather than swallowing it', async () => {
      mockedClient.post.mockRejectedValueOnce(new Error('Order cannot be cancelled'));
      await expect(orderApi.cancelOrder(1)).rejects.toThrow('Order cannot be cancelled');
    });
  });

  describe('getSellerOrders', () => {
    // Regression: the seller orders page previously called an incorrect,
    // hand-guessed path directly instead of a real orderApi method, and
    // silently fell back to hardcoded mock data on failure. This is the
    // real, correctly-routed method it now uses.
    it('requests the seller-scoped order list via the confirmed real endpoint', async () => {
      const page = { content: [buildOrder()], totalElements: 1, totalPages: 1, size: 20, number: 0, first: true, last: true };
      mockedClient.get.mockResolvedValueOnce({ data: page });
      const controller = new AbortController();

      const result = await orderApi.getSellerOrders(
        { page: 0, size: 20 },
        { signal: controller.signal }
      );

      expect(mockedClient.get).toHaveBeenCalledWith(API_ENDPOINTS.SELLER.ORDERS, {
        params: { page: 0, size: 20 },
        signal: controller.signal,
      });
      expect(result).toEqual(page);
    });

    it('is a distinct path from getOrders (customer orders vs. seller orders)', async () => {
      mockedClient.get.mockResolvedValue({
        data: { content: [], totalElements: 0, totalPages: 0, size: 20, number: 0, first: true, last: true },
      });

      await orderApi.getSellerOrders({ page: 0, size: 20 });
      await orderApi.getOrders({ page: 0, size: 20 });

      const [sellerPath] = mockedClient.get.mock.calls[0];
      const [customerPath] = mockedClient.get.mock.calls[1];
      expect(sellerPath).not.toBe(customerPath);
    });
  });
});
