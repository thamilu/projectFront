import { render, screen } from '@testing-library/react';
import { FeaturedProductsSection } from '@/features/products/components/FeaturedProductsSection';
import { productApi } from '@/features/products/api/product-api';
import { isBackendAvailable } from '@/core/client/backend-health';

jest.mock('@/core/client/backend-health', () => ({
  isBackendAvailable: jest.fn(),
}));

jest.mock('@/features/products/api/product-api', () => ({
  productApi: { getProducts: jest.fn() },
  isBackendDown: jest.fn(() => false),
}));

// This section's own logic (rating display, Preview badging) is under test
// here, not the cart — AddToCartButton pulls in next-auth/react, which
// jest's default transform can't parse without additional config.
jest.mock('@/features/cart', () => ({
  AddToCartButton: () => null,
}));

function buildProduct(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    name: 'Wireless Earbuds',
    description: 'Great sound',
    price: 2000,
    discountPrice: undefined,
    imageUrl: '/images/earbuds.png',
    ...overrides,
  };
}

describe('FeaturedProductsSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Regression: every card previously showed 5 hardcoded filled stars and a
  // static "Top Rated" label regardless of the product's real rating (or
  // lack of one). A product with no averageRating should show no rating row
  // at all, rather than a fabricated perfect score.
  it('shows no rating row for a product with no real averageRating', async () => {
    (isBackendAvailable as jest.Mock).mockResolvedValue(true);
    (productApi.getProducts as jest.Mock).mockResolvedValue({
      content: [
        buildProduct({ id: 1 }),
        buildProduct({ id: 2 }),
        buildProduct({ id: 3 }),
        buildProduct({ id: 4 }),
      ],
    });

    render(await FeaturedProductsSection());

    expect(screen.queryByText(/top rated/i)).not.toBeInTheDocument();
  });

  it('renders the real average rating and review count when present', async () => {
    (isBackendAvailable as jest.Mock).mockResolvedValue(true);
    (productApi.getProducts as jest.Mock).mockResolvedValue({
      content: [
        buildProduct({ id: 1, averageRating: 4.6, reviewCount: 128 }),
        buildProduct({ id: 2 }),
        buildProduct({ id: 3 }),
        buildProduct({ id: 4 }),
      ],
    });

    render(await FeaturedProductsSection());

    expect(screen.getByText('4.6 (128)')).toBeInTheDocument();
  });

  it('tags fallback/demo products with a visible Preview badge', async () => {
    (isBackendAvailable as jest.Mock).mockResolvedValue(false);

    render(await FeaturedProductsSection());

    expect(screen.getAllByText(/preview/i).length).toBeGreaterThan(0);
  });
});
