import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { SellerLayoutClient } from '@/app/(seller)/seller/SellerLayoutClient';

// Mock routing hooks
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useRouter: () => ({
    push: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

// Mock layout components
jest.mock('@/features/seller/components/layout/header', () => ({
  SellerHeader: ({ onMenuClick }: { onMenuClick?: () => void }) => (
    <header data-testid="mock-header">
      <button data-testid="menu-toggle" onClick={onMenuClick}>
        Toggle Menu
      </button>
    </header>
  ),
}));

jest.mock('@/features/seller/components/layout/sidebar', () => ({
  SellerSidebar: ({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) => (
    <aside data-testid="mock-sidebar" data-is-open={isOpen}>
      <button data-testid="close-sidebar-btn" onClick={onClose}>
        Close Sidebar
      </button>
    </aside>
  ),
}));

jest.mock('@/core/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

// Mock FocusTrap to avoid ref/DOM issues in JSDOM testing environments
jest.mock('focus-trap-react', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="focus-trap">{children}</div>
  ),
}));

describe('SellerLayoutClient Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default desktop viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    // Mock matchMedia for useMediaQuery and useReducedMotion hooks
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

  it('renders the header always', async () => {
    (usePathname as jest.Mock).mockReturnValue('/seller/dashboard');
    render(
      <SellerLayoutClient>
        <div data-testid="child-content">Content</div>
      </SellerLayoutClient>
    );

    expect(await screen.findByTestId('mock-header')).toBeInTheDocument();
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('shows the sidebar when not on the onboarding page', async () => {
    (usePathname as jest.Mock).mockReturnValue('/seller/dashboard');
    render(
      <SellerLayoutClient>
        <div>Content</div>
      </SellerLayoutClient>
    );

    expect(await screen.findByTestId('mock-sidebar')).toBeInTheDocument();
  });

  it('hides the sidebar navigation when on the onboarding registration page', () => {
    (usePathname as jest.Mock).mockReturnValue('/seller/register');
    render(
      <SellerLayoutClient>
        <div>Content</div>
      </SellerLayoutClient>
    );

    expect(screen.queryByTestId('mock-sidebar')).not.toBeInTheDocument();
  });

  it('opens and closes sidebar via overlay and escape key', async () => {
    (usePathname as jest.Mock).mockReturnValue('/seller/dashboard');
    render(
      <SellerLayoutClient>
        <div>Content</div>
      </SellerLayoutClient>
    );

    // Sidebar overlay should not be in document initially
    expect(screen.queryByTestId('overlay')).not.toBeInTheDocument();

    // Toggle menu to open
    fireEvent.click(screen.getByTestId('menu-toggle'));

    // Overlay should now be in the document
    expect(screen.getByTestId('overlay')).toBeInTheDocument();

    // Close via overlay click
    fireEvent.click(screen.getByTestId('overlay'));
    expect(screen.queryByTestId('overlay')).not.toBeInTheDocument();

    // Open again
    fireEvent.click(screen.getByTestId('menu-toggle'));
    expect(screen.getByTestId('overlay')).toBeInTheDocument();

    // Close via escape key press
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByTestId('overlay')).not.toBeInTheDocument();
  });

  it('announces route changes to screen readers', async () => {
    (usePathname as jest.Mock).mockReturnValue('/seller/dashboard');
    const { rerender } = render(
      <SellerLayoutClient>
        <div>Content</div>
      </SellerLayoutClient>
    );

    // Should announce dashboard
    const statusRegion = screen.getByRole('status');
    expect(statusRegion).toHaveTextContent(/Navigated to Dashboard page/i);

    // Rerender with products path
    (usePathname as jest.Mock).mockReturnValue('/seller/products');
    rerender(
      <SellerLayoutClient>
        <div>Content</div>
      </SellerLayoutClient>
    );

    expect(statusRegion).toHaveTextContent(/Navigated to Products page/i);
  });

  it('prevents body scroll and sets inert/aria-hidden attributes on mobile when sidebar is open', () => {
    // Set isMobile to true by mocking mobile viewport size
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500, // Mobile width < 768
    });

    (usePathname as jest.Mock).mockReturnValue('/seller/dashboard');

    render(
      <SellerLayoutClient>
        <div>Content</div>
      </SellerLayoutClient>
    );

    // Open sidebar
    fireEvent.click(screen.getByTestId('menu-toggle'));

    // Scroll lock applied to body
    expect(document.body.style.overflow).toBe('hidden');

    // Queried by test id, not by role="main": the seller layout no longer
    // renders its own <main>, because the root layout owns the document's
    // single main landmark. The behaviour under test — the content region
    // becoming inert while the mobile sidebar traps focus — is unchanged.
    const mainContent = screen.getByTestId('seller-content');
    expect(mainContent).toHaveAttribute('inert');
    expect(mainContent).toHaveAttribute('aria-hidden', 'true');

    // Close sidebar
    fireEvent.click(screen.getByTestId('overlay'));

    // Scroll lock removed
    expect(document.body.style.overflow).toBe('');
    expect(mainContent).not.toHaveAttribute('inert');
    expect(mainContent).not.toHaveAttribute('aria-hidden');
  });
});
