import { renderHook, act } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { useSellerLayout } from '@/features/seller/hooks/useSellerLayout';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

describe('useSellerLayout Hook', () => {
  let mainElement: HTMLElement;
  let mainRef: { current: HTMLElement };

  beforeEach(() => {
    jest.clearAllMocks();
    mainElement = document.createElement('main');
    mainElement.focus = jest.fn();
    mainElement.scrollTo = jest.fn();
    mainRef = { current: mainElement };

    // Default desktop viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    // Mock matchMedia
    window.matchMedia = jest.fn().mockImplementation((query: string) => ({
      matches: query.includes('max-width') ? window.innerWidth < 768 : false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
  });

  it('should initialize with correct default states', () => {
    (usePathname as jest.Mock).mockReturnValue('/seller/dashboard');
    const { result } = renderHook(() => useSellerLayout({ mainRef }));

    expect(result.current.isSidebarOpen).toBe(false);
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isOnboarding).toBe(false);
    expect(result.current.routeAnnouncement).toBe('Navigated to Dashboard page');
  });

  it('should detect onboarding registration page correctly', () => {
    (usePathname as jest.Mock).mockReturnValue('/seller/register');
    const { result } = renderHook(() => useSellerLayout({ mainRef }));

    expect(result.current.isOnboarding).toBe(true);
    expect(result.current.routeAnnouncement).toBe('Navigated to Register Onboarding page');
  });

  it('should open and close the sidebar', () => {
    (usePathname as jest.Mock).mockReturnValue('/seller/dashboard');
    const { result } = renderHook(() => useSellerLayout({ mainRef }));

    act(() => {
      result.current.toggleSidebar();
    });
    expect(result.current.isSidebarOpen).toBe(true);

    act(() => {
      result.current.closeSidebar();
    });
    expect(result.current.isSidebarOpen).toBe(false);
  });

  it('should close sidebar on route changes', () => {
    (usePathname as jest.Mock).mockReturnValue('/seller/dashboard');
    const { result, rerender } = renderHook(() => useSellerLayout({ mainRef }));

    act(() => {
      result.current.toggleSidebar();
    });
    expect(result.current.isSidebarOpen).toBe(true);

    // Simulate route change by updating pathname mock and rerendering
    (usePathname as jest.Mock).mockReturnValue('/seller/products');
    rerender();

    expect(result.current.isSidebarOpen).toBe(false);
  });

  it('should apply screen reader and focus behaviors on route changes', () => {
    (usePathname as jest.Mock).mockReturnValue('/seller/products');
    const { result } = renderHook(() => useSellerLayout({ mainRef }));

    expect(mainElement.focus).toHaveBeenCalled();
    expect(mainElement.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    expect(result.current.routeAnnouncement).toBe('Navigated to Products page');
  });

  it('should handle mobile viewports correctly', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500,
    });
    (usePathname as jest.Mock).mockReturnValue('/seller/dashboard');

    const { result } = renderHook(() => useSellerLayout({ mainRef }));
    expect(result.current.isMobile).toBe(true);
  });
});
