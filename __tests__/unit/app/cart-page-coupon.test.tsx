import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CartPage from '@/app/(customer)/cart/page';

jest.mock('next-auth/react', () => ({
  useSession: () => ({ status: 'authenticated' }),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

const useCartMock = jest.fn();
jest.mock('@/features/cart/hooks/use-cart', () => ({
  useCart: () => useCartMock(),
}));

const mutateMock = jest.fn();
const useValidateCouponMock = jest.fn();
jest.mock('@/features/cart/hooks/use-validate-coupon', () => ({
  useValidateCoupon: () => useValidateCouponMock(),
}));

function makeCart() {
  return {
    items: [
      {
        id: 1,
        product: { id: 10, name: 'Wireless Headphones', stockQuantity: 5 },
        price: 100,
        quantity: 1,
      },
    ],
  };
}

// Regression: the cart page previously checked a promo code against a
// single hardcoded string ('SAVE10') entirely client-side and applied a
// flat 10% discount with zero server involvement — a code that wasn't even
// one of the real codes the backend's coupon-validation endpoint
// recognizes. It now calls the real /api/secure/validate-coupon route via
// useValidateCoupon() and reflects exactly what the server returns.
describe('CartPage coupon validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useCartMock.mockReturnValue({
      cart: makeCart(),
      isLoading: false,
      updateCartItem: jest.fn(),
      removeCartItem: jest.fn(),
    });
    useValidateCouponMock.mockReturnValue({ mutate: mutateMock, isPending: false });
  });

  it('calls the real coupon-validation mutation with the entered code and current subtotal', () => {
    render(<CartPage />);

    fireEvent.change(screen.getByLabelText('Promo code'), { target: { value: 'SAVE20' } });
    fireEvent.click(screen.getByRole('button', { name: /apply/i }));

    expect(mutateMock).toHaveBeenCalledWith(
      { couponCode: 'SAVE20', cartTotal: 100 },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
    );
  });

  it('shows the real server-validated discount and code once applied', async () => {
    mutateMock.mockImplementation((_vars, { onSuccess }) => {
      onSuccess({
        couponCode: 'SAVE20',
        discountAmount: 20,
        finalTotal: 80,
        message: 'Coupon applied! You saved ₹20',
      });
    });

    render(<CartPage />);
    fireEvent.change(screen.getByLabelText('Promo code'), { target: { value: 'SAVE20' } });
    fireEvent.click(screen.getByRole('button', { name: /apply/i }));

    expect(await screen.findByText(/Promo \(SAVE20\)/)).toBeInTheDocument();
  });

  it('surfaces the real server rejection reason instead of a generic "invalid code" message', async () => {
    mutateMock.mockImplementation((_vars, { onError }) => {
      onError(new Error('Minimum purchase of ₹500 required'));
    });

    render(<CartPage />);
    fireEvent.change(screen.getByLabelText('Promo code'), { target: { value: 'PREMIUM50' } });
    fireEvent.click(screen.getByRole('button', { name: /apply/i }));

    await waitFor(() => expect(mutateMock).toHaveBeenCalled());
    // No discount line should render since the coupon was rejected.
    expect(screen.queryByText(/Promo \(/)).not.toBeInTheDocument();
  });

  it('discloses that shipping and tax are estimates confirmed at checkout', () => {
    render(<CartPage />);
    expect(screen.getByText(/confirmed at checkout/i)).toBeInTheDocument();
  });
});
