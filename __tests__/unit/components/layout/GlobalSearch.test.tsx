import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { HeaderSearch } from '@/shared/ui/layout/header/parts/header-search';
import { trackEvent } from '@/core/providers/analytics-provider';
import { apiClient } from '@/core/client';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock('@/core/providers/analytics-provider', () => ({
  trackEvent: jest.fn(),
}));

jest.mock('@/core/client', () => ({
  apiClient: {
    get: jest.fn(),
  },
}));

describe('GlobalSearch Component & useGlobalSearch Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        suggestions: ['laptop', 'laptop pro edition'],
        products: [],
      }),
    }) as jest.Mock;
    // Trending searches (fetched once on mount via apiClient, not `fetch`) —
    // default to empty so tests that don't care about trending stay quiet.
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { content: [] } });
  });

  it('renders search input with placeholder and category combobox selector', () => {
    render(<HeaderSearch />);

    expect(screen.getByRole('search')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/search products, brands, categories/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/select category filter/i)).toBeInTheDocument();
  });

  it('focuses search input when Ctrl+K is pressed globally', () => {
    render(<HeaderSearch />);

    const input = screen.getByPlaceholderText(/search products, brands, categories/i);
    fireEvent.keyDown(window, { ctrlKey: true, key: 'k' });

    expect(document.activeElement).toBe(input);
  });

  it('focuses search input when / is pressed outside inputs', () => {
    render(<HeaderSearch />);

    const input = screen.getByPlaceholderText(/search products, brands, categories/i);
    fireEvent.keyDown(window, { key: '/' });

    expect(document.activeElement).toBe(input);
  });

  it('displays suggestions when user types a query', async () => {
    render(<HeaderSearch />);

    const input = screen.getByPlaceholderText(/search products, brands, categories/i);
    fireEvent.change(input, { target: { value: 'laptop' } });

    await waitFor(
      () => {
        expect(screen.getByText('laptop')).toBeInTheDocument();
        expect(screen.getByText(/laptop pro edition/i)).toBeInTheDocument();
      },
      { timeout: 1500 }
    );
  });

  // Regression: suggestions used to be fabricated client-side by
  // string-templating whatever the user typed (`${query}`, `${query} Pro
  // edition`) via a setTimeout, with an AbortController that only ever
  // aborted that timeout — never a real network call. Assert the real BFF
  // route is hit instead.
  it('fetches live suggestions from the real /api/search/suggest route', async () => {
    render(<HeaderSearch />);

    const input = screen.getByPlaceholderText(/search products, brands, categories/i);
    fireEvent.change(input, { target: { value: 'laptop' } });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/^\/api\/search\/suggest\?q=laptop&size=8$/),
        expect.objectContaining({ signal: expect.anything() })
      );
    });
  });

  it('does not fetch suggestions for a single-character query (matches the route\'s 2-char minimum)', async () => {
    render(<HeaderSearch />);

    const input = screen.getByPlaceholderText(/search products, brands, categories/i);
    fireEvent.change(input, { target: { value: 'a' } });

    await new Promise((resolve) => setTimeout(resolve, 300));

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('clears suggestions instead of showing fake data when the suggest request fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 500 });

    render(<HeaderSearch />);

    const input = screen.getByPlaceholderText(/search products, brands, categories/i);
    fireEvent.change(input, { target: { value: 'laptop' } });

    await waitFor(
      () => {
        expect(within(screen.getByRole('listbox')).queryAllByRole('option')).toHaveLength(0);
        expect(screen.queryByText(/searching suggestions/i)).not.toBeInTheDocument();
      },
      { timeout: 2000 }
    );
    expect(screen.queryByText('laptop')).not.toBeInTheDocument();
  });

  it('submits search on Enter and navigates with encoded query', async () => {
    render(<HeaderSearch />);

    const input = screen.getByPlaceholderText(/search products, brands, categories/i);
    fireEvent.change(input, { target: { value: 'shoes' } });

    const form = screen.getByRole('search');
    fireEvent.submit(form);

    expect(mockPush).toHaveBeenCalledWith('/search?q=shoes');
  });

  // Regression: useGlobalSearch previously fired no analytics events at all —
  // search behavior (typed vs. suggestion vs. recent vs. trending) was
  // completely invisible to product analytics.
  it('tracks a search_submitted analytics event with the selection source', async () => {
    render(<HeaderSearch />);

    const input = screen.getByPlaceholderText(/search products, brands, categories/i);
    fireEvent.change(input, { target: { value: 'shoes' } });
    fireEvent.submit(screen.getByRole('search'));

    expect(trackEvent).toHaveBeenCalledWith('search_submitted', {
      query: 'shoes',
      category: 'all',
      source: 'typed',
    });
  });

  // Regression: "Trending Now" used to be a hardcoded array of 4 fake
  // strings, unrelated to the actual catalog. It should now come from the
  // real top-selling-products endpoint.
  it('renders trending searches sourced from real top-selling products', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({
      data: { content: [{ id: 1, name: 'Wireless Earbuds' }, { id: 2, name: 'Yoga Mat' }] },
    });

    render(<HeaderSearch />);
    fireEvent.focus(screen.getByPlaceholderText(/search products, brands, categories/i));

    await waitFor(() => {
      expect(screen.getByText('Wireless Earbuds')).toBeInTheDocument();
      expect(screen.getByText('Yoga Mat')).toBeInTheDocument();
    });
  });

  it('hides the Trending Now section when there are no trending products', async () => {
    render(<HeaderSearch />);
    fireEvent.focus(screen.getByPlaceholderText(/search products, brands, categories/i));

    await waitFor(() => {
      expect(screen.queryByText(/trending now/i)).not.toBeInTheDocument();
    });
  });

  it('closes suggestions when Escape key is pressed', async () => {
    render(<HeaderSearch />);

    const input = screen.getByPlaceholderText(/search products, brands, categories/i);
    fireEvent.change(input, { target: { value: 'keyboard' } });

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    fireEvent.keyDown(input, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });
});
