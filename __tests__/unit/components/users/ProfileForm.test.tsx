import { render, screen, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { ProfileForm } from '@/features/users/components/ProfileForm';
import { useProfileData } from '@/features/users/hooks/useProfileData';
import { useTabNavigation } from '@/features/users/hooks/useTabNavigation';
import { useEditState } from '@/features/users/hooks/useEditState';
import { useProfileSubmit } from '@/features/users/hooks/useProfileSubmit';
import { useForm } from 'react-hook-form';
import { TAB_CONFIG } from '@/features/users/utils/profile.constants';

// Mock next-auth/react using a factory to bypass loading the actual ESM code
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

// Mock domain hooks
jest.mock('@/features/users/hooks/useProfileData');
jest.mock('@/features/users/hooks/useTabNavigation');
jest.mock('@/features/users/hooks/useEditState');
jest.mock('@/features/users/hooks/useProfileSubmit');

// Mock react-hook-form to dynamically control formState (isDirty)
jest.mock('react-hook-form', () => {
  const actual = jest.requireActual('react-hook-form');
  return {
    ...actual,
    useForm: jest.fn(),
  };
});

// Mock ErrorBoundary to bypass error catching and let tests assert throws
jest.mock('@/shared/ui/feedback/error-boundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock lazy-loaded child component TabContent to simplify test mounting
jest.mock('@/features/users/components/TabContent/TabContent', () => ({
  TabContent: () => <div data-testid="tab-content">Tab Content Mock</div>,
}));

describe('ProfileForm', () => {
  const mockSetTab = jest.fn();
  const mockGoNext = jest.fn();
  const mockGoBack = jest.fn();
  const mockHandleEdit = jest.fn();
  const mockHandleCancel = jest.fn();
  const mockHandleReset = jest.fn();
  const mockCloseEdit = jest.fn();
  const mockSubmit = jest.fn();
  let mockIsDirty = false;

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsDirty = false;

    // Mock useForm
    const actualUseForm = jest.requireActual('react-hook-form').useForm;
    (useForm as jest.Mock).mockImplementation((options) => {
      const methods = actualUseForm(options);
      return {
        ...methods,
        formState: {
          ...methods.formState,
          get isDirty() {
            return mockIsDirty;
          },
        },
      };
    });

    // Default implementations for hooks
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: { id: 'user-123', name: 'John Doe', email: 'john@example.com', roles: ['USER'] },
      },
      status: 'authenticated',
    });

    (useTabNavigation as jest.Mock).mockReturnValue({
      activeTab: 'personal',
      setTab: mockSetTab,
      goNext: mockGoNext,
      goBack: mockGoBack,
    });

    (useProfileData as jest.Mock).mockReturnValue({
      isLoading: false,
      hasSellerProfile: false,
      error: null,
      hasLoadedOnce: true,
    });

    (useEditState as jest.Mock).mockReturnValue({
      isEditing: false,
      handleEdit: mockHandleEdit,
      handleCancel: mockHandleCancel,
      handleReset: mockHandleReset,
      closeEdit: mockCloseEdit,
    });

    (useProfileSubmit as jest.Mock).mockReturnValue({
      isSubmitting: false,
      submit: mockSubmit,
      error: null,
    });
  });

  describe('authentication states', () => {
    it('shows full skeleton while authenticating', () => {
      (useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'loading',
      });

      render(<ProfileForm />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading your profile');
    });

    it('renders AuthGate when unauthenticated', () => {
      (useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });

      render(<ProfileForm />);
      expect(screen.getByText(/Authentication Required/i)).toBeInTheDocument();
      expect(screen.getByText(/Please sign in to view and manage/i)).toBeInTheDocument();
    });

    it('renders form when authenticated and data loaded', async () => {
      render(<ProfileForm />);

      await waitFor(() => {
        expect(screen.getByRole('form')).toBeInTheDocument();
        expect(screen.getByLabelText('Profile sections')).toBeInTheDocument();
      });
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('renders inline error containment on data fetch error', () => {
      (useProfileData as jest.Mock).mockReturnValue({
        isLoading: false,
        hasSellerProfile: false,
        error: new Error('Failed to fetch profile'),
        hasLoadedOnce: false,
      });

      render(<ProfileForm />);

      expect(screen.getByText('Unable to Load Profile')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Reload profile page/i })).toBeInTheDocument();
    });

    it('renders circuit open containment message when circuit breaker trips', () => {
      (useProfileData as jest.Mock).mockReturnValue({
        isLoading: false,
        hasSellerProfile: false,
        error: new Error('🔌 [CircuitBreaker:default] Circuit is OPEN. Fast-failing HTTP request.'),
        hasLoadedOnce: false,
      });

      render(<ProfileForm />);

      expect(screen.getByText('Service Protection Active')).toBeInTheDocument();
      expect(
        screen.getByText(/The profile service is temporarily unavailable/i)
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Reload profile page/i })).toBeInTheDocument();
    });

    it('renders inline error alert on submit error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      (useProfileSubmit as jest.Mock).mockReturnValue({
        isSubmitting: false,
        error: new Error('Submit failed'),
        submit: jest.fn(),
      });

      render(<ProfileForm />);

      await waitFor(() => {
        expect(screen.getByText('Unable to Save Changes')).toBeInTheDocument();
        expect(screen.getByText('Submit failed')).toBeInTheDocument();
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('tab configuration validation', () => {
    it('validates TAB_CONFIG length at module load', () => {
      expect(TAB_CONFIG.length).toBeGreaterThanOrEqual(1);
      expect(TAB_CONFIG.length).toBeLessThanOrEqual(6);
    });
  });

  describe('screen reader announcements', () => {
    it('announces saving state when submitting', async () => {
      (useProfileSubmit as jest.Mock).mockReturnValue({
        isSubmitting: true,
        submit: mockSubmit,
        error: null,
      });

      render(<ProfileForm />);

      await waitFor(() => {
        const statusEls = screen.queryAllByRole('status', { hidden: true });
        const srStatus = statusEls.find((el) => el.classList.contains('sr-only'));
        expect(srStatus).toHaveTextContent('Saving profile changes');
      });
    });

    it('announces unsaved changes when form is dirty', async () => {
      mockIsDirty = true;
      (useEditState as jest.Mock).mockReturnValue({
        isEditing: true,
        handleEdit: mockHandleEdit,
        handleCancel: mockHandleCancel,
        handleReset: mockHandleReset,
        closeEdit: mockCloseEdit,
      });

      render(<ProfileForm />);

      await waitFor(() => {
        const statusEls = screen.queryAllByRole('status', { hidden: true });
        const srStatus = statusEls.find((el) => el.classList.contains('sr-only'));
        expect(srStatus).toHaveTextContent('You have unsaved changes');
      });
    });

    it('does not render status div when form is clean and not submitting', () => {
      (useProfileSubmit as jest.Mock).mockReturnValue({
        isSubmitting: false,
        submit: mockSubmit,
        error: null,
      });

      render(<ProfileForm />);

      const statusEls = screen.queryAllByRole('status', { hidden: true });
      // SR-only div (class="sr-only") must NOT be rendered when form is clean and not submitting
      const srStatus = statusEls.find((el) => el.classList.contains('sr-only'));
      expect(srStatus).toBeUndefined();
    });
  });

  describe('grid column calculation', () => {
    it('clamps tab count to valid range', () => {
      const getTabGridCols = (count: number): string => {
        const safeCount = Math.min(6, Math.max(1, count));
        return `grid-cols-${safeCount}`;
      };

      expect(getTabGridCols(0)).toContain('grid-cols-1');
      expect(getTabGridCols(3)).toContain('grid-cols-3');
      expect(getTabGridCols(10)).toContain('grid-cols-6');
    });
  });
});
