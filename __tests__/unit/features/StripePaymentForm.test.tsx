import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StripePaymentForm } from '@/features/checkout/components/StripePaymentForm';

const confirmPaymentMock = jest.fn();
let stripeMockValue: { confirmPayment: typeof confirmPaymentMock } | null = {
  confirmPayment: confirmPaymentMock,
};
let elementsMockValue: object | null = {};

jest.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  PaymentElement: () => <div data-testid="payment-element" />,
  useStripe: () => stripeMockValue,
  useElements: () => elementsMockValue,
}));

jest.mock('@/infrastructure/payments/stripe-client', () => ({
  getStripe: jest.fn(() => Promise.resolve(null)),
}));

describe('StripePaymentForm', () => {
  const onSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    stripeMockValue = { confirmPayment: confirmPaymentMock };
    elementsMockValue = {};
  });

  it('renders the PaymentElement and a disabled submit until Stripe/Elements are ready', () => {
    stripeMockValue = null;
    elementsMockValue = null;

    render(
      <StripePaymentForm clientSecret="pi_123_secret" returnUrl="https://example.com/orders/1" onSuccess={onSuccess} />
    );

    expect(screen.getByTestId('payment-element')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pay now/i })).toBeDisabled();
  });

  it('calls confirmPayment with redirect:if_required and the given returnUrl on submit', async () => {
    confirmPaymentMock.mockResolvedValue({ paymentIntent: { status: 'succeeded' } });

    render(
      <StripePaymentForm
        clientSecret="pi_123_secret"
        returnUrl="https://example.com/orders/1"
        onSuccess={onSuccess}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /pay now/i }));

    await waitFor(() =>
      expect(confirmPaymentMock).toHaveBeenCalledWith(
        expect.objectContaining({
          confirmParams: { return_url: 'https://example.com/orders/1' },
          redirect: 'if_required',
        })
      )
    );
  });

  it('calls onSuccess when the payment intent succeeds without a redirect', async () => {
    confirmPaymentMock.mockResolvedValue({ paymentIntent: { status: 'succeeded' } });

    render(
      <StripePaymentForm clientSecret="pi_123_secret" returnUrl="https://example.com/orders/1" onSuccess={onSuccess} />
    );

    fireEvent.click(screen.getByRole('button', { name: /pay now/i }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
  });

  it('shows an accessible error message and does not call onSuccess when confirmPayment fails', async () => {
    confirmPaymentMock.mockResolvedValue({
      error: { message: 'Your card was declined.' },
    });

    render(
      <StripePaymentForm clientSecret="pi_123_secret" returnUrl="https://example.com/orders/1" onSuccess={onSuccess} />
    );

    fireEvent.click(screen.getByRole('button', { name: /pay now/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Your card was declined.');
    expect(onSuccess).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /pay now/i })).not.toBeDisabled();
  });

  it('does not call onSuccess for a status that requires an off-site redirect', async () => {
    confirmPaymentMock.mockResolvedValue({ paymentIntent: { status: 'requires_action' } });

    render(
      <StripePaymentForm clientSecret="pi_123_secret" returnUrl="https://example.com/orders/1" onSuccess={onSuccess} />
    );

    fireEvent.click(screen.getByRole('button', { name: /pay now/i }));

    await waitFor(() => expect(confirmPaymentMock).toHaveBeenCalled());
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
