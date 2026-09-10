import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { OnboardingLandingCTA } from '@/features/seller/components/registration/OnboardingLandingCTA';

expect.extend(toHaveNoViolations);

// Mock Next.js Link to render a standard anchor for testing
jest.mock('next/link', () => {
  return function MockLink({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) {
    return (
      <a href={href} data-next-link="true" {...props}>
        {children}
      </a>
    );
  };
});

// Mock analytics provider
jest.mock('@/core/providers/analytics-provider', () => ({
  trackEvent: jest.fn(),
}));

// Mock logger
jest.mock('@/core/telemetry/logger', () => ({
  logSecurityEvent: jest.fn(),
}));

// Mock dev-warning
jest.mock('@/shared/utils/dev-warning', () => ({
  warnOnce: jest.fn(),
}));

// Default: analytics consent granted for most tests
beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();

  const consentData = JSON.stringify({
    version: '1.0',
    preferences: { necessary: true, analytics: true, marketing: false, preferences: false },
  });
  Storage.prototype.getItem = jest.fn((key: string) => {
    if (key === 'cookie_consent') return consentData;
    return null;
  });

  // Mock sendBeacon
  Object.defineProperty(navigator, 'sendBeacon', {
    value: jest.fn(() => true),
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('OnboardingLandingCTA Component', () => {
  // ── Routing: Link vs <a> ──────────────────────────────────────────────

  it('renders Next.js <Link> for internal paths', () => {
    render(
      <OnboardingLandingCTA ctaLink="/seller/register" position="top">
        Register
      </OnboardingLandingCTA>
    );

    const link = screen.getByTestId('cta-top');
    expect(link).toHaveAttribute('href', '/seller/register');
    expect(link).toHaveAttribute('data-next-link', 'true');
    expect(link).not.toHaveAttribute('target');
    expect(link).not.toHaveAttribute('rel');
  });

  it('renders <a> with target="_blank" and rel="noopener noreferrer" for external URLs', () => {
    render(
      <OnboardingLandingCTA ctaLink="https://external.com/register" position="bottom">
        External
      </OnboardingLandingCTA>
    );

    const link = screen.getByTestId('cta-bottom');
    expect(link).toHaveAttribute('href', 'https://external.com/register');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link).not.toHaveAttribute('data-next-link');
  });

  it('renders <a> (not <Link>) for blocked URL fallback with href="#"', () => {
    render(
      <OnboardingLandingCTA ctaLink="javascript:alert(1)" position="top">
        Blocked
      </OnboardingLandingCTA>
    );

    const link = screen.getByTestId('cta-top');
    expect(link).toHaveAttribute('href', '#');
    expect(link).not.toHaveAttribute('data-next-link');
  });

  // ── URL Sanitization ──────────────────────────────────────────────────

  it('sanitizes javascript: protocol to #', () => {
    render(
      <OnboardingLandingCTA ctaLink="javascript:alert(1)" position="top">
        XSS
      </OnboardingLandingCTA>
    );

    expect(screen.getByTestId('cta-top')).toHaveAttribute('href', '#');
  });

  it('sanitizes JAVASCRIPT: protocol (case-insensitive) to #', () => {
    render(
      <OnboardingLandingCTA ctaLink="JAVASCRIPT:void(0)" position="top">
        XSS
      </OnboardingLandingCTA>
    );

    expect(screen.getByTestId('cta-top')).toHaveAttribute('href', '#');
  });

  it('sanitizes whitespace-padded javascript: (bypass defense) to #', () => {
    render(
      <OnboardingLandingCTA ctaLink="   javascript:alert(1)  " position="top">
        XSS
      </OnboardingLandingCTA>
    );

    expect(screen.getByTestId('cta-top')).toHaveAttribute('href', '#');
  });

  it('sanitizes // protocol-relative URLs to #', () => {
    render(
      <OnboardingLandingCTA ctaLink="//evil.com/phishing" position="top">
        Phishing
      </OnboardingLandingCTA>
    );

    expect(screen.getByTestId('cta-top')).toHaveAttribute('href', '#');
  });

  // ── Accessibility ─────────────────────────────────────────────────────

  it('has no accessibility violations with internal link', async () => {
    jest.useRealTimers();
    const { container } = render(
      <OnboardingLandingCTA ctaLink="/register" position="top" ariaLabel="Register now">
        Register
      </OnboardingLandingCTA>
    );
    expect(await axe(container)).toHaveNoViolations();
    jest.useFakeTimers();
  }, 15000);

  it('has no accessibility violations with external link', async () => {
    jest.useRealTimers();
    const { container } = render(
      <OnboardingLandingCTA
        ctaLink="https://example.com"
        position="bottom"
        ariaLabel="Visit example"
      >
        External
      </OnboardingLandingCTA>
    );
    expect(await axe(container)).toHaveNoViolations();
    jest.useFakeTimers();
  }, 15000);

  it('has no accessibility violations with blocked link', async () => {
    jest.useRealTimers();
    const { container } = render(
      <OnboardingLandingCTA
        ctaLink="javascript:void(0)"
        position="top"
        ariaLabel="Blocked link"
      >
        Blocked
      </OnboardingLandingCTA>
    );
    expect(await axe(container)).toHaveNoViolations();
    jest.useFakeTimers();
  }, 15000);

  it('propagates ariaLabel to rendered element', () => {
    render(
      <OnboardingLandingCTA
        ctaLink="/register"
        position="top"
        ariaLabel="Start selling — register now"
      >
        Register
      </OnboardingLandingCTA>
    );

    expect(screen.getByTestId('cta-top')).toHaveAttribute(
      'aria-label',
      'Start selling — register now'
    );
  });

  // ── Focus Ring ────────────────────────────────────────────────────────

  it('always applies focus-visible ring classes regardless of className prop', () => {
    render(
      <OnboardingLandingCTA ctaLink="/test" position="top" className="custom-class bg-red-500">
        Test
      </OnboardingLandingCTA>
    );

    const link = screen.getByTestId('cta-top');
    expect(link).toHaveClass('focus-visible:ring-2');
    expect(link).toHaveClass('focus-visible:ring-primary');
    expect(link).toHaveClass('focus-visible:ring-offset-2');
    expect(link).toHaveClass('rounded');
    // Caller class is also present
    expect(link).toHaveClass('custom-class');
  });

  // ── Analytics ─────────────────────────────────────────────────────────

  it('calls sendBeacon with correct payload on click (no timestamp)', () => {
    render(
      <OnboardingLandingCTA ctaLink="/register" position="top" planName="Growth">
        Click
      </OnboardingLandingCTA>
    );

    // Flush useEffect for consent
    jest.runAllTimers();

    fireEvent.click(screen.getByTestId('cta-top'));

    expect(navigator.sendBeacon).toHaveBeenCalledTimes(1);
    const payload = JSON.parse((navigator.sendBeacon as jest.Mock).mock.calls[0][1]);
    expect(payload).toEqual({
      event: 'seller_onboarding_cta_clicked',
      position: 'top',
      planName: 'Growth',
    });
    expect(payload).not.toHaveProperty('timestamp');
  });

  it('uses "unknown" fallback when planName is not provided', () => {
    render(
      <OnboardingLandingCTA ctaLink="/register" position="pricing">
        Click
      </OnboardingLandingCTA>
    );

    jest.runAllTimers();
    fireEvent.click(screen.getByTestId('cta-pricing'));

    const payload = JSON.parse((navigator.sendBeacon as jest.Mock).mock.calls[0][1]);
    expect(payload.planName).toBe('unknown');
  });

  it('does NOT call tracking when consent is denied', () => {
    Storage.prototype.getItem = jest.fn(() =>
      JSON.stringify({
        version: '1.0',
        preferences: { necessary: true, analytics: false, marketing: false, preferences: false },
      })
    );

    render(
      <OnboardingLandingCTA ctaLink="/register" position="top">
        Click
      </OnboardingLandingCTA>
    );

    jest.runAllTimers();
    fireEvent.click(screen.getByTestId('cta-top'));

    expect(navigator.sendBeacon).not.toHaveBeenCalled();
  });

  it('does NOT throw when trackEvent errors (error isolation)', () => {
    Object.defineProperty(navigator, 'sendBeacon', {
      value: jest.fn(() => {
        throw new Error('SecurityError');
      }),
      writable: true,
      configurable: true,
    });

    render(
      <OnboardingLandingCTA ctaLink="/register" position="top">
        Click
      </OnboardingLandingCTA>
    );

    jest.runAllTimers();

    expect(() => {
      fireEvent.click(screen.getByTestId('cta-top'));
    }).not.toThrow();
  });

  it('rapid double-click calls tracking only once', () => {
    render(
      <OnboardingLandingCTA ctaLink="/register" position="top">
        Click
      </OnboardingLandingCTA>
    );

    jest.runAllTimers();

    const link = screen.getByTestId('cta-top');
    fireEvent.click(link);
    fireEvent.click(link);
    fireEvent.click(link);

    expect(navigator.sendBeacon).toHaveBeenCalledTimes(1);
  });

  // ── data-testid ───────────────────────────────────────────────────────

  it('defaults data-testid to cta-${position}', () => {
    render(
      <OnboardingLandingCTA ctaLink="/register" position="pricing">
        CTA
      </OnboardingLandingCTA>
    );

    expect(screen.getByTestId('cta-pricing')).toBeInTheDocument();
  });

  it('uses custom data-testid when provided', () => {
    render(
      <OnboardingLandingCTA ctaLink="/register" position="top" dataTestId="custom-test-id">
        CTA
      </OnboardingLandingCTA>
    );

    expect(screen.getByTestId('custom-test-id')).toBeInTheDocument();
  });
});
