import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SellerHeaderExitDialog } from '@/features/seller/components/layout/SellerHeaderExitDialog';
import { useOnboardingStore } from '@/features/seller/store/onboarding-store';
import { trackEvent } from '@/core/providers/analytics-provider';
import { toast } from 'sonner';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock('@/core/providers/analytics-provider', () => ({
  trackEvent: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

describe('SellerHeaderExitDialog Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      useOnboardingStore.setState({
        currentStep: 0,
        totalSteps: 6,
        confirmExitOpen: false,
        saveDraftCallback: null,
      });
    });
  });

  it('should not render anything when confirmExitOpen is false', () => {
    render(<SellerHeaderExitDialog />);
    expect(screen.queryByText('Leave seller registration?')).not.toBeInTheDocument();
  });

  it('should render dialog contents with progress save description when saveDraftCallback is active', () => {
    const mockSaveDraft = jest.fn();
    act(() => {
      useOnboardingStore.setState({
        confirmExitOpen: true,
        saveDraftCallback: mockSaveDraft,
      });
    });
    render(<SellerHeaderExitDialog />);
    expect(screen.getByText('Leave seller registration?')).toBeInTheDocument();
    expect(screen.getByText(/Your progress will be saved/i)).toBeInTheDocument();
  });

  it('should render conditional description copy when saveDraftCallback is null', () => {
    act(() => {
      useOnboardingStore.setState({
        confirmExitOpen: true,
        saveDraftCallback: null,
      });
    });
    render(<SellerHeaderExitDialog />);
    expect(screen.getByText(/Any unsaved progress will be lost/i)).toBeInTheDocument();
  });

  it('should render correct button styles and order: Stay Here (primary) and Return to Marketplace (ghost/secondary)', () => {
    act(() => {
      useOnboardingStore.setState({ confirmExitOpen: true });
    });
    render(<SellerHeaderExitDialog />);

    const primaryBtn = screen.getByRole('button', { name: 'Stay Here' });
    const secondaryBtn = screen.getByRole('button', { name: 'Return to Marketplace' });

    expect(primaryBtn).toBeInTheDocument();
    expect(primaryBtn).not.toHaveClass('variant-ghost'); // standard primary style
    expect(secondaryBtn).toBeInTheDocument();
    expect(secondaryBtn).toHaveClass('hover:text-foreground'); // ghost variant styles
  });

  it('should handle successful saveDraftCallback and navigate', async () => {
    const mockSaveDraft = jest.fn().mockResolvedValue(undefined);
    act(() => {
      useOnboardingStore.setState({
        confirmExitOpen: true,
        saveDraftCallback: mockSaveDraft,
      });
    });

    render(<SellerHeaderExitDialog />);

    const exitBtn = screen.getByRole('button', { name: 'Return to Marketplace' });
    await act(async () => {
      fireEvent.click(exitBtn);
    });

    expect(mockSaveDraft).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/');
    expect(trackEvent).toHaveBeenCalledWith('seller_onboarding_exit_confirmed', { currentStep: 1 });
  });

  it('should handle failing saveDraftCallback, trigger toast, render inline alert, and NOT navigate', async () => {
    const mockSaveDraft = jest.fn().mockRejectedValue(new Error('Database offline'));
    act(() => {
      useOnboardingStore.setState({
        confirmExitOpen: true,
        saveDraftCallback: mockSaveDraft,
      });
    });

    render(<SellerHeaderExitDialog />);

    const exitBtn = screen.getByRole('button', { name: 'Return to Marketplace' });
    await act(async () => {
      fireEvent.click(exitBtn);
    });

    expect(mockSaveDraft).toHaveBeenCalledTimes(1);
    expect(mockPush).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('Failed to save your progress. Please try again.');
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Failed to save your progress. Please try again.')).toBeInTheDocument();
    
    expect(trackEvent).toHaveBeenCalledWith('seller_onboarding_draft_save_error', {
      currentStep: 1,
      errorType: 'Error',
    });
  });

  it('should handle cancel exit click and close the dialog', () => {
    act(() => {
      useOnboardingStore.setState({ confirmExitOpen: true });
    });

    render(<SellerHeaderExitDialog />);

    const stayBtn = screen.getByRole('button', { name: 'Stay Here' });
    fireEvent.click(stayBtn);

    expect(useOnboardingStore.getState().confirmExitOpen).toBe(false);
    expect(trackEvent).toHaveBeenCalledWith('seller_onboarding_exit_cancelled', { currentStep: 1 });
  });
});
