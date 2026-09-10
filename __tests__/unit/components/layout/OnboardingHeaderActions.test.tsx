import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { OnboardingHeaderActions } from '@/features/seller/components/layout/OnboardingHeaderActions';
import { useOnboardingStore } from '@/features/seller/store/onboarding-store';
import { toast } from 'sonner';
import { logger } from '@/shared/utils/logger';
import { trackEvent } from '@/core/providers/analytics-provider';

// Mock Nested Component
jest.mock('@/features/seller/components/layout/SellerHeaderActions', () => ({
  SellerHeaderActions: jest.fn(({ locale, onLocaleChange, isLocalePending }: any) => (
    <div
      data-testid="seller-header-actions"
      data-locale={locale}
      data-pending={isLocalePending}
      onClick={() => onLocaleChange('hi')}
    />
  )),
}));

// Mock Sonner Toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock Logger
jest.mock('@/shared/utils/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

// Mock Analytics
jest.mock('@/core/providers/analytics-provider', () => ({
  trackEvent: jest.fn(),
}));

describe('OnboardingHeaderActions Component', () => {
  const defaultProps = {
    isWizardFlow: false,
    locale: 'en',
    onLocaleChange: jest.fn(),
    isLocalePending: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      useOnboardingStore.setState({
        isSaving: false,
        setShowHelpModal: jest.fn(),
        saveDraftCallback: null,
      });
    });
  });

  it('should define correct displayName and be a named export only', () => {
    expect(OnboardingHeaderActions.displayName).toBe('OnboardingHeaderActions');
  });

  it('should render SellerHeaderActions with correct locale passthrough props', () => {
    render(<OnboardingHeaderActions {...defaultProps} isLocalePending={true} />);
    const child = screen.getByTestId('seller-header-actions');
    expect(child).toBeInTheDocument();
    expect(child).toHaveAttribute('data-locale', 'en');
    expect(child).toHaveAttribute('data-pending', 'true');

    // Trigger callback check
    fireEvent.click(child);
    expect(defaultProps.onLocaleChange).toHaveBeenCalledWith('hi');
  });

  it('should NOT render Save Draft button when isWizardFlow is false', () => {
    render(<OnboardingHeaderActions {...defaultProps} isWizardFlow={false} />);
    expect(screen.queryByRole('button', { name: 'Save current registration progress' })).not.toBeInTheDocument();
  });

  it('should render disabled Save Draft button with tooltip when isWizardFlow is true and callback is null', () => {
    render(<OnboardingHeaderActions {...defaultProps} isWizardFlow={true} />);
    const btn = screen.getByRole('button', { name: 'Save current registration progress' });
    expect(btn).toBeInTheDocument();
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('title', 'No unsaved changes');
    expect(btn).not.toHaveAttribute('aria-busy');
  });

  it('should render active Save Draft button when callback is provided', () => {
    act(() => {
      useOnboardingStore.setState({
        saveDraftCallback: jest.fn(),
      });
    });
    render(<OnboardingHeaderActions {...defaultProps} isWizardFlow={true} />);
    const btn = screen.getByRole('button', { name: 'Save current registration progress' });
    expect(btn).toBeInTheDocument();
    expect(btn).toBeEnabled();
    expect(btn).not.toHaveAttribute('title');
  });

  it('should render Loader2, disable button, and set aria-busy="true" during isSaving state', () => {
    act(() => {
      useOnboardingStore.setState({
        saveDraftCallback: jest.fn(),
        isSaving: true,
      });
    });
    const { container } = render(<OnboardingHeaderActions {...defaultProps} isWizardFlow={true} />);
    const btn = screen.getByRole('button', { name: 'Save current registration progress' });

    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
    expect(btn).toHaveTextContent('Saving...');

    const loaderIcon = container.querySelector('.animate-spin');
    expect(loaderIcon).toBeInTheDocument();
    expect(loaderIcon).toHaveAttribute('aria-hidden', 'true');
  });

  it('should trigger saveDraftCallback and show success toast on successful draft save', async () => {
    const mockSave = jest.fn().mockResolvedValue(undefined);
    act(() => {
      useOnboardingStore.setState({
        saveDraftCallback: mockSave,
      });
    });
    render(<OnboardingHeaderActions {...defaultProps} isWizardFlow={true} />);
    const btn = screen.getByRole('button', { name: 'Save current registration progress' });

    await act(async () => {
      fireEvent.click(btn);
    });

    expect(mockSave).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalledWith('Your progress has been saved.');
    expect(trackEvent).toHaveBeenCalledWith('seller_onboarding_save_draft_clicked');
  });

  it('should log full error internally and display generic toast and sanitized event on draft save rejection', async () => {
    const internalError = new TypeError('Database timeout occurred on order mapping');
    const mockSave = jest.fn().mockRejectedValue(internalError);

    act(() => {
      useOnboardingStore.setState({
        saveDraftCallback: mockSave,
      });
    });

    render(<OnboardingHeaderActions {...defaultProps} isWizardFlow={true} />);
    const btn = screen.getByRole('button', { name: 'Save current registration progress' });

    await act(async () => {
      fireEvent.click(btn);
    });

    // 1. Logger receives full error
    expect(logger.error).toHaveBeenCalledWith('[OnboardingHeaderActions] Draft save failed:', { error: internalError });

    // 2. User sees safe, generic message
    expect(toast.error).toHaveBeenCalledWith('Failed to save draft. Please try again.');

    // 3. Analytics gets only sanitized error type
    expect(trackEvent).toHaveBeenCalledWith('seller_onboarding_draft_save_error', {
      errorType: 'TypeError',
    });
  });

  it('should render Help button that triggers support modal and logs analytics', () => {
    const mockShowModal = jest.fn();
    act(() => {
      useOnboardingStore.setState({
        setShowHelpModal: mockShowModal,
      });
    });

    render(<OnboardingHeaderActions {...defaultProps} />);
    const helpBtn = screen.getByRole('button', { name: 'Help & FAQ' });
    expect(helpBtn).toBeInTheDocument();

    fireEvent.click(helpBtn);

    expect(mockShowModal).toHaveBeenCalledWith(true);
    expect(trackEvent).toHaveBeenCalledWith('seller_onboarding_help_clicked', { source: 'header' });
  });

  it('should hide all icons inside buttons from assistive technologies', () => {
    act(() => {
      useOnboardingStore.setState({
        saveDraftCallback: jest.fn(),
      });
    });
    const { container } = render(<OnboardingHeaderActions {...defaultProps} isWizardFlow={true} />);
    const icons = container.querySelectorAll('svg');

    expect(icons.length).toBeGreaterThan(0);
    icons.forEach((icon) => {
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });
});
