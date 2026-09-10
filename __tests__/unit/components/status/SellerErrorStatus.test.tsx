import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SellerErrorStatus } from '@/features/seller/components/status/SellerErrorStatus';
import { logger } from '@/core/telemetry/logger';
import { trackEvent } from '@/core/providers/analytics-provider';

// ─── Mocks ───────────────────────────────────────────────────

jest.mock('@/core/telemetry/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('@/core/providers/analytics-provider', () => ({
  trackEvent: jest.fn(),
}));

describe('SellerErrorStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering & Sanitization', () => {
    it('renders default fallback message when no error is provided', () => {
      render(<SellerErrorStatus />);
      expect(
        screen.getByText('We could not process your registration. Please try again.')
      ).toBeInTheDocument();
    });

    it('renders default fallback message when empty string is provided', () => {
      render(<SellerErrorStatus error="   " />);
      expect(
        screen.getByText('We could not process your registration. Please try again.')
      ).toBeInTheDocument();
    });

    it('renders user-friendly custom error messages directly', () => {
      render(<SellerErrorStatus error="Invalid GSTIN format." />);
      expect(screen.getByText('Invalid GSTIN format.')).toBeInTheDocument();
    });

    it('sanitizes SQL constraints and displays fallback error message', () => {
      render(
        <SellerErrorStatus error="UNIQUE constraint failed: sellers.email on database query" />
      );
      expect(
        screen.getByText('We could not process your registration. Please try again.')
      ).toBeInTheDocument();
      expect(screen.queryByText(/UNIQUE constraint/)).not.toBeInTheDocument();
    });

    it('sanitizes stack traces and displays fallback error message', () => {
      render(
        <SellerErrorStatus error="Error: something failed\n at UserRegistrationService.validateSeller (registration.ts:45:10)" />
      );
      expect(
        screen.getByText('We could not process your registration. Please try again.')
      ).toBeInTheDocument();
    });

    it('sanitizes internal Redis exceptions and displays fallback error message', () => {
      render(<SellerErrorStatus error="Redis connection timeout at 10.0.0.5:6379" />);
      expect(
        screen.getByText('We could not process your registration. Please try again.')
      ).toBeInTheDocument();
    });

    it('sanitizes internal endpoint URLs and displays fallback error message', () => {
      render(<SellerErrorStatus error="Failed fetching from http://internal-auth:8080/realms" />);
      expect(
        screen.getByText('We could not process your registration. Please try again.')
      ).toBeInTheDocument();
    });

    it('displays error code when errorCode prop is provided', () => {
      render(<SellerErrorStatus error="Validation failed" errorCode="ERR_SLR_004" />);
      expect(screen.getByText('Error Code: ERR_SLR_004')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('carries role="alert", aria-live="assertive", and aria-atomic="true" on wrapper', () => {
      render(<SellerErrorStatus />);
      const wrapper = screen.getByTestId('seller-error-status');
      expect(wrapper).toHaveAttribute('role', 'alert');
      expect(wrapper).toHaveAttribute('aria-live', 'assertive');
      expect(wrapper).toHaveAttribute('aria-atomic', 'true');
    });

    it('sets aria-hidden="true" on visual warning icon', () => {
      render(<SellerErrorStatus />);
      // Icon is rendered in DOM, verify it is hidden from AT
      const icons = document.querySelectorAll('svg');
      expect(icons.length).toBe(1);
      expect(icons[0]).toHaveAttribute('aria-hidden', 'true');
    });

    it('focuses the wrapper container on mount for keyboard user orientation', () => {
      render(<SellerErrorStatus />);
      const wrapper = screen.getByTestId('seller-error-status');
      expect(document.activeElement).toBe(wrapper);
    });
  });

  describe('Observability / Telemetry', () => {
    it('logs error internally and emits trackEvent on mount', () => {
      render(<SellerErrorStatus error="Network Failure" errorCode="ERR_NET_504" />);
      expect(logger.error).toHaveBeenCalledWith(
        'SellerErrorStatus: registration error displayed',
        expect.objectContaining({
          error: 'Network Failure',
          errorCode: 'ERR_NET_504',
        })
      );
      expect(trackEvent).toHaveBeenCalledWith(
        'seller_registration_error_displayed',
        expect.objectContaining({
          errorCode: 'ERR_NET_504',
        })
      );
    });
  });

  describe('Action Handlers & Cooldown', () => {
    it('calls onRetry callback when Try Again button is clicked', async () => {
      const retryMock = jest.fn();
      render(<SellerErrorStatus onRetry={retryMock} />);
      const button = screen.getByRole('button', { name: /try again/i });
      await userEvent.click(button);
      expect(retryMock).toHaveBeenCalledTimes(1);
    });

    it('disables retry button and shows loading state during active retry', async () => {
      const retryMock = jest.fn().mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));
      render(<SellerErrorStatus onRetry={retryMock} />);
      const button = screen.getByRole('button', { name: /try again/i });

      // Fire click
      fireEvent.click(button);

      // Verify disabled and loading
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(screen.getByText('Retrying…')).toBeInTheDocument();

      // Click again while loading should not trigger retryMock a second time
      fireEvent.click(button);
      expect(retryMock).toHaveBeenCalledTimes(1);

      await waitFor(() => expect(button).not.toBeDisabled());
    });

    it('renders secondary Go Back button and triggers callback', async () => {
      const backMock = jest.fn();
      render(<SellerErrorStatus onBack={backMock} />);
      const backBtn = screen.getByRole('button', { name: /go back/i });
      await userEvent.click(backBtn);
      expect(backMock).toHaveBeenCalledTimes(1);
    });

    it('renders support url link when supportUrl is provided', () => {
      render(<SellerErrorStatus supportUrl="https://example.com/support" />);
      const supportLink = screen.getByRole('link', { name: /contact support/i });
      expect(supportLink).toHaveAttribute('href', 'https://example.com/support');
    });
  });
});
