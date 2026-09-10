import React from 'react';
import { render, screen } from '@testing-library/react';
import { Header } from '@/shared/ui/layout/header';
import { TooltipProvider } from '@/shared/ui/atoms/tooltip';

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({ data: null, status: 'unauthenticated' })),
  getSession: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

// Mock notifications feature
jest.mock('@/features/notifications', () => ({
  useNotifications: () => ({
    notifications: [],
    isLoading: false,
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
  }),
}));

// Mock custom hooks
const mockUseHeaderAuth = jest.fn();
const mockUseScrollShadow = jest.fn();
const mockUseProtectedNavigate = jest.fn();

jest.mock('@/shared/ui/layout/header/hooks/use-header-auth', () => ({
  useHeaderAuth: () => mockUseHeaderAuth(),
}));

jest.mock('@/shared/ui/layout/header/hooks/use-scroll-shadow', () => ({
  useScrollShadow: () => mockUseScrollShadow(),
}));

jest.mock('@/shared/ui/layout/header/hooks/use-protected-navigate', () => ({
  useProtectedNavigate: () => mockUseProtectedNavigate(),
}));

jest.mock('@/shared/hooks', () => ({
  useMounted: () => true,
  useReducedMotion: () => false,
  useBodyScrollLock: jest.fn(),
  useFocusOnChange: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('@/core/feature-flags', () => ({
  useFeatureFlags: () => ({
    isEnabled: () => false,
  }),
}));

jest.mock('@/core/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

// HeaderCartButton/HeaderWishlistButton read from the real React Query-backed
// cart/wishlist hooks (see features/cart/hooks/use-cart.ts and
// features/wishlist/hooks/use-wishlist.ts) rather than a client-only store,
// so — consistent with every other Header dependency in this file — they're
// mocked directly rather than wrapping the tree in a QueryClientProvider.
jest.mock('@/features/cart/hooks/use-cart', () => ({
  useCart: () => ({
    cart: null,
    items: [],
    itemCount: 0,
    total: 0,
    isLoading: false,
    addToCart: jest.fn(),
    updateCartItem: jest.fn(),
    removeCartItem: jest.fn(),
    clearCart: jest.fn(),
    isAdding: false,
    isUpdating: false,
    isRemoving: false,
  }),
}));

jest.mock('@/features/wishlist/hooks/use-wishlist', () => ({
  useWishlist: () => ({
    wishlist: null,
    items: [],
    isLoading: false,
    isInWishlist: () => false,
    isMutating: false,
    addToWishlist: jest.fn(),
    removeFromWishlist: jest.fn(),
  }),
}));

describe('Header Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();

    mockUseHeaderAuth.mockReturnValue({
      currentUser: null,
      isUserAuthenticated: false,
      isSeller: false,
      isDeliveryAgent: false,
      isPending: false,
      handleLogin: jest.fn(),
      handleLogout: jest.fn(),
    });

    mockUseScrollShadow.mockReturnValue(false);

    mockUseProtectedNavigate.mockReturnValue({
      dialogOpen: false,
      dialogTarget: null,
      handleProtectedNavigate: jest.fn(),
      handleSellClick: jest.fn(),
      handleCloseDialog: jest.fn(),
      handleWishlistClick: jest.fn(),
    });
  });

  it('renders the site header with search, notifications, and navigation items', () => {
    render(
      <TooltipProvider>
        <Header />
      </TooltipProvider>
    );

    expect(screen.getByTestId('site-header')).toBeInTheDocument();
    expect(screen.getByRole('search')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cart/i })).toBeInTheDocument();
  });

  it('should render the redirecting screen overlay when isPending is true', () => {
    mockUseHeaderAuth.mockReturnValue({
      currentUser: null,
      isUserAuthenticated: false,
      isSeller: false,
      isDeliveryAgent: false,
      isPending: true,
      handleLogin: jest.fn(),
      handleLogout: jest.fn(),
    });

    render(
      <TooltipProvider>
        <Header />
      </TooltipProvider>
    );

    expect(screen.queryByTestId('site-header')).not.toBeInTheDocument();
  });
});
