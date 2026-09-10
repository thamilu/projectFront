import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { AddToCartButton } from '@/features/cart/components/AddToCartButton';
import { cartApi } from '@/features/cart/api/cart-api';
import type { CartDTO } from '@/domains/cart/contracts/cart.types';

// Regression guard: this button previously wrote to a client-only Zustand
// store and never called the cart API at all, so "Add to Cart" silently did
// nothing durable. This test fails again if that regresses.
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

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe('AddToCartButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseSession.mockReturnValue({ data: { user: { id: '1' } }, status: 'authenticated' });
    mockedCartApi.getCart.mockResolvedValue({ id: 1, items: [], totalAmount: 0 } as unknown as CartDTO);
  });

  it('calls the real cart API with the product id and quantity 1 on click', async () => {
    mockedCartApi.addToCart.mockResolvedValue({ id: 1, items: [], totalAmount: 0 } as unknown as CartDTO);
    const user = userEvent.setup();

    renderWithQueryClient(<AddToCartButton product={{ id: 42, title: 'Wireless Mouse' }} />);

    await user.click(screen.getByRole('button', { name: /add to cart wireless mouse/i }));

    await waitFor(() => expect(mockedCartApi.addToCart).toHaveBeenCalledWith(42, 1));
  });

  it('disables the button while the add-to-cart mutation is in flight', async () => {
    let resolveAdd!: (cart: CartDTO) => void;
    mockedCartApi.addToCart.mockReturnValue(
      new Promise((resolve) => {
        resolveAdd = resolve;
      })
    );
    const user = userEvent.setup();

    renderWithQueryClient(<AddToCartButton product={{ id: 7, title: 'Desk Lamp' }} />);
    const button = screen.getByRole('button', { name: /add to cart desk lamp/i });

    await user.click(button);
    await waitFor(() => expect(button).toBeDisabled());

    resolveAdd({ id: 1, items: [], totalAmount: 0 } as unknown as CartDTO);
    await waitFor(() => expect(button).not.toBeDisabled());
  });
});
