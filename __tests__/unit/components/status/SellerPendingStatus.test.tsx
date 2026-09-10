import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SellerPendingStatus } from '@/features/seller/components/status/SellerPendingStatus';
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

const writeTextMock = jest.fn();
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: writeTextMock,
  },
  configurable: true,
});

describe('SellerPendingStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering & Conditional Content', () => {
    it('renders heading and main descriptions correctly', () => {
      render(<SellerPendingStatus />);
      expect(screen.getByText('Registration Submitted Successfully')).toBeInTheDocument();
      expect(
        screen.getByText('Your registration is currently under review by our onboarding compliance team.')
      ).toBeInTheDocument();
    });

    it('does not render Notification Email row when email is null or undefined', () => {
      render(<SellerPendingStatus email={null} />);
      expect(screen.queryByText('Notification Email')).not.toBeInTheDocument();
      expect(screen.queryByTestId('seller-pending-email')).not.toBeInTheDocument();
    });

    it('renders Notification Email row when valid email is provided', () => {
      render(<SellerPendingStatus email="johndoe@example.com" />);
      expect(screen.getByText('Notification Email')).toBeInTheDocument();
      expect(screen.getByTestId('seller-pending-email')).toHaveTextContent('johndoe@example.com');
    });

    it('does not render Application ID row when referenceId is null or undefined', () => {
      render(<SellerPendingStatus referenceId={null} />);
      expect(screen.queryByText('Application ID')).not.toBeInTheDocument();
      expect(screen.queryByTestId('seller-pending-reference-id')).not.toBeInTheDocument();
    });

    it('renders Application ID row when valid referenceId is provided', () => {
      render(<SellerPendingStatus referenceId="SEL-99999" />);
      expect(screen.getByText('Application ID')).toBeInTheDocument();
      expect(screen.getByTestId('seller-pending-reference-id')).toHaveTextContent('SEL-99999');
    });

    it('displays custom expected review hours based on estimatedReviewHours prop', () => {
      render(<SellerPendingStatus estimatedReviewHours={48} />);
      expect(screen.getByText('Under 48 Hours')).toBeInTheDocument();
      expect(screen.getByText(/complete in 48 business hours/)).toBeInTheDocument();
    });

    it('falls back to default 24 hours SLA if estimatedReviewHours is not provided', () => {
      render(<SellerPendingStatus />);
      expect(screen.getByText('Under 24 Hours')).toBeInTheDocument();
      expect(screen.getByText(/complete in 24 business hours/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('carries role="status", aria-live="polite", and aria-atomic="true" on wrapper', () => {
      render(<SellerPendingStatus />);
      const wrapper = screen.getByTestId('seller-pending-status');
      expect(wrapper).toHaveAttribute('role', 'status');
      expect(wrapper).toHaveAttribute('aria-live', 'polite');
      expect(wrapper).toHaveAttribute('aria-atomic', 'true');
    });

    it('sets aria-hidden="true" on decorative icons', () => {
      render(<SellerPendingStatus email="john@example.com" referenceId="SEL-123" />);
      const icons = document.querySelectorAll('svg');
      // Verify all SVG elements are hidden from accessibility tree
      icons.forEach((icon) => {
        expect(icon).toHaveAttribute('aria-hidden', 'true');
      });
    });

    it('focuses the wrapper container on mount for keyboard accessibility orientation', () => {
      render(<SellerPendingStatus />);
      const wrapper = screen.getByTestId('seller-pending-status');
      expect(document.activeElement).toBe(wrapper);
    });
  });

  describe('Observability / Telemetry', () => {
    it('emits trackEvent and logs info on mount redacting sensitive data', () => {
      render(<SellerPendingStatus email="seller@eshop.com" referenceId="SEL-12345" />);
      expect(logger.info).toHaveBeenCalledWith(
        'SellerPendingStatus: pending state viewed',
        expect.objectContaining({
          email: '[REDACTED]',
          referenceId: 'SEL-12345',
        })
      );
      expect(trackEvent).toHaveBeenCalledWith(
        'seller_pending_status_viewed',
        expect.objectContaining({
          hasEmail: true,
          hasReferenceId: true,
        })
      );
    });
  });

  describe('Clipboard Operations', () => {
    it('copies reference ID to clipboard and shows brief success indicator', async () => {
      render(<SellerPendingStatus referenceId="SEL-54321" />);
      const copyBtn = screen.getByTestId('seller-pending-copy-btn');
      
      await userEvent.click(copyBtn);
      
      expect(writeTextMock).toHaveBeenCalledWith('SEL-54321');
      expect(copyBtn).toHaveAttribute('aria-label', 'Copied ID');

      // Wait for success indicator to clear
      await waitFor(() => {
        expect(copyBtn).toHaveAttribute('aria-label', 'Copy application ID');
      }, { timeout: 2500 });
    });
  });

  describe('Action Handlers & Routing', () => {
    it('redirects to default APP_ROUTES.HOME when Return button is clicked and onReturnHome is absent', async () => {
      render(<SellerPendingStatus />);
      const btn = screen.getByTestId('seller-pending-return-home-btn');
      await userEvent.click(btn);
      expect(mockPush).toHaveBeenCalledWith(APP_ROUTES.HOME);
    });

    it('triggers custom onReturnHome callback when Return button is clicked', async () => {
      const homeMock = jest.fn();
      render(<SellerPendingStatus onReturnHome={homeMock} />);
      const btn = screen.getByTestId('seller-pending-return-home-btn');
      await userEvent.click(btn);
      expect(homeMock).toHaveBeenCalledTimes(1);
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('triggers custom onContactSupport callback when support link is clicked', async () => {
      const supportMock = jest.fn();
      render(<SellerPendingStatus onContactSupport={supportMock} />);
      const supportLink = screen.getByRole('link', { name: /questions\? contact our/i });
      
      // Prevent actual navigation if clicked
      fireEvent.click(supportLink);

      expect(supportMock).toHaveBeenCalledTimes(1);
    });
  });
});
