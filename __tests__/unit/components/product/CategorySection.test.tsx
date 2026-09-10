import { render, screen } from '@testing-library/react';
import { CategorySection } from '@/features/products/components/CategorySection';
import { productApi } from '@/features/products/api/product-api';
import { isBackendAvailable } from '@/core/client/backend-health';

jest.mock('@/core/client/backend-health', () => ({
  isBackendAvailable: jest.fn(),
}));

jest.mock('@/features/products/api/product-api', () => ({
  productApi: { getCategories: jest.fn() },
  isBackendDown: jest.fn(() => false),
}));

describe('CategorySection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders real categories without a Preview badge when the backend responds', async () => {
    (isBackendAvailable as jest.Mock).mockResolvedValue(true);
    (productApi.getCategories as jest.Mock).mockResolvedValue([
      { id: 1, name: 'Electronics', description: 'Gadgets' },
      { id: 2, name: 'Fashion', description: 'Clothes' },
    ]);

    render(await CategorySection());

    expect(screen.getByText('Electronics')).toBeInTheDocument();
    expect(screen.queryByText(/preview/i)).not.toBeInTheDocument();
  });

  // Regression: falls back to demo categories, and — unlike before this
  // pass — visibly marks them as a preview rather than presenting static
  // fallback data as if it were live.
  it('renders fallback categories tagged with a Preview badge when the backend is unavailable', async () => {
    (isBackendAvailable as jest.Mock).mockResolvedValue(false);

    render(await CategorySection());

    expect(screen.getByText('Electronics')).toBeInTheDocument();
    expect(screen.getAllByText(/preview/i).length).toBeGreaterThan(0);
  });

  // Regression: "Home & Living" previously slugified to "home-living" and
  // matched no entry in CATEGORY_UI_CONFIG (which only had "home"), silently
  // falling back to the generic default icon.
  it('resolves an icon for "Home & Living" rather than falling back to the default', async () => {
    (isBackendAvailable as jest.Mock).mockResolvedValue(true);
    (productApi.getCategories as jest.Mock).mockResolvedValue([
      { id: 3, name: 'Home & Living', description: 'Cozy spaces' },
    ]);

    const { container } = render(await CategorySection());

    // The default/fallback icon tile uses the slate gradient; a resolved
    // "Home & Living" match uses the emerald gradient instead.
    const tile = container.querySelector('.bg-gradient-to-br');
    expect(tile?.className).toContain('emerald');
  });
});
