import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCreateOrder } from '@/features/orders/hooks/use-orders';
import { orderApi } from '@/features/orders/api/order-api';
import type { OrderDTO } from '@/domains/order/contracts/order.types';
import { OrderStatus, PaymentStatus } from '@/domains/order/contracts/order.types';

jest.mock('@/features/orders/api/order-api', () => ({
  orderApi: {
    createOrder: jest.fn(),
    getOrders: jest.fn(),
    getOrderById: jest.fn(),
    getOrderByNumber: jest.fn(),
    updateOrderStatus: jest.fn(),
    updatePaymentStatus: jest.fn(),
    cancelOrder: jest.fn(),
  },
}));

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const pushMock = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

const mockedOrderApi = orderApi as jest.Mocked<typeof orderApi>;

function makeOrder(overrides: Partial<OrderDTO> = {}): OrderDTO {
  return {
    id: 42,
    orderNumber: 'ORD-42',
    customer: {} as OrderDTO['customer'],
    items: [],
    totalAmount: 100,
    shippingAddress: '123 Main St',
    orderStatus: OrderStatus.PLACED,
    paymentStatus: PaymentStatus.PENDING,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function renderUseCreateOrder(options?: { redirectOnSuccess?: boolean }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  return renderHook(() => useCreateOrder(options), { wrapper });
}

describe('useCreateOrder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects to the order confirmation page by default once the order is created', async () => {
    mockedOrderApi.createOrder.mockResolvedValue(makeOrder({ id: 7 }));
    const { result } = renderUseCreateOrder();

    act(() => {
      result.current.mutate({ shippingAddress: '123 Main St' });
    });

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/orders/7'));
  });

  it('does not redirect when redirectOnSuccess is false — the caller (a payment flow) navigates itself', async () => {
    // Regression guard: the Stripe checkout flow creates the order, then
    // still needs to collect payment before it's safe to leave this page —
    // the hook's default auto-redirect would otherwise navigate the user
    // away before payment ever runs.
    mockedOrderApi.createOrder.mockResolvedValue(makeOrder({ id: 8 }));
    const { result } = renderUseCreateOrder({ redirectOnSuccess: false });

    act(() => {
      result.current.mutate({ shippingAddress: '123 Main St' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('surfaces an error toast and does not redirect when order creation fails', async () => {
    const { toast } = jest.requireMock('sonner');
    mockedOrderApi.createOrder.mockRejectedValue(new Error('backend unavailable'));
    const { result } = renderUseCreateOrder();

    act(() => {
      result.current.mutate({ shippingAddress: '123 Main St' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(toast.error).toHaveBeenCalledWith('Failed to create order');
    expect(pushMock).not.toHaveBeenCalled();
  });
});
