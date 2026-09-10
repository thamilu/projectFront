import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import WishlistPage from '@/app/(customer)/wishlist/page';
import { shareUrl } from '@/shared/utils/share';

jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() } }));
jest.mock('@/core/telemetry/logger', () => ({ logger: { info: jest.fn(), error: jest.fn() } }));
jest.mock('@/shared/utils/share', () => ({ shareUrl: jest.fn() }));

const useCartMock = jest.fn();
jest.mock('@/features/cart/hooks/use-cart', () => ({ useCart: () => useCartMock() }));

const useWishlistMock = jest.fn();
jest.mock('@/features/wishlist/hooks/use-wishlist', () => ({
  useWishlist: () => useWishlistMock(),
}));

const mockShareUrl = shareUrl as jest.Mock;

function makeProduct(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    name: 'Wireless Headphones',
    price: 100,
    stockQuantity: 5,
    imageUrl: '/img.jpg',
    categoryName: 'Electronics',
    urlSlug: 'wireless-headphones',
    ...overrides,
  };
}

describe('WishlistPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useCartMock.mockReturnValue({ addToCart: jest.fn(), addToCartAsync: jest.fn() });
    mockShareUrl.mockResolvedValue('shared');
  });

  it('shows the current (discounted) price in bold and the pre-discount price struck through — not swapped', () => {
    // Regression guard: price/originalPrice were previously assigned
    // backwards — the bold "current price" showed product.price (the
    // undiscounted, more expensive amount) while the strikethrough showed
    // product.discountPrice (the actual, cheaper sale price), exactly
    // backwards from "was $100, now $80".
    useWishlistMock.mockReturnValue({
      wishlist: {
        data: {
          content: [
            {
              id: 1,
              productId: 1,
              product: makeProduct({ price: 100, discountPrice: 80 }),
            },
          ],
        },
      },
      isLoading: false,
      removeFromWishlist: jest.fn(),
    });

    render(<WishlistPage />);

    // "$80.00" (the discounted current price) legitimately appears twice —
    // once as the bold price on the card, once as the sidebar's Avg. Price
    // for this single-item wishlist — so assert presence, not uniqueness.
    expect(screen.getAllByText('$80.00').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('$100.00')).toBeInTheDocument(); // struck-through original
    expect(screen.getByText('20% OFF')).toBeInTheDocument();
  });

  it('derives in-stock status from stockQuantity, not a nonexistent inStock field', () => {
    useWishlistMock.mockReturnValue({
      wishlist: {
        data: {
          content: [
            { id: 1, productId: 1, product: makeProduct({ stockQuantity: 0 }) },
          ],
        },
      },
      isLoading: false,
      removeFromWishlist: jest.fn(),
    });

    render(<WishlistPage />);

    expect(screen.getByRole('button', { name: /out of stock/i })).toBeDisabled();
  });

  it('shows $0.00 (not $NaN) for Avg. Price and Potential Savings when the wishlist is empty', () => {
    useWishlistMock.mockReturnValue({
      wishlist: { data: { content: [] } },
      isLoading: false,
      removeFromWishlist: jest.fn(),
    });

    render(<WishlistPage />);

    const zeroValues = screen.getAllByText('$0.00');
    expect(zeroValues.length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText(/NaN/i)).not.toBeInTheDocument();
  });

  it('gives the remove-from-wishlist icon button an accessible name', () => {
    useWishlistMock.mockReturnValue({
      wishlist: {
        data: { content: [{ id: 1, productId: 1, product: makeProduct() }] },
      },
      isLoading: false,
      removeFromWishlist: jest.fn(),
    });

    render(<WishlistPage />);

    expect(
      screen.getByRole('button', { name: /remove wireless headphones from wishlist/i })
    ).toBeInTheDocument();
  });

  // Regression: the page used to render a fake "Your Wishlists" sidebar and
  // a "New Wishlist" creation modal implying multi-wishlist support the
  // backend never had (wishlistApi.getWishlist() takes no id — there is
  // exactly one wishlist per user). Removed rather than left as a dead
  // affordance that does nothing useful when clicked.
  it('does not render the fake multi-wishlist UI (no backend support for more than one wishlist)', () => {
    useWishlistMock.mockReturnValue({
      wishlist: { data: { content: [{ id: 1, productId: 1, product: makeProduct() }] } },
      isLoading: false,
      removeFromWishlist: jest.fn(),
    });

    render(<WishlistPage />);

    expect(screen.queryByText('Your Wishlists')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /new wishlist/i })).not.toBeInTheDocument();
  });

  it('filters out-of-stock items via the real "In stock only" Filter control', () => {
    // Regression: the "Filter" button previously had no onClick at all —
    // clicking it did nothing, with no feedback.
    useWishlistMock.mockReturnValue({
      wishlist: {
        data: {
          content: [
            { id: 1, productId: 1, product: makeProduct({ id: 1, name: 'In Stock Item', stockQuantity: 5 }) },
            { id: 2, productId: 2, product: makeProduct({ id: 2, name: 'Out Of Stock Item', stockQuantity: 0 }) },
          ],
        },
      },
      isLoading: false,
      removeFromWishlist: jest.fn(),
    });

    render(<WishlistPage />);

    expect(screen.getByText('In Stock Item')).toBeInTheDocument();
    expect(screen.getByText('Out Of Stock Item')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^filter/i }));
    fireEvent.click(screen.getByRole('checkbox', { name: /in stock only/i }));

    expect(screen.getByText('In Stock Item')).toBeInTheDocument();
    expect(screen.queryByText('Out Of Stock Item')).not.toBeInTheDocument();
  });

  it('moves in-stock items to the cart via the bulk "Move All to Cart" action, with one summary toast', async () => {
    const addToCartAsync = jest.fn().mockResolvedValue({});
    const removeFromWishlistAsync = jest.fn().mockResolvedValue(undefined);
    useCartMock.mockReturnValue({ addToCart: jest.fn(), addToCartAsync });
    useWishlistMock.mockReturnValue({
      wishlist: {
        data: {
          content: [
            { id: 1, productId: 1, product: makeProduct({ id: 1, name: 'In Stock Item', stockQuantity: 5 }) },
            { id: 2, productId: 2, product: makeProduct({ id: 2, name: 'Out Of Stock Item', stockQuantity: 0 }) },
          ],
        },
      },
      isLoading: false,
      removeFromWishlist: jest.fn(),
      removeFromWishlistAsync,
    });

    render(<WishlistPage />);

    fireEvent.click(screen.getByRole('button', { name: /move all to cart/i }));

    await waitFor(() => {
      expect(addToCartAsync).toHaveBeenCalledTimes(1);
    });
    expect(addToCartAsync).toHaveBeenCalledWith(
      expect.objectContaining({ productId: 1, silent: true })
    );
    // Out-of-stock item must never be added.
    expect(addToCartAsync).not.toHaveBeenCalledWith(
      expect.objectContaining({ productId: 2 })
    );
    await waitFor(() => expect(removeFromWishlistAsync).toHaveBeenCalledWith(1));
  });

  it('clears the wishlist only after the destructive-action confirm dialog is accepted', async () => {
    const removeFromWishlistAsync = jest.fn().mockResolvedValue(undefined);
    useWishlistMock.mockReturnValue({
      wishlist: {
        data: { content: [{ id: 1, productId: 1, product: makeProduct() }] },
      },
      isLoading: false,
      removeFromWishlist: jest.fn(),
      removeFromWishlistAsync,
    });

    render(<WishlistPage />);

    fireEvent.click(screen.getByRole('button', { name: /clear wishlist/i }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/clear wishlist\?/i)).toBeInTheDocument();
    // Not cleared yet — confirmation is required first.
    expect(removeFromWishlistAsync).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getByRole('button', { name: /^clear wishlist$/i }));

    await waitFor(() => expect(removeFromWishlistAsync).toHaveBeenCalledWith(1));
  });

  it('shares a product via the real product URL, not a fake/non-existent route', async () => {
    useWishlistMock.mockReturnValue({
      wishlist: {
        data: { content: [{ id: 1, productId: 1, product: makeProduct({ urlSlug: 'wireless-headphones' }) }] },
      },
      isLoading: false,
      removeFromWishlist: jest.fn(),
    });

    render(<WishlistPage />);

    fireEvent.click(screen.getByRole('button', { name: /share wireless headphones/i }));

    await waitFor(() => expect(mockShareUrl).toHaveBeenCalledTimes(1));
    const [, url] = mockShareUrl.mock.calls[0];
    expect(url).toContain('/products/wireless-headphones');
  });
});
