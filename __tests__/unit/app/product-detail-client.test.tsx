import { render, screen } from '@testing-library/react';
import ProductDetailClient from '@/app/(public)/products/[slug]/product-detail-client';
import { useCart } from '@/features/cart/hooks/use-cart';
import { useWishlistToggle } from '@/features/wishlist/hooks/use-wishlist-toggle';
import { useInventoryUpdates } from '@/features/orders/hooks/use-order-updates';
import type { ProductDTO } from '@/domains/catalog/contracts/catalog.types';

jest.mock('@/features/cart/hooks/use-cart', () => ({
  useCart: jest.fn(),
}));

jest.mock('@/features/wishlist/hooks/use-wishlist-toggle', () => ({
  useWishlistToggle: jest.fn(),
}));

jest.mock('@/features/orders/hooks/use-order-updates', () => ({
  useInventoryUpdates: jest.fn(),
}));

const mockedUseCart = useCart as jest.Mock;
const mockedUseWishlistToggle = useWishlistToggle as jest.Mock;
const mockedUseInventoryUpdates = useInventoryUpdates as jest.Mock;

function buildProduct(overrides: Partial<ProductDTO> = {}): ProductDTO {
  return {
    id: 42,
    name: 'Wireless Mouse',
    price: 999,
    stockQuantity: 5,
    sku: 'WM-42',
    description: 'A great mouse.',
    urlSlug: 'wireless-mouse',
    ...overrides,
  } as ProductDTO;
}

describe('ProductDetailClient — real-time stock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseCart.mockReturnValue({ addToCart: jest.fn(), isAdding: false });
    mockedUseWishlistToggle.mockReturnValue({ isInWishlist: false, toggle: jest.fn() });
    mockedUseInventoryUpdates.mockReturnValue({ stock: null, lastUpdate: null });
  });

  // Regression: useInventoryUpdates was fully built (WebSocket subscription,
  // toasts for low/out-of-stock) but wired into zero pages — this page
  // always rendered only the initially-fetched product.stockQuantity, which
  // could go stale the moment stock changed on another tab/device.
  it('falls back to the fetched stockQuantity when no live stock update has arrived', () => {
    render(<ProductDetailClient product={buildProduct({ stockQuantity: 5 })} />);
    expect(screen.getByText(/In Stock \(5 available\)/)).toBeInTheDocument();
  });

  it('overrides the displayed stock with a live WebSocket update once one arrives', () => {
    mockedUseInventoryUpdates.mockReturnValue({ stock: 2, lastUpdate: new Date().toISOString() });
    render(<ProductDetailClient product={buildProduct({ stockQuantity: 5 })} />);

    expect(screen.getByText(/In Stock \(2 available\)/)).toBeInTheDocument();
    expect(screen.queryByText(/In Stock \(5 available\)/)).not.toBeInTheDocument();
  });

  it('shows Out of Stock and disables Add to Cart once live stock drops to zero', () => {
    mockedUseInventoryUpdates.mockReturnValue({ stock: 0, lastUpdate: new Date().toISOString() });
    render(<ProductDetailClient product={buildProduct({ stockQuantity: 5 })} />);

    expect(screen.getByText('Out of Stock')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add to cart/i })).toBeDisabled();
  });

  it('subscribes to inventory updates for this specific product id', () => {
    render(<ProductDetailClient product={buildProduct({ id: 77 })} />);
    expect(mockedUseInventoryUpdates).toHaveBeenCalledWith('77');
  });
});
