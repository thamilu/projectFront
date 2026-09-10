import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSession } from 'next-auth/react';
import SellerOrdersPage from '@/app/(seller)/seller/orders/page';
import { useSellerOrders, useUpdateOrderStatus } from '@/features/orders/hooks/use-orders';
import { OrderStatus, PaymentStatus } from '@/domains/order/contracts/order.types';
import type { OrderDTO } from '@/domains/order/contracts/order.types';

const mockPush = jest.fn();

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/features/orders/hooks/use-orders', () => ({
  useSellerOrders: jest.fn(),
  useUpdateOrderStatus: jest.fn(),
}));

const mockedUseSession = useSession as jest.Mock;
const mockedUseSellerOrders = useSellerOrders as jest.Mock;
const mockedUseUpdateOrderStatus = useUpdateOrderStatus as jest.Mock;

function buildOrder(overrides: Partial<OrderDTO> = {}): OrderDTO {
  return {
    id: 1,
    orderNumber: 'ORD-5001',
    customer: {
      id: 9,
      username: 'jdoe',
      email: 'jdoe@example.com',
      firstName: 'Jane',
      lastName: 'Doe',
      role: 'CUSTOMER',
      active: true,
      createdAt: new Date().toISOString(),
    } as OrderDTO['customer'],
    items: [
      {
        id: 1,
        product: { id: 55, name: 'Wireless Mouse' } as any,
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

function mockSellerOrdersQuery(overrides: Partial<ReturnType<typeof useSellerOrders>> = {}) {
  mockedUseSellerOrders.mockReturnValue({
    data: { content: [buildOrder()], totalElements: 1, totalPages: 1, size: 20, number: 0, first: true, last: true },
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
    ...overrides,
  });
}

describe('Seller Orders page', () => {
  const mockUpdateStatus = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseSession.mockReturnValue({
      data: { roles: ['SELLER'] },
      status: 'authenticated',
    });
    mockedUseUpdateOrderStatus.mockReturnValue({ mutate: mockUpdateStatus, isPending: false });
    mockSellerOrdersQuery();
  });

  // Regression: this page previously called an incorrect, hand-guessed
  // endpoint ('/api/v1/orders/seller') directly via a raw apiClient.get, and
  // on ANY fetch failure — which was every load, since the endpoint was
  // wrong — silently fell back to three hardcoded MOCK_ORDERS shown as if
  // real. It now renders real data from useSellerOrders() and surfaces a
  // genuine error state instead of a fake fallback.
  it('renders real seller order data, not hardcoded mock orders', () => {
    render(<SellerOrdersPage />);

    expect(screen.getByText('ORD-5001')).toBeInTheDocument();
    expect(screen.queryByText(/ORD-2024-001/)).not.toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  });

  it('shows a genuine error state with retry instead of a fake mock-data fallback', () => {
    const refetch = jest.fn();
    mockSellerOrdersQuery({ data: undefined, isError: true, refetch });
    render(<SellerOrdersPage />);

    expect(screen.getByTestId('seller-orders-error')).toBeInTheDocument();
    expect(screen.queryByText(/ORD-2024-001/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(refetch).toHaveBeenCalled();
  });

  it('redirects a non-seller to home instead of showing the orders table', () => {
    mockedUseSession.mockReturnValue({ data: { roles: ['CUSTOMER'] }, status: 'authenticated' });
    render(<SellerOrdersPage />);

    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('shows Mark as Packed for a placed order and calls the real status mutation', async () => {
    render(<SellerOrdersPage />);

    await userEvent.click(screen.getByRole('button', { name: /open menu/i }));
    await userEvent.click(await screen.findByRole('menuitem', { name: /mark as packed/i }));

    expect(mockUpdateStatus).toHaveBeenCalledWith({ id: 1, status: OrderStatus.PACKED });
  });

  it('shows Mark as Shipped (not Packed) for an already-packed order', async () => {
    mockSellerOrdersQuery({
      data: {
        content: [buildOrder({ orderStatus: OrderStatus.PACKED })],
        totalElements: 1,
        totalPages: 1,
        size: 20,
        number: 0,
        first: true,
        last: true,
      },
    });
    render(<SellerOrdersPage />);

    await userEvent.click(screen.getByRole('button', { name: /open menu/i }));
    expect(await screen.findByRole('menuitem', { name: /mark as shipped/i })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /mark as packed/i })).not.toBeInTheDocument();
  });

  it('expands order details showing items and shipping address on View Details', async () => {
    render(<SellerOrdersPage />);

    await userEvent.click(screen.getByRole('button', { name: /open menu/i }));
    await userEvent.click(await screen.findByRole('menuitem', { name: /view details/i }));

    expect(screen.getByText(/123 Main St/)).toBeInTheDocument();
    expect(screen.getByText(/Wireless Mouse/)).toBeInTheDocument();
  });
});
