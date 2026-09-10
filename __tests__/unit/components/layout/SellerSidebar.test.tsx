import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SellerSidebar } from '@/features/seller/components/layout/sidebar';
import { usePermissions } from '@/features/auth/hooks/use-permissions';
import { useMediaQuery } from '@/shared/hooks/use-media-query';
import { useReducedMotion } from '@/shared/hooks/use-reduced-motion';
import { trackEvent } from '@/core/providers/analytics-provider';

// ── Mocks ─────────────────────────────────────────────────────

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => '/seller/dashboard',
}));

jest.mock('@/core/i18n', () => ({
  useI18n: () => ({
    t: (key: string, defaultVal?: string) => {
      const translations: Record<string, string> = {
        'seller.sidebar.skipToMain': 'Skip to main content',
        'seller.sidebar.expand': 'Expand sidebar',
        'seller.sidebar.collapse': 'Collapse sidebar',
        'seller.sidebar.close': 'Close sidebar',
        'seller.sidebar.panelLabel': 'Seller Panel',
        'seller.sidebar.unreadBadge': 'unread',
        'seller.sidebar.unreadSuffix': 'unread',
        'seller.sidebar.nav.dashboard': 'Dashboard',
        'seller.sidebar.nav.products': 'Products',
        'seller.sidebar.nav.catalog': 'Shared Catalog',
        'seller.sidebar.nav.inventory': 'Inventory',
        'seller.sidebar.nav.orders': 'Orders',
        'seller.sidebar.nav.storeProfile': 'Store Profile',
        'seller.sidebar.nav.profile': 'My Profile',
        'seller.sidebar.nav.settings': 'Settings',
        'seller.sidebar.nav.backToShop': 'Back to Shop',
      };
      if (typeof defaultVal === 'object') {
        return key;
      }
      return translations[key] ?? defaultVal ?? key;
    },
  }),
}));

jest.mock('@/features/auth/hooks/use-permissions', () => ({
  usePermissions: jest.fn(),
}));

jest.mock('@/shared/hooks/use-media-query', () => ({
  useMediaQuery: jest.fn(),
}));

jest.mock('@/shared/hooks/use-reduced-motion', () => ({
  useReducedMotion: jest.fn(),
}));

jest.mock('@/core/providers/analytics-provider', () => ({
  trackEvent: jest.fn(),
}));

// Mock Tooltip component to simplify testing structure
jest.mock('@/shared/ui/atoms/tooltip', () => {
  return {
    TooltipProvider: ({ children }: { children: React.ReactNode }) => children,
    Tooltip: ({ children }: { children: React.ReactNode }) => children,
    TooltipTrigger: ({ children }: { children: React.ReactNode; asChild?: boolean }) => children,
    TooltipContent: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="tooltip-content">{children}</div>
    ),
  };
});

describe('SellerSidebar Component', () => {
  let hasPermissionMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();

    hasPermissionMock = jest.fn().mockReturnValue(true);
    (usePermissions as jest.Mock).mockReturnValue({
      hasPermission: hasPermissionMock,
    });

    (useMediaQuery as jest.Mock).mockReturnValue(false); // Default to desktop (not mobile)
    (useReducedMotion as jest.Mock).mockReturnValue(false); // Default to motion enabled
  });

  // ── Rendering & Basic Layout ────────────────────────────────

  it('renders skip to main link and basic aside shell with landmark label', () => {
    render(<SellerSidebar />);
    const skipLink = screen.getByText('Skip to main content');
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');

    const aside = screen.getByRole('complementary');
    expect(aside).toBeInTheDocument();
    expect(aside).toHaveAttribute('aria-label', 'Seller Panel');
    expect(aside).toHaveAttribute('id', 'seller-sidebar');
  });

  it('renders all sidebar navigation links', () => {
    render(<SellerSidebar />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Products')).toBeInTheDocument();
    expect(screen.getByText('Shared Catalog')).toBeInTheDocument();
    expect(screen.getByText('Inventory')).toBeInTheDocument();
    expect(screen.getByText('Orders')).toBeInTheDocument();
    expect(screen.getByText('Store Profile')).toBeInTheDocument();
    expect(screen.getByText('My Profile')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Back to Shop')).toBeInTheDocument();
  });

  it('sets aria-current="page" on the active pathname link', () => {
    render(<SellerSidebar />);
    const dashboardLink = screen.getByRole('link', { name: /Dashboard/ });
    expect(dashboardLink).toHaveAttribute('aria-current', 'page');

    const productsLink = screen.getByRole('link', { name: /Products/ });
    expect(productsLink).not.toHaveAttribute('aria-current');
  });

  // ── Collapse & Local Storage Persistence ───────────────────

  it('starts expanded by default and can toggle to collapsed state, persisting to localStorage', () => {
    render(<SellerSidebar />);
    const aside = screen.getByRole('complementary');
    expect(aside).toHaveClass('w-64');

    const toggleButton = screen.getByLabelText('Collapse sidebar');
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(toggleButton);

    expect(aside).toHaveClass('w-20');
    expect(toggleButton).toHaveAttribute('aria-label', 'Expand sidebar');
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
    expect(localStorage.getItem('seller-sidebar-collapsed')).toBe('true');
    expect(trackEvent).toHaveBeenCalledWith('seller_sidebar_toggle', { collapsed: true });
  });

  it('loads collapsed state from localStorage on initialization', () => {
    localStorage.setItem('seller-sidebar-collapsed', 'true');
    render(<SellerSidebar />);
    const aside = screen.getByRole('complementary');
    expect(aside).toHaveClass('w-20');

    const toggleButton = screen.getByLabelText('Expand sidebar');
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
  });

  // ── Keyboard Shortcuts ─────────────────────────────────────

  it('toggles collapse state with Cmd/Ctrl + B shortcut key', () => {
    render(<SellerSidebar />);
    const aside = screen.getByRole('complementary');
    expect(aside).toHaveClass('w-64');

    fireEvent.keyDown(document, { metaKey: true, key: 'b' });

    expect(aside).toHaveClass('w-20');
    expect(localStorage.getItem('seller-sidebar-collapsed')).toBe('true');
    expect(trackEvent).toHaveBeenCalledWith('seller_sidebar_shortcut_toggle', { collapsed: true });
  });

  it('navigates to the corresponding link with Cmd/Ctrl + [1-6] shortcut keys', () => {
    render(<SellerSidebar />);
    fireEvent.keyDown(document, { ctrlKey: true, key: '2' }); // Products is index 1 (second item)
    expect(mockPush).toHaveBeenCalledWith('/seller/products');
    expect(trackEvent).toHaveBeenCalledWith('seller_sidebar_shortcut_navigate', {
      title: 'Products',
      href: '/seller/products',
    });
  });

  // ── Mobile Responsive Overlay Close behavior ───────────────

  it('acts as a close button overlay on mobile', () => {
    (useMediaQuery as jest.Mock).mockReturnValue(true); // Mobile viewport
    const onCloseMock = jest.fn();

    render(<SellerSidebar isOpen={true} onClose={onCloseMock} />);

    const toggleButton = screen.getByLabelText('Close sidebar');
    fireEvent.click(toggleButton);

    expect(onCloseMock).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith('seller_sidebar_mobile_close', {});
  });

  // ── Permission Based Nav Filtering ────────────────────────

  it('filters out links based on authorization permissions checks', () => {
    // Deny permission for inventory
    hasPermissionMock.mockImplementation((perm) => perm !== 'manage_inventory');

    render(<SellerSidebar />);

    expect(screen.queryByText('Inventory')).not.toBeInTheDocument();
    expect(screen.getByText('Orders')).toBeInTheDocument();
  });

  // ── Roving Tab Index Keyboard navigation ──────────────────

  it('coordinates roving tab index keyboard arrow inputs correctly', () => {
    render(<SellerSidebar />);

    // Flattened items are 16 in total (13 main + 3 bottom navs)
    const links = screen.getAllByRole('link').filter(link => link.hasAttribute('data-sidebar-link-index'));
    expect(links.length).toBe(16);

    // Active path is /seller/dashboard (first item, index 0). It should be tabIndex = 0.
    expect(links[0]).toHaveAttribute('tabindex', '0');
    expect(links[1]).toHaveAttribute('tabindex', '-1');

    // Simulate focusing the first item
    act(() => {
      links[0].focus();
    });

    // Press ArrowDown to move to Products link (index 1)
    fireEvent.keyDown(links[0], { key: 'ArrowDown' });
    expect(links[1]).toHaveAttribute('tabindex', '0');

    // Press End key to jump to bottom utility escape link (index 15)
    fireEvent.keyDown(links[1], { key: 'End' });
    expect(links[15]).toHaveAttribute('tabindex', '0');

    // Press Home key to jump back to index 0
    fireEvent.keyDown(links[15], { key: 'Home' });
    expect(links[0]).toHaveAttribute('tabindex', '0');
  });

  // ── Tooltips on collapsed viewports ────────────────────────

  it('renders tooltips for links when collapsed on desktop viewports', () => {
    localStorage.setItem('seller-sidebar-collapsed', 'true');
    render(<SellerSidebar />);

    const tooltips = screen.getAllByTestId('tooltip-content');
    expect(tooltips.length).toBeGreaterThan(0);
    expect(tooltips.some(t => t.textContent?.includes('Dashboard'))).toBe(true);
  });
});
