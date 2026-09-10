import { render, screen, fireEvent, within } from '@testing-library/react';
import OrdersPage from '@/app/(customer)/orders/page';
import { useOrders, useCancelOrder } from '@/features/orders/hooks/use-orders';
import { OrderStatus, PaymentStatus } from '@/domains/order/contracts/order.types';
import type { OrderDTO } from '@/domains/order/contracts/order.types';

jest.mock('@/features/orders/hooks/use-orders', () => ({
  useOrders: jest.fn(),
  useCancelOrder: jest.fn(),
}));

const mockedUseOrders = useOrders as jest.Mock;
const mockedUseCancelOrder = useCancelOrder as jest.Mock;

function buildOrder(overrides: Partial<OrderDTO> = {}): OrderDTO {
  return {
    id: 1,
    orderNumber: 'ORD-1001',
    customer: {} as OrderDTO['customer'],
    items: [
      {
        id: 1,
        product: { id: 55, name: 'Wireless Mouse', urlSlug: 'wireless-mouse' } as any,
        quantity: 2,
        price: 500,
        subtotal: 1000,
        createdAt: new Date().toISOString(),
      },
    ],
    totalAmount: 1000,
    shippingAddress: '123 Main St',
    orderStatus: OrderStatus.PLACED,
    paymentStatus: PaymentStatus.PAID,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function mockOrdersQuery(overrides: Partial<ReturnType<typeof useOrders>> = {}) {
  mockedUseOrders.mockReturnValue({
    data: { content: [buildOrder()], totalElements: 1, totalPages: 1, size: 20, number: 0, first: true, last: true },
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
    ...overrides,
  });
}

describe('Customer Orders page', () => {
  const mockCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseCancelOrder.mockReturnValue({ mutate: mockCancel, isPending: false });
    mockOrdersQuery();
  });

  // Regression: this page previously rendered a hardcoded `mockOrders`
  // array — three fake orders shown identically to every customer,
  // regardless of what they actually ordered — with every action button
  // (View Details, Track Order, Cancel Order, etc.) non-functional. It now
  // renders real data from useOrders() and every action links to a real,
  // already-existing route.
  it('renders real order data from useOrders(), not hardcoded mock orders', () => {
    render(<OrdersPage />);

    expect(screen.getByText('#ORD-1001')).toBeInTheDocument();
    expect(screen.queryByText(/ORD-2024-001/)).not.toBeInTheDocument();
  });

  it('shows loading skeletons while orders are loading', () => {
    mockOrdersQuery({ data: undefined, isLoading: true });
    render(<OrdersPage />);
    expect(screen.getByTestId('orders-loading')).toBeInTheDocument();
  });

  it('shows an error state with a working retry button', () => {
    const refetch = jest.fn();
    mockOrdersQuery({ data: undefined, isError: true, refetch });
    render(<OrdersPage />);

    expect(screen.getByTestId('orders-error')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(refetch).toHaveBeenCalled();
  });

  it('shows an empty state when there are no orders', () => {
    mockOrdersQuery({ data: { content: [], totalElements: 0, totalPages: 0, size: 20, number: 0, first: true, last: true } });
    render(<OrdersPage />);
    expect(screen.getByText('No orders found')).toBeInTheDocument();
  });

  it('filters orders by status via a real server-side param, not client-side mock filtering', () => {
    render(<OrdersPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Delivered' }));

    expect(mockedUseOrders).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: OrderStatus.DELIVERED })
    );
  });

  it('filters the visible list by search query against real order/product data', () => {
    mockOrdersQuery({
      data: {
        content: [
          buildOrder({ id: 1, orderNumber: 'ORD-1001' }),
          buildOrder({ id: 2, orderNumber: 'ORD-2002' }),
        ],
        totalElements: 2,
        totalPages: 1,
        size: 20,
        number: 0,
        first: true,
        last: true,
      },
    });
    render(<OrdersPage />);

    fireEvent.change(screen.getByLabelText('Search orders'), { target: { value: '2002' } });

    expect(screen.getByText('#ORD-2002')).toBeInTheDocument();
    expect(screen.queryByText('#ORD-1001')).not.toBeInTheDocument();
  });

  it('shows a working Cancel Order action for a cancellable order, confirms via dialog, and calls the real mutation', () => {
    render(<OrdersPage />);

    const cancelButtons = screen.getAllByRole('button', { name: /cancel order/i });
    fireEvent.click(cancelButtons[0]);

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText(/ORD-1001/)).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: /cancel order/i }));

    expect(mockCancel).toHaveBeenCalledWith(1, expect.objectContaining({ onSuccess: expect.any(Function) }));
  });

  it('does not cancel the order when the confirmation dialog is dismissed', () => {
    render(<OrdersPage />);

    const cancelButtons = screen.getAllByRole('button', { name: /cancel order/i });
    fireEvent.click(cancelButtons[0]);

    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: /keep order/i }));

    expect(mockCancel).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does not show Cancel Order for a shipped order', () => {
    mockOrdersQuery({
      data: {
        content: [buildOrder({ orderStatus: OrderStatus.SHIPPED })],
        totalElements: 1,
        totalPages: 1,
        size: 20,
        number: 0,
        first: true,
        last: true,
      },
    });
    render(<OrdersPage />);

    expect(screen.queryByRole('button', { name: /cancel order/i })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /track order/i })).toBeInTheDocument();
  });

  it('links View Details to the real order detail route', () => {
    render(<OrdersPage />);
    const link = screen.getByRole('link', { name: /view details/i });
    expect(link).toHaveAttribute('href', '/orders/1');
  });

  it('shows a working "Write a review" link for delivered items, scoped to the real product', () => {
    mockOrdersQuery({
      data: {
        content: [buildOrder({ orderStatus: OrderStatus.DELIVERED })],
        totalElements: 1,
        totalPages: 1,
        size: 20,
        number: 0,
        first: true,
        last: true,
      },
    });
    render(<OrdersPage />);

    fireEvent.click(screen.getByText('#ORD-1001'));

    const reviewLink = screen.getByRole('link', { name: /write a review/i });
    expect(reviewLink).toHaveAttribute('href', '/products/wireless-mouse/reviews');
  });
});
