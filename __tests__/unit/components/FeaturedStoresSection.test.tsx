import { render, screen } from '@testing-library/react';
import { FeaturedStoresSection } from '@/features/seller/components/FeaturedStoresSection';
import { apiClient } from '@/core/client';

// Mock the next/cache module to bypass server caching during tests
jest.mock('next/cache', () => ({
  unstable_cache: (fn: unknown) => fn,
}));


// Mock the core client API instance
jest.mock('@/core/client', () => ({
  apiClient: {
    get: jest.fn(),
  },
}));

const mockStores = [
  {
    id: 1,
    shopName: 'Green Organic Store',
    description: 'Fresh organic fruits and vegetables straight to your door.',
    logoUrl: 'https://example.com/logo1.png',
    productCount: 15,
    rating: 4.8,
  },
  {
    id: 2,
    shopName: 'Tech Hub Solutions',
    description: 'Affordable electronics and computer accessories.',
    logoUrl: null, // Test initials fallback
    productCount: 1, // Test singular pluralization
    rating: 4.2,
  },
];

describe('FeaturedStoresSection Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders section and store cards successfully when stores are returned', async () => {
    // Mock successful stores API response (in both data/content wrapper formats)
    (apiClient.get as jest.Mock).mockResolvedValue({
      data: {
        content: mockStores,
      },
    });

    // Resolve the async Server Component
    const component = await FeaturedStoresSection();
    render(component);

    // Verify main section is present
    expect(screen.getByTestId('featured-stores-section')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /featured stores/i, level: 2 })
    ).toBeInTheDocument();

    // Verify stores list exists
    const list = screen.getByTestId('featured-stores-list');
    expect(list).toBeInTheDocument();
    expect(list.tagName).toBe('UL'); // Must use semantic list wrapper

    // Verify list items count
    const listItems = list.querySelectorAll('li');
    expect(listItems).toHaveLength(2);

    // Verify first store contents (with logo)
    expect(screen.getByText('Green Organic Store')).toBeInTheDocument();
    expect(
      screen.getByText('Fresh organic fruits and vegetables straight to your door.')
    ).toBeInTheDocument();
    expect(screen.getByText('15 Products')).toBeInTheDocument();

    // Verify image is rendered for Green Organic Store
    const image = screen.getByAltText('Green Organic Store logo');
    expect(image).toBeInTheDocument();

    // Verify second store contents (without logo, tests initials fallback and singular pluralization)
    expect(screen.getByText('Tech Hub Solutions')).toBeInTheDocument();
    expect(screen.getByText('1 Product')).toBeInTheDocument(); // Correct singular output
    expect(screen.getByText('TH')).toBeInTheDocument(); // Initials fallback

    // Verify star rating accessibility labels are formatted correctly
    expect(screen.getByLabelText('Rating: 4.8 out of 5')).toBeInTheDocument();
    expect(screen.getByLabelText('Rating: 4.2 out of 5')).toBeInTheDocument();
  });

  it('renders EmptyStores view when API returns empty content', async () => {
    // Mock empty response
    (apiClient.get as jest.Mock).mockResolvedValue({
      data: [],
    });

    const component = await FeaturedStoresSection();
    render(component);

    expect(screen.getByTestId('featured-stores-section')).toBeInTheDocument();
    expect(screen.getByTestId('featured-stores-empty')).toBeInTheDocument();
    expect(screen.getByText('No stores yet')).toBeInTheDocument();

    // Verify register route CTA link
    const ctaLink = screen.getByRole('link', { name: /open your store/i });
    expect(ctaLink).toBeInTheDocument();
    expect(ctaLink).toHaveAttribute('href', '/become-seller');
  });

  it('renders EmptyStores view gracefully when API throws an error', async () => {
    // Mock API crash
    (apiClient.get as jest.Mock).mockRejectedValue(new Error('Network error'));

    const component = await FeaturedStoresSection();
    render(component);

    expect(screen.getByTestId('featured-stores-section')).toBeInTheDocument();
    expect(screen.getByTestId('featured-stores-empty')).toBeInTheDocument();
  });
});
