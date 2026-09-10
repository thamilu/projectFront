import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SellerSuccessStatus } from '@/features/seller/components/status/SellerSuccessStatus';
import { logger } from '@/core/telemetry/logger';
import { trackEvent } from '@/core/providers/analytics-provider';
import { APP_ROUTES } from '@/shared/routes';

// ─── Mocks ───────────────────────────────────────────────────

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock('@/core/telemetry/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/core/providers/analytics-provider', () => ({
  trackEvent: jest.fn(),
}));

describe('SellerSuccessStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe('Rendering & State Transitions', () => {
    it('renders heading, card description, and visual container elements', () => {
      render(<SellerSuccessStatus isSeller={false} isSyncing={false} onForceSync={jest.fn()} />);
      expect(screen.getByText('Congratulations!')).toBeInTheDocument();
      expect(
        screen.getByText('Your seller account is active. We are syncing your permissions now.')
      ).toBeInTheDocument();
    });

    it('renders sync status banner and force sync button when isSeller is false', () => {
      render(<SellerSuccessStatus isSeller={false} isSyncing={false} onForceSync={jest.fn()} />);
      expect(screen.getByText('Synchronizing permissions...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /complete my setup/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /go to seller dashboard/i })).not.toBeInTheDocument();
    });

    it('renders loader spinner in force sync button during active sync', () => {
      render(<SellerSuccessStatus isSeller={false} isSyncing={true} onForceSync={jest.fn()} />);
      expect(screen.getByText('Synchronizing...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /synchronizing.../i })).toBeDisabled();
    });

    it('renders only the dashboard action button when isSeller is true', () => {
      render(<SellerSuccessStatus isSeller={true} isSyncing={false} onForceSync={jest.fn()} />);
      expect(screen.getByRole('button', { name: /go to seller dashboard/i })).toBeInTheDocument();
      expect(screen.queryByText('Synchronizing permissions...')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /complete my setup/i })).not.toBeInTheDocument();
    });
  });

  describe('Auto-Redirect Timer', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('starts a 5-second auto-redirect to seller dashboard when isSeller is false', () => {
      render(<SellerSuccessStatus isSeller={false} isSyncing={false} onForceSync={jest.fn()} />);
      
      // Fast-forward 4.9 seconds — redirect should not have happened yet
      jest.advanceTimersByTime(4900);
      expect(mockPush).not.toHaveBeenCalled();

      // Fast-forward past 5 seconds
      jest.advanceTimersByTime(200);
      expect(mockPush).toHaveBeenCalledWith(APP_ROUTES.SELLER.DASHBOARD);
    });

    it('cancels the redirect timer on unmount to prevent memory leaks', () => {
      const { unmount } = render(
        <SellerSuccessStatus isSeller={false} isSyncing={false} onForceSync={jest.fn()} />
      );
      unmount();
      
      jest.advanceTimersByTime(6000);
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('does not start a redirect timer if isSeller is initialized to true', () => {
      const { unmount } = render(<SellerSuccessStatus isSeller={true} isSyncing={false} onForceSync={jest.fn()} />);
      unmount();
      jest.advanceTimersByTime(6000);
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('supports custom dashboard navigation callback trigger in redirect timer', () => {
      const navigateMock = jest.fn();
      render(
        <SellerSuccessStatus 
          isSeller={false} 
          isSyncing={false} 
          onForceSync={jest.fn()} 
          onNavigateDashboard={navigateMock} 
        />
      );

      jest.advanceTimersByTime(5100);
      expect(navigateMock).toHaveBeenCalledTimes(1);
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('carries role="status", aria-live="polite", and aria-atomic="true" on wrapper', () => {
      render(<SellerSuccessStatus isSeller={false} isSyncing={false} onForceSync={jest.fn()} />);
      const wrapper = screen.getByTestId('seller-success-status');
      expect(wrapper).toHaveAttribute('role', 'status');
      expect(wrapper).toHaveAttribute('aria-live', 'polite');
      expect(wrapper).toHaveAttribute('aria-atomic', 'true');
    });

    it('sets aria-hidden="true" on decorative icons and loader spinners', () => {
      render(<SellerSuccessStatus isSeller={false} isSyncing={true} onForceSync={jest.fn()} />);
      const icons = document.querySelectorAll('svg');
      icons.forEach((icon) => {
        expect(icon).toHaveAttribute('aria-hidden', 'true');
      });
    });

    it('focuses the wrapper container on mount for keyboard user orientation', () => {
      render(<SellerSuccessStatus isSeller={false} isSyncing={false} onForceSync={jest.fn()} />);
      const wrapper = screen.getByTestId('seller-success-status');
      expect(document.activeElement).toBe(wrapper);
    });
  });

  describe('Observability / Telemetry', () => {
    it('logs display event and emits trackEvent on mount', () => {
      render(<SellerSuccessStatus isSeller={false} isSyncing={false} onForceSync={jest.fn()} />);
      expect(logger.info).toHaveBeenCalledWith(
        'SellerSuccessStatus: seller activation displayed',
        expect.objectContaining({ isSeller: false })
      );
      expect(trackEvent).toHaveBeenCalledWith(
        'seller_account_activated',
        expect.objectContaining({ syncRequired: true })
      );
    });

    it('logs success event and emits sync success trackEvent when isSeller becomes true', () => {
      const { rerender, unmount } = render(
        <SellerSuccessStatus isSeller={false} isSyncing={false} onForceSync={jest.fn()} />
      );
      
      // Transition isSeller to true
      rerender(<SellerSuccessStatus isSeller={true} isSyncing={false} onForceSync={jest.fn()} />);
      
      expect(logger.info).toHaveBeenCalledWith(
        'SellerSuccessStatus: permissions synced successfully',
        expect.any(Object)
      );
      expect(trackEvent).toHaveBeenCalledWith('seller_permissions_synced');

      unmount();
    });
  });

  describe('Async Action Handling & Errors', () => {
    it('calls onForceSync callback when Sync button is clicked', async () => {
      const syncMock = jest.fn().mockResolvedValue(undefined);
      render(<SellerSuccessStatus isSeller={false} isSyncing={false} onForceSync={syncMock} />);
      
      const btn = screen.getByRole('button', { name: /complete my setup/i });
      await userEvent.click(btn);
      
      expect(syncMock).toHaveBeenCalledTimes(1);
    });

    it('handles sync callback rejections and displays error message banner', async () => {
      const syncMock = jest.fn().mockRejectedValue(new Error('Network connection timeout'));
      render(<SellerSuccessStatus isSeller={false} isSyncing={false} onForceSync={syncMock} />);
      
      const btn = screen.getByRole('button', { name: /complete my setup/i });
      await userEvent.click(btn);

      // Verify try/catch block handled the error internally and set the banner
      await waitFor(() => {
        expect(screen.getByText('Network connection timeout')).toBeInTheDocument();
      });
      expect(logger.error).toHaveBeenCalledWith(
        'SellerSuccessStatus: force sync failed',
        expect.objectContaining({ error: 'Network connection timeout' })
      );
    });

    it('renders prop-based syncError banner immediately if provided', () => {
      render(
        <SellerSuccessStatus 
          isSeller={false} 
          isSyncing={false} 
          onForceSync={jest.fn()} 
          syncError="Pre-existing auth configuration issue"
        />
      );
      expect(screen.getByText('Pre-existing auth configuration issue')).toBeInTheDocument();
    });

    it('navigates to dashboard immediately on dashboard button click', async () => {
      const navigateMock = jest.fn();
      render(
        <SellerSuccessStatus 
          isSeller={true} 
          isSyncing={false} 
          onForceSync={jest.fn()} 
          onNavigateDashboard={navigateMock} 
        />
      );
      const btn = screen.getByRole('button', { name: /go to seller dashboard/i });
      await userEvent.click(btn);
      expect(navigateMock).toHaveBeenCalledTimes(1);
    });
  });
});
