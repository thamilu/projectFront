import { renderHook, act } from '@testing-library/react';
import { useSellerHeaderSearch } from '@/features/seller/hooks/useSellerHeaderSearch';
import { trackEvent } from '@/core/providers/analytics-provider';
import { toast } from 'sonner';

jest.mock('@/core/providers/analytics-provider', () => ({
  trackEvent: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: { info: jest.fn() },
}));

describe('useSellerHeaderSearch Hook', () => {
  const originalPlatform = navigator.platform;

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(navigator, 'platform', {
      value: originalPlatform,
      writable: true,
    });
  });

  afterAll(() => {
    Object.defineProperty(navigator, 'platform', {
      value: originalPlatform,
      writable: true,
    });
  });

  it('should initialize with correct default states', () => {
    const { result } = renderHook(() => useSellerHeaderSearch());
    expect(result.current.searchQuery).toBe('');
    expect(result.current.isPending).toBe(false);
  });

  it('should limit searchQuery to 200 characters', () => {
    const { result } = renderHook(() => useSellerHeaderSearch());
    const longQuery = 'a'.repeat(300);

    act(() => {
      result.current.setSearchQuery(longQuery);
    });

    expect(result.current.searchQuery).toHaveLength(200);
  });

  // Regression: this previously navigated to /seller/search — a route that
  // doesn't exist anywhere in the app (confirmed via glob across app/) —
  // so every seller search submission actually 404'd. No seller-wide
  // search page or backend endpoint exists yet, so submitting now shows an
  // honest "coming soon" notice instead of a broken link.
  it('shows a coming-soon notice instead of navigating to a non-existent search route', () => {
    const onSearchComplete = jest.fn();
    const { result } = renderHook(() => useSellerHeaderSearch(onSearchComplete));

    act(() => {
      result.current.setSearchQuery('   macbook pro   ');
    });

    const event = { preventDefault: jest.fn() } as unknown as React.FormEvent;

    act(() => {
      result.current.handleSearchSubmit(event);
    });

    expect(event.preventDefault).toHaveBeenCalled();
    expect(toast.info).toHaveBeenCalledWith('Seller search is coming soon.');
    expect(onSearchComplete).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith('seller_search', {
      query: 'macbook pro',
      source: 'mobile',
    });
  });

  it('does not show the coming-soon notice if search query is empty', () => {
    const { result } = renderHook(() => useSellerHeaderSearch());
    const event = { preventDefault: jest.fn() } as unknown as React.FormEvent;

    act(() => {
      result.current.handleSearchSubmit(event);
    });

    expect(toast.info).not.toHaveBeenCalled();
  });

  it('should set shortcutKey to ⌘K on macOS systems', () => {
    Object.defineProperty(navigator, 'platform', {
      value: 'MacIntel',
      writable: true,
    });

    const { result } = renderHook(() => useSellerHeaderSearch());
    expect(result.current.shortcutKey).toBe('⌘K');
  });

  it('should set shortcutKey to Ctrl+K on Windows systems', () => {
    Object.defineProperty(navigator, 'platform', {
      value: 'Win32',
      writable: true,
    });

    const { result } = renderHook(() => useSellerHeaderSearch());
    expect(result.current.shortcutKey).toBe('Ctrl+K');
  });
});
