import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useCart } from '@/features/cart/hooks/use-cart';
import { cartApi } from '@/features/cart/api/cart-api';
import type { CartDTO } from '@/domains/cart/contracts/cart.types';

jest.mock('@/features/cart/api/cart-api', () => ({
  cartApi: {
    getCart: jest.fn(),
    addToCart: jest.fn(),
    updateCartItem: jest.fn(),
    removeCartItem: jest.fn(),
    clearCart: jest.fn(),
  },
}));

jest.mock('@/platform/events', () => ({
  eventBus: { publish: jest.fn() },
}));

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

const mockedCartApi = cartApi as jest.Mocked<typeof cartApi>;
const mockedUseSession = useSession as jest.Mock;

function makeCart(overrides: Partial<CartDTO> = {}): CartDTO {
  return {
    id: 1,
    items: [
      {
        id: 1,
        product: { id: 10 } as CartDTO['items'][number]['product'],
        quantity: 2,
        price: 25,
        subtotal: 50,
      } as CartDTO['items'][number],
    ],
    totalAmount: 50,
    ...overrides,
  } as CartDTO;
}

function renderUseCart() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  return { ...renderHook(() => useCart(), { wrapper }), queryClient };
}

describe('useCart', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseSession.mockReturnValue({ data: { user: { id: '1' } }, status: 'authenticated' });
  });

  // Regression guard: the header cart button/badge calls useCart() on every
  // page, including for guests — without this gate, a signed-out visitor
  // triggered a guaranteed-403 request to the authenticated-only cart
  // endpoint on every page load, which a global interceptor surfaced as a
  // visible "Access Denied" toast the user never asked for.
  it('does not call the cart API when the user is unauthenticated', async () => {
    mockedUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });
    mockedCartApi.getCart.mockResolvedValue(makeCart());

    const { result } = renderUseCart();

    expect(result.current.isLoading).toBe(false);
    expect(result.current.cart).toBeNull();
    expect(result.current.itemCount).toBe(0);
    expect(mockedCartApi.getCart).not.toHaveBeenCalled();
  });

  it('derives cart, itemCount, and total from the server response — single source of truth', async () => {
    mockedCartApi.getCart.mockResolvedValue(makeCart());

    const { result } = renderUseCart();

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.cart?.id).toBe(1);
    expect(result.current.itemCount).toBe(2);
    expect(result.current.total).toBe(50);
  });

  it('writes the server response for addToCart straight into the shared cache (no separate client copy to desync)', async () => {
    mockedCartApi.getCart.mockResolvedValue(makeCart({ items: [], totalAmount: 0 }));
    const updatedCart = makeCart({ totalAmount: 75 });
    mockedCartApi.addToCart.mockResolvedValue(updatedCart);

    const { result } = renderUseCart();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.itemCount).toBe(0);

    act(() => {
      result.current.addToCart({ productId: 10, quantity: 2 });
    });

    await waitFor(() => expect(mockedCartApi.addToCart).toHaveBeenCalledWith(10, 2));
    await waitFor(() => expect(result.current.total).toBe(75));
    expect(result.current.itemCount).toBe(2);
  });

  it('clears the cache to an empty cart after clearCart', async () => {
    mockedCartApi.getCart.mockResolvedValue(makeCart());
    mockedCartApi.clearCart.mockResolvedValue(undefined);

    const { result } = renderUseCart();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.clearCart();
    });

    await waitFor(() => expect(result.current.cart).toBeNull());
    expect(result.current.itemCount).toBe(0);
    expect(result.current.total).toBe(0);
  });
});
