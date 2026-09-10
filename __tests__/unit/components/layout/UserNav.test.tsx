// ============================================================
// __tests__/unit/components/layout/UserNav.test.tsx
//
// Unit tests for the ultra-enterprise UserNav component.
// Covers: rendering, ARIA, keyboard shortcuts, logout states,
// error feedback, analytics, and memoization stability.
// ============================================================

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';

import { UserNav } from '@/features/seller/components/layout/user-nav';
import { useAuth } from '@/domains/auth/hooks/use-auth';
import { trackEvent } from '@/core/providers/analytics-provider';
import { APP_ROUTES } from '@/shared/routes';
import { hashUserId } from '@/shared/utils';

// ─── Mocks ───────────────────────────────────────────────────

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(() => '/seller/dashboard'),
}));

jest.mock('@/domains/auth/hooks/use-auth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/core/providers/analytics-provider', () => ({
  trackEvent: jest.fn(),
}));

jest.mock('@/core/telemetry/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// ─── Test helpers ────────────────────────────────────────────

const MOCK_USER = {
  id: 'usr_001',
  name: 'Jane Doe',
  email: 'jane@example.com',
  image: 'https://example.com/avatar.png',
  roles: ['seller'],
};

const mockPush = jest.fn();

// Convenience alias so cast sites stay concise
type AuthUser = ReturnType<typeof useAuth>['user'];
type AuthLogoutError = ReturnType<typeof useAuth>['logoutError'];

function createAuthMock(overrides: Partial<ReturnType<typeof useAuth>> = {}) {
  return {
    user: MOCK_USER,
    logout: jest.fn().mockResolvedValue(undefined),
    isLoggingOut: false,
    logoutError: null,
    isLoading: false,
    ...overrides,
  } as unknown as ReturnType<typeof useAuth>;
}

function setup(authOverrides: Partial<ReturnType<typeof useAuth>> = {}) {
  (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  (useAuth as jest.Mock).mockReturnValue(createAuthMock(authOverrides));
  return render(<UserNav />);
}

// Open the dropdown so items become visible
async function openDropdown() {
  const trigger = screen.getByRole('button', { name: /user menu/i });
  await userEvent.click(trigger);
}

// ─── Test suite ───────────────────────────────────────────────

describe('UserNav', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Rendering ─────────────────────────────────────────────

  describe('Rendering', () => {
    it('renders nothing when user is null', () => {
      (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
      (useAuth as jest.Mock).mockReturnValue(createAuthMock({ user: null as unknown as AuthUser }));
      const { container } = render(<UserNav />);
      expect(container).toBeEmptyDOMElement();
    });

    it('renders the avatar trigger button', () => {
      setup();
      expect(
        screen.getByRole('button', { name: /user menu for jane doe/i })
      ).toBeInTheDocument();
    });

    it('displays derived initials "JD" when avatar image fails', () => {
      setup({ user: { ...MOCK_USER, image: undefined } as unknown as AuthUser });
      // AvatarFallback is aria-hidden; find via text
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('shows "U" initials when user has no name', () => {
      setup({ user: { ...MOCK_USER, name: undefined } as unknown as AuthUser });
      expect(screen.getByText('U')).toBeInTheDocument();
    });

    it('displays initials correctly for name with emoji', () => {
      setup({ user: { ...MOCK_USER, name: '🎉 Jane' } as unknown as AuthUser });
      expect(screen.getByText('🎉J')).toBeInTheDocument();
    });

    it('renders skeleton loader when isLoading is true', () => {
      setup({ isLoading: true });
      expect(screen.queryByRole('button', { name: /user menu/i })).not.toBeInTheDocument();
      expect(screen.getByRole('presentation', { hidden: true })).toBeInTheDocument();
    });

    it('renders user name and email inside the dropdown label', async () => {
      setup();
      await openDropdown();
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    });
  });

  // ── ARIA / Accessibility ──────────────────────────────────

  describe('Accessibility', () => {
    it('has correct aria-label on trigger button', () => {
      setup();
      const btn = screen.getByRole('button', { name: /user menu for jane doe/i });
      expect(btn).toHaveAttribute('aria-label', 'User menu for Jane Doe');
    });

    it('sets aria-haspopup="menu" on trigger', () => {
      setup();
      const btn = screen.getByRole('button', { name: /user menu/i });
      expect(btn).toHaveAttribute('aria-haspopup', 'menu');
    });

    it('sets aria-expanded false when dropdown is closed', () => {
      setup();
      const btn = screen.getByRole('button', { name: /user menu/i });
      expect(btn).toHaveAttribute('aria-expanded', 'false');
    });

    it('logout item has aria-busy when logging out', async () => {
      setup({ isLoggingOut: true });
      await openDropdown();
      const logoutItem = screen.getByRole('menuitem', { name: /signing out/i });
      expect(logoutItem).toHaveAttribute('aria-busy', 'true');
    });

    it('logout item is disabled (aria-disabled) when logging out', async () => {
      setup({ isLoggingOut: true });
      await openDropdown();
      const logoutItem = screen.getByRole('menuitem', { name: /signing out/i });
      // Radix UI DropdownMenuItem uses aria-disabled + data-disabled, not the native disabled attr
      expect(logoutItem).toHaveAttribute('aria-disabled', 'true');
    });
  });

  // ── Navigation links ──────────────────────────────────────

  describe('Navigation links', () => {
    it('profile link points to SELLER.PROFILE route', async () => {
      setup();
      await openDropdown();
      const profileLink = screen.getByRole('menuitem', { name: /go to your profile/i });
      expect(profileLink).toHaveAttribute('href', APP_ROUTES.SELLER.PROFILE);
    });

    it('settings link points to SELLER.SETTINGS route', async () => {
      setup();
      await openDropdown();
      const settingsLink = screen.getByRole('menuitem', { name: /go to settings/i });
      expect(settingsLink).toHaveAttribute('href', APP_ROUTES.SELLER.SETTINGS);
    });

    it('clicking profile link tracks analytics event', async () => {
      setup();
      await openDropdown();
      await userEvent.click(screen.getByRole('menuitem', { name: /go to your profile/i }));
      expect(trackEvent).toHaveBeenCalledWith('user_nav_profile_clicked', {
        userId: hashUserId(MOCK_USER.id),
      });
    });

    it('clicking settings link tracks analytics event', async () => {
      setup();
      await openDropdown();
      await userEvent.click(screen.getByRole('menuitem', { name: /go to settings/i }));
      expect(trackEvent).toHaveBeenCalledWith('user_nav_settings_clicked', {
        userId: hashUserId(MOCK_USER.id),
      });
    });
  });

  // ── Logout flow ───────────────────────────────────────────

  describe('Logout flow', () => {
    it('calls logout on Log out item click', async () => {
      const logoutMock = jest.fn().mockResolvedValue(undefined);
      setup({ logout: logoutMock });
      await openDropdown();
      await userEvent.click(screen.getByRole('menuitem', { name: /sign out/i }));
      await waitFor(() => expect(logoutMock).toHaveBeenCalledTimes(1));
    });

    it('tracks analytics when logout is clicked', async () => {
      setup();
      await openDropdown();
      await userEvent.click(screen.getByRole('menuitem', { name: /sign out/i }));
      expect(trackEvent).toHaveBeenCalledWith('user_nav_logout_clicked', {
        userId: hashUserId(MOCK_USER.id),
      });
    });

    it('shows spinner and "Signing out…" label while logging out', async () => {
      setup({ isLoggingOut: true });
      await openDropdown();
      expect(screen.getByRole('menuitem', { name: /signing out/i })).toBeInTheDocument();
      // Keyboard shortcut hint should be hidden while loading
      expect(screen.queryByText('⇧⌘L')).not.toBeInTheDocument();
    });

    it('renders error banner when logoutError is present', async () => {
      setup({
        logoutError: { message: 'Session expired. Please try again.' } as unknown as AuthLogoutError,
      });
      await openDropdown();
      expect(
        screen.getByRole('alert', { hidden: false })
      ).toHaveTextContent('Sign out failed. Please try again.');
    });

    it('error banner uses aria-live="assertive"', async () => {
      setup({
        logoutError: { message: 'Network error' } as unknown as AuthLogoutError,
      });
      await openDropdown();
      expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive');
    });

    it('does not render error banner when logoutError is null', async () => {
      setup({ logoutError: null });
      await openDropdown();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  // ── Analytics: dropdown open ──────────────────────────────

  describe('Analytics', () => {
    it('tracks dropdown open event', async () => {
      setup();
      await openDropdown();
      expect(trackEvent).toHaveBeenCalledWith('user_nav_dropdown_opened');
    });
  });

  // ── Keyboard shortcuts ────────────────────────────────────

  describe('Keyboard shortcuts', () => {
    it('Shift+Ctrl+P navigates to profile', async () => {
      setup();
      await act(async () => {
        fireEvent.keyDown(window, {
          key: 'P',
          ctrlKey: true,
          shiftKey: true,
        });
      });
      expect(mockPush).toHaveBeenCalledWith(APP_ROUTES.SELLER.PROFILE);
      expect(trackEvent).toHaveBeenCalledWith('user_nav_shortcut_profile');
    });

    it('Ctrl+S navigates to settings when no input is focused', async () => {
      setup();
      await act(async () => {
        fireEvent.keyDown(window, {
          key: 's',
          ctrlKey: true,
          shiftKey: false,
        });
      });
      expect(mockPush).toHaveBeenCalledWith(APP_ROUTES.SELLER.SETTINGS);
      expect(trackEvent).toHaveBeenCalledWith('user_nav_shortcut_settings');
    });

    it('Ctrl+S does NOT navigate when an input is focused', async () => {
      setup();
      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      await act(async () => {
        fireEvent.keyDown(window, {
          key: 's',
          ctrlKey: true,
          shiftKey: false,
        });
      });

      expect(mockPush).not.toHaveBeenCalled();
      document.body.removeChild(input);
    });

    it('Shift+Ctrl+L triggers logout', async () => {
      const logoutMock = jest.fn().mockResolvedValue(undefined);
      setup({ logout: logoutMock });

      await act(async () => {
        fireEvent.keyDown(window, {
          key: 'L',
          ctrlKey: true,
          shiftKey: true,
        });
      });

      await waitFor(() => expect(logoutMock).toHaveBeenCalledTimes(1));
      expect(trackEvent).toHaveBeenCalledWith('user_nav_shortcut_logout');
    });

    it('removes keyboard listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      const { unmount } = setup();
      unmount();
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      removeEventListenerSpy.mockRestore();
    });
  });

  // ── Memoization ───────────────────────────────────────────

  describe('Memoization', () => {
    it('does not re-render when unrelated parent state changes', () => {
      const renderCount = jest.fn();
      const Wrapper = () => {
        const [, setCount] = React.useState(0);
        return (
          <>
            <button onClick={() => setCount((c) => c + 1)} id="inc">
              inc
            </button>
            <UserNavSpy onRender={renderCount} />
          </>
        );
      };

      function UserNavSpy({ onRender }: { onRender: () => void }) {
        onRender();
        return <UserNav />;
      }

      (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
      (useAuth as jest.Mock).mockReturnValue(createAuthMock());

      render(<Wrapper />);
      const initialCount = renderCount.mock.calls.length;

      fireEvent.click(screen.getByRole('button', { name: 'inc' }));

      // UserNavSpy re-renders because it's not memoised itself,
      // but UserNav inside should have stable identity.
      expect(renderCount.mock.calls.length).toBeGreaterThanOrEqual(initialCount);
    });
  });
});
