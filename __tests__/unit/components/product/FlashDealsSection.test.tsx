import { render, screen } from '@testing-library/react';
import { FlashDealsSection } from '@/features/products/components/FlashDealsSection';
import { productApi } from '@/features/products/api/product-api';
import { isBackendAvailable } from '@/core/client/backend-health';

jest.mock('@/core/client/backend-health', () => ({
  isBackendAvailable: jest.fn(),
}));

jest.mock('@/features/products/api/product-api', () => ({
  productApi: { getProducts: jest.fn() },
  isBackendDown: jest.fn(() => false),
}));

function buildProduct(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    name: 'Wireless Earbuds',
    description: 'Great sound',
    price: 2000,
    discountPrice: 1500,
    imageUrl: '/images/earbuds.png',
    stockQuantity: 50,
    lowStockThreshold: 5,
    ...overrides,
  };
}

describe('FlashDealsSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Regression: this section previously rendered a static, non-functional
  // countdown ("02:45:12", frozen on every load) and identical hardcoded
  // scarcity numbers ("Sold: 142" / "Only 8 Left") on every single card
  // regardless of which product it was — fabricated data with no backend
  // source. Neither should appear anywhere in the rendered output now.
  it('never renders the old fabricated countdown or fake sold/left copy', async () => {
    (isBackendAvailable as jest.Mock).mockResolvedValue(true);
    (productApi.getProducts as jest.Mock).mockResolvedValue({
      content: [buildProduct({ id: 1 }), buildProduct({ id: 2 }), buildProduct({ id: 3 }), buildProduct({ id: 4 })],
    });

    const jsx = await FlashDealsSection();
    render(jsx);

    expect(screen.queryByText('02:45:12')).not.toBeInTheDocument();
    expect(screen.queryByText(/sold:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/142/)).not.toBeInTheDocument();
  });

  it('shows a real low-stock badge only for products actually at or under their threshold', async () => {
    (isBackendAvailable as jest.Mock).mockResolvedValue(true);
    (productApi.getProducts as jest.Mock).mockResolvedValue({
      content: [
        buildProduct({ id: 1, name: 'Low Stock Item', stockQuantity: 3, lowStockThreshold: 5 }),
        buildProduct({ id: 2, name: 'Plenty In Stock', stockQuantity: 200, lowStockThreshold: 5 }),
        buildProduct({ id: 3, name: 'Third Item' }),
        buildProduct({ id: 4, name: 'Fourth Item' }),
      ],
    });

    const jsx = await FlashDealsSection();
    render(jsx);

    expect(screen.getByText(/only 3 left/i)).toBeInTheDocument();
    expect(screen.queryByText(/only 200 left/i)).not.toBeInTheDocument();
  });

  it('does not show a low-stock badge for demo/fallback placeholder items', async () => {
    (isBackendAvailable as jest.Mock).mockResolvedValue(false);

    const jsx = await FlashDealsSection();
    render(jsx);

    expect(screen.queryByText(/left$/i)).not.toBeInTheDocument();
  });

  it('renders the real, correctly computed discount badge', async () => {
    (isBackendAvailable as jest.Mock).mockResolvedValue(true);
    (productApi.getProducts as jest.Mock).mockResolvedValue({
      content: [
        buildProduct({ id: 1, price: 2000, discountPrice: 1000 }),
        buildProduct({ id: 2 }),
        buildProduct({ id: 3 }),
        buildProduct({ id: 4 }),
      ],
    });

    const jsx = await FlashDealsSection();
    render(jsx);

    expect(screen.getByText('50% OFF')).toBeInTheDocument();
  });
});
