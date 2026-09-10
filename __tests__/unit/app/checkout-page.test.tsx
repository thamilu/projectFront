import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CheckoutPage from '@/app/(customer)/checkout/page';

const pushMock = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const useCartMock = jest.fn();
jest.mock('@/features/cart/hooks/use-cart', () => ({
  useCart: () => useCartMock(),
}));

const useAddressesMock = jest.fn();
jest.mock('@/features/addresses/hooks/use-addresses', () => ({
  useAddresses: () => useAddressesMock(),
}));

const createOrderMutateAsync = jest.fn();
jest.mock('@/features/orders/hooks/use-orders', () => ({
  useCreateOrder: () => ({ mutateAsync: createOrderMutateAsync, isPending: false }),
}));

const createPaymentIntentMutateAsync = jest.fn();
jest.mock('@/features/checkout/hooks/use-create-payment-intent', () => ({
  useCreatePaymentIntent: () => ({ mutateAsync: createPaymentIntentMutateAsync, isPending: false }),
}));

jest.mock('@/features/checkout/components/StripePaymentForm', () => ({
  StripePaymentForm: ({ clientSecret }: { clientSecret: string }) => (
    <div data-testid="stripe-payment-form">clientSecret:{clientSecret}</div>
  ),
}));

jest.mock('@/shared/ui/molecules/date-picker', () => ({
  DeliveryDatePicker: () => <div data-testid="delivery-picker" />,
}));

jest.mock('@/platform/events', () => ({
  eventBus: { publish: jest.fn() },
}));

function makeAddress(overrides: Record<string, unknown> = {}) {
  return {
    id: 'addr-1',
    type: 'Home',
    name: 'Jane Doe',
    line1: '221B Baker Street',
    city: 'Springfield',
    state: 'IL',
    pincode: '62701',
    phone: '555-0100',
    isDefault: true,
    ...overrides,
  };
}

function makeCart(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    items: [
      {
        id: 1,
        product: { id: 10, name: 'Wireless Headphones' },
        quantity: 2,
        price: 50,
        subtotal: 100,
      },
    ],
    totalAmount: 100,
    ...overrides,
  };
}

describe('CheckoutPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAddressesMock.mockReturnValue({ addresses: [makeAddress()], isLoading: false });
  });

  it('shows a loading state while cart or addresses are loading', () => {
    useCartMock.mockReturnValue({ cart: null, isLoading: true });

    render(<CheckoutPage />);

    expect(screen.getByLabelText(/loading checkout/i)).toBeInTheDocument();
  });

  it('shows an empty-cart state and a link back to products when the cart has no items', () => {
    useCartMock.mockReturnValue({ cart: makeCart({ items: [], totalAmount: 0 }), isLoading: false });

    render(<CheckoutPage />);

    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /browse products/i })).toHaveAttribute(
      'href',
      '/products'
    );
  });

  // Regression: this page previously rendered four equal-weight payment
  // method cards, three of them individually disabled with a repeated
  // "Coming soon" label — visual noise on the one page where completing a
  // purchase matters most. It now shows the one real method as selected and
  // the rest as a single compact roadmap note.
  it('shows Credit/Debit Card as the selected payment method and the rest as a single coming-soon note', () => {
    useCartMock.mockReturnValue({ cart: makeCart(), isLoading: false });

    render(<CheckoutPage />);

    expect(
      screen.getByLabelText('Selected payment method: Credit/Debit Card')
    ).toBeInTheDocument();
    expect(screen.getByText(/more payment methods coming soon/i)).toBeInTheDocument();
    expect(screen.getByText('UPI')).toBeInTheDocument();
    expect(screen.getByText('Digital Wallet')).toBeInTheDocument();
    expect(screen.getByText('EMI Options')).toBeInTheDocument();
  });

  it('prompts to add an address when none are saved', () => {
    useCartMock.mockReturnValue({ cart: makeCart(), isLoading: false });
    useAddressesMock.mockReturnValue({ addresses: [], isLoading: false });

    render(<CheckoutPage />);

    expect(screen.getByText(/don't have any saved addresses/i)).toBeInTheDocument();
  });

  it('creates the order, sets up payment, and shows the Stripe form on submit — without navigating away first', async () => {
    useCartMock.mockReturnValue({ cart: makeCart(), isLoading: false });
    createOrderMutateAsync.mockResolvedValue({
      id: 7,
      orderNumber: 'ORD-7',
      totalAmount: 100,
    });
    createPaymentIntentMutateAsync.mockResolvedValue({
      clientSecret: 'pi_7_secret_abc',
      paymentIntentId: 'pi_7',
    });

    render(<CheckoutPage />);

    fireEvent.click(screen.getByLabelText(/i agree to the/i));
    fireEvent.click(screen.getByRole('button', { name: /continue to payment/i }));

    await waitFor(() =>
      expect(createOrderMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          shippingAddress: expect.stringContaining('Jane Doe'),
        })
      )
    );

    // Exact equality, not `objectContaining`: the payment request must carry
    // ONLY the order id. An earlier contract sent a client-computed `amount`
    // that the route forwarded to Stripe unchanged, which let a shopper pay an
    // arbitrary sum for a real order. This assertion fails if that field ever
    // returns.
    await waitFor(() =>
      expect(createPaymentIntentMutateAsync).toHaveBeenCalledWith({ orderId: 7 })
    );

    expect(await screen.findByTestId('stripe-payment-form')).toHaveTextContent(
      'pi_7_secret_abc'
    );
    // The whole point of redirectOnSuccess:false — the page itself controls
    // navigation only after payment succeeds, not immediately on order
    // creation.
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('shows a retry option instead of crashing when payment-intent setup fails after the order is placed', async () => {
    useCartMock.mockReturnValue({ cart: makeCart(), isLoading: false });
    createOrderMutateAsync.mockResolvedValue({
      id: 9,
      orderNumber: 'ORD-9',
      totalAmount: 100,
    });
    createPaymentIntentMutateAsync.mockRejectedValue(new Error('Stripe is not configured'));

    render(<CheckoutPage />);

    fireEvent.click(screen.getByLabelText(/i agree to the/i));
    fireEvent.click(screen.getByRole('button', { name: /continue to payment/i }));

    expect(await screen.findByText(/stripe is not configured/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry payment setup/i })).toBeInTheDocument();
    expect(screen.getByText(/already been placed as ORD-9/i)).toBeInTheDocument();
  });
});
