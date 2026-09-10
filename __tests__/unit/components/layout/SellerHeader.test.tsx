import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SellerHeader } from '@/features/seller/components/layout/header';
import { useOnboardingStore } from '@/features/seller/store/onboarding-store';
import { useNotifications } from '@/features/notifications';
import { toast } from 'sonner';

// SellerHeader renders NotificationPopover, which reads the real,
// backend-integrated useNotifications() hook (see notification-popover.tsx —
// migrated off the local-only fake-data Zustand store it used to read).
jest.mock('@/features/notifications', () => ({
  useNotifications: jest.fn(),
}));

function mockNotificationsState(notifications: Array<{ id: string; read: boolean }> = []) {
  (useNotifications as jest.Mock).mockReturnValue({
    notifications,
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    deleteNotification: jest.fn(),
  });
}

jest.mock('sonner', () => ({
  toast: { info: jest.fn(), error: jest.fn(), success: jest.fn(), warning: jest.fn() },
}));

const mockPush = jest.fn();
const mockRefresh = jest.fn();
const mockGet = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
  usePathname: () => '/seller/dashboard',
  useSearchParams: () => ({
    get: mockGet,
  }),
}));

jest.mock('@/shared/ui/layout/theme-toggle', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle" />,
}));

jest.mock('@/core/i18n', () => ({
  useI18n: () => ({
    locale: 'en',
    setLocale: jest.fn(),
    t: (key: string) => key,
  }),
}));

jest.mock('@/core/providers/analytics-provider', () => ({
  trackEvent: jest.fn(),
}));

jest.mock('@/features/seller/components/layout/user-nav', () => ({
  UserNav: () => <div data-testid="user-nav" />,
}));

describe('SellerHeader Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNotificationsState();
    act(() => {
      useOnboardingStore.setState({
        currentStep: 0,
        totalSteps: 6,
        stepTitle: '',
        isFormDirty: false,
        isSaving: false,
        confirmExitOpen: false,
        showHelpModal: false,
        saveDraftCallback: null,
      });
    });
  });

  it('should render eShop logo and landmark role banner / label', () => {
    render(<SellerHeader />);
    expect(screen.getByLabelText('eShop home')).toBeInTheDocument();
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
    expect(header).toHaveAttribute('aria-label', 'Seller dashboard navigation');
  });

  it('should trigger onMenuClick callback when hamburger menu toggle button is clicked', () => {
    const onMenuClick = jest.fn();
    render(<SellerHeader onMenuClick={onMenuClick} />);

    const menuButton = screen.getByLabelText('Toggle menu');
    expect(menuButton).toHaveAttribute('aria-controls', 'seller-sidebar');
    fireEvent.click(menuButton);
    expect(onMenuClick).toHaveBeenCalledTimes(1);
  });

  it('should display the correct unread count badge inside the notifications button', () => {
    mockNotificationsState(Array.from({ length: 5 }, (_, i) => ({ id: String(i), read: false })));
    render(<SellerHeader />);
    const badge = screen.getByText('5');
    expect(badge).toBeInTheDocument();
  });

  // Regression: this previously navigated to /seller/search — a route that
  // doesn't exist anywhere in the app — so every seller search submission
  // actually 404'd. Submitting now shows an honest "coming soon" notice
  // instead of a broken link.
  it('should show a coming-soon notice instead of navigating to a non-existent search route', async () => {
    render(<SellerHeader />);
    const searchInput = screen.getByRole('searchbox', { name: 'Search' });
    fireEvent.change(searchInput, { target: { value: 'iPad Pro' } });

    const searchForm = searchInput.closest('form');
    expect(searchForm).not.toBeNull();
    expect(searchForm).toHaveAttribute('role', 'search');
    expect(searchForm).toHaveAttribute('aria-label', 'Seller dashboard search');

    await act(async () => {
      fireEvent.submit(searchForm!);
    });

    expect(toast.info).toHaveBeenCalledWith('Seller search is coming soon.');
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should automatically focus the search field when the Cmd+K shortcut sequence triggers', () => {
    render(<SellerHeader />);
    const searchInput = screen.getByRole('searchbox', { name: 'Search' });

    fireEvent.keyDown(document, { metaKey: true, key: 'k' });
    expect(searchInput).toHaveFocus();
  });

  it('should automatically focus the search field when the Ctrl+K shortcut sequence triggers', () => {
    render(<SellerHeader />);
    const searchInput = screen.getByRole('searchbox', { name: 'Search' });

    fireEvent.keyDown(document, { ctrlKey: true, key: 'k' });
    expect(searchInput).toHaveFocus();
  });

  it('should show sidebar open state', () => {
    render(<SellerHeader isSidebarOpen={true} />);
    const menuButton = screen.getByLabelText('Toggle menu');
    expect(menuButton).toHaveClass('bg-muted');
    expect(menuButton).toHaveAttribute('aria-expanded', 'true');
  });

  it('should show sidebar closed state', () => {
    render(<SellerHeader isSidebarOpen={false} />);
    const menuButton = screen.getByLabelText('Toggle menu');
    expect(menuButton).not.toHaveClass('bg-muted');
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('should not show the coming-soon notice on empty search', async () => {
    render(<SellerHeader />);
    const searchInput = screen.getByRole('searchbox', { name: 'Search' });
    fireEvent.change(searchInput, { target: { value: '   ' } });

    const form = searchInput.closest('form');
    await act(async () => {
      fireEvent.submit(form!);
    });

    expect(toast.info).not.toHaveBeenCalled();
  });

  it('should trim search query before showing the coming-soon notice', async () => {
    render(<SellerHeader />);
    const searchInput = screen.getByRole('searchbox', { name: 'Search' });
    fireEvent.change(searchInput, { target: { value: '  laptop  ' } });

    const form = searchInput.closest('form');
    await act(async () => {
      fireEvent.submit(form!);
    });

    expect(toast.info).toHaveBeenCalledWith('Seller search is coming soon.');
  });

  describe('Seller Onboarding specific flows', () => {
    afterEach(() => {
      mockGet.mockReset();
      act(() => {
        useOnboardingStore.setState({
          currentStep: 0,
          totalSteps: 6,
          stepTitle: '',
          isFormDirty: false,
          isSaving: false,
          confirmExitOpen: false,
          showHelpModal: false,
          saveDraftCallback: null,
        });
      });
    });

    it('should render Back to Marketplace button during onboarding (non-wizard)', () => {
      render(<SellerHeader isOnboarding={true} />);
      expect(screen.getByLabelText('Exit — Back to Marketplace')).toBeInTheDocument();
    });

    it('should not render Back to Marketplace button when isWizardFlow is true', () => {
      mockGet.mockReturnValue('wizard');
      render(<SellerHeader isOnboarding={true} />);
      expect(screen.queryByLabelText('Exit — Back to Marketplace')).not.toBeInTheDocument();
    });

    it('should trigger exit confirmation dialog when back button is clicked and form is dirty', async () => {
      act(() => {
        useOnboardingStore.setState({ isFormDirty: true });
      });
      render(<SellerHeader isOnboarding={true} />);
      
      const backBtn = screen.getByLabelText('Exit — Back to Marketplace');
      fireEvent.click(backBtn);
      
      expect(screen.getByText('Leave seller registration?')).toBeInTheDocument();
    });

    it('should navigate to home when back button is clicked and form is clean', () => {
      act(() => {
        useOnboardingStore.setState({ isFormDirty: false });
      });
      render(<SellerHeader isOnboarding={true} />);
      
      const backBtn = screen.getByLabelText('Exit — Back to Marketplace');
      fireEvent.click(backBtn);
      
      expect(mockPush).toHaveBeenCalledWith('/');
    });

    it('should show progress bar and steps in center when isWizardFlow is true', () => {
      mockGet.mockReturnValue('wizard');
      act(() => {
        useOnboardingStore.setState({ currentStep: 1, totalSteps: 6, stepTitle: 'Address' });
      });
      render(<SellerHeader isOnboarding={true} />);
      
      expect(screen.getAllByText('Address')[0]).toBeInTheDocument();
      expect(screen.getByText(/Step 2 of 6/i)).toBeInTheDocument();
    });

    it('should call saveDraftCallback when Save Draft button is clicked', async () => {
      mockGet.mockReturnValue('wizard');
      const mockSaveDraft = jest.fn().mockResolvedValue(undefined);
      act(() => {
        useOnboardingStore.setState({ saveDraftCallback: mockSaveDraft });
      });
      render(<SellerHeader isOnboarding={true} />);
      
      const saveBtn = screen.getByLabelText('Save current registration progress');
      await act(async () => {
        fireEvent.click(saveBtn);
      });
      
      expect(mockSaveDraft).toHaveBeenCalledTimes(1);
    });
  });
});
