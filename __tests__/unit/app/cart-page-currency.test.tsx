import { render, screen } from '@testing-library/react';
import CartPage from '@/app/(customer)/cart/page';

// Regression: the cart page's totals previously used a hardcoded
// Intl.NumberFormat('en-IN', { currency: 'INR' }) regardless of deployment
// configuration — inconsistent with the checkout page one step later in the
// same flow, which already read env.NEXT_PUBLIC_DEFAULT_CURRENCY. A
// non-INR deployment would show INR on the cart page and the real
// configured currency at checkout. Overriding the currency here to USD
// proves the cart page now reads the same env config instead of a literal.
// A test-file jest.mock('@/env', ...) call replaces __tests__/setup.ts's
// global env mock entirely (test-file mocks win for the same path) — so
// this carries every field the cart page's import chain needs (shared/utils
// -> shared/constants/api/endpoints.ts's getApiRuntimeConfig() reads several
// of these at module-eval time), not just the three fields this test cares
// about overriding, or those modules throw "Missing required environment
// variable" at import time instead.
jest.mock('@/env', () => ({
  env: {
    NODE_ENV: 'test',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    NEXT_PUBLIC_R2_PUBLIC_URL: 'https://r2.mock.example.com',
    NEXT_PUBLIC_KEYCLOAK_URL: 'http://localhost:8080',
    NEXT_PUBLIC_API_URL: 'http://localhost:8080',
    NEXT_PUBLIC_API_VERSION: 'v1',
    NEXT_PUBLIC_WS_URL: 'http://localhost:8090',
    NEXT_PUBLIC_APP_ENV: 'development',
    NEXT_PUBLIC_DEFAULT_CURRENCY: 'USD',
    NEXT_PUBLIC_DEFAULT_CURRENCY_SYMBOL: '$',
    NEXT_PUBLIC_DEFAULT_LOCALE: 'en-US',
    NEXT_PUBLIC_DEFAULT_PAGE_SIZE: 20,
    NEXT_PUBLIC_MAX_PAGE_SIZE: 100,
    NEXT_PUBLIC_APP_NAME: 'App',
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
    NEXT_PUBLIC_ENABLE_DEBUG_LOGS: false,
  },
}));

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

jest.mock('@/features/cart/hooks/use-validate-coupon', () => ({
  useValidateCoupon: () => ({ mutate: jest.fn(), isPending: false }),
}));

function makeCart() {
  return {
    items: [
      {
        id: 1,
        product: { id: 10, name: 'Wireless Headphones', stockQuantity: 5 },
        price: 50,
        quantity: 2,
      },
    ],
  };
}

describe('CartPage currency formatting', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useCartMock.mockReturnValue({
      cart: makeCart(),
      isLoading: false,
      updateCartItem: jest.fn(),
      removeCartItem: jest.fn(),
    });
  });

  it('formats totals using the configured currency (USD), not a hardcoded INR', () => {
    render(<CartPage />);

    expect(screen.getAllByText(/\$100(\.00)?/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/₹/)).not.toBeInTheDocument();
  });
});
