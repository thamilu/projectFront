import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { SupportFaq } from '@/features/seller/components/registration/SupportFaq';
import { trackEvent } from '@/core/providers/analytics-provider';

expect.extend(toHaveNoViolations);

// Mock translation hooks
jest.mock('@/core/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'supportFaq.needSupport': 'Need Support?',
        'supportFaq.description': 'Have questions or experiencing technical difficulties?',
        'supportFaq.emailSupport': 'Email Support',
        'supportFaq.emailSupportLabel': 'Email Support (opens email client)',
        'supportFaq.faqHeading': 'Frequently Asked Questions',
        'supportFaq.faqs.registrationFree.q': 'Is seller registration free?',
        'supportFaq.faqs.registrationFree.a': 'Yes. Registration is completely free.',
        'supportFaq.faqs.subscriptionRequired.q': 'When do I need a subscription?',
        'supportFaq.faqs.subscriptionRequired.a': 'A subscription becomes required...',
      };
      return translations[key] || key;
    },
    locale: 'en',
  }),
}));

// Mock config constants
jest.mock('@/features/seller/constants/onboarding-assistant-config', () => ({
  SUPPORT_CONFIG: {
    email: 'seller-support@eshop.com',
    subject: 'Seller Onboarding Help',
  },
}));

// Mock analytics tracker
jest.mock('@/core/providers/analytics-provider', () => ({
  trackEvent: jest.fn(),
}));

describe('SupportFaq Component Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders support widget and accordion list successfully', () => {
    render(<SupportFaq />);

    // Section headings are visible
    expect(screen.getByText('Need Support?')).toBeInTheDocument();
    expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument();

    // Default email CTA is configured correctly
    const emailLink = screen.getByTestId('support-email-link');
    expect(emailLink).toHaveAttribute('href', 'mailto:seller-support@eshop.com?subject=Seller%20Onboarding%20Help');
    expect(emailLink).toHaveAttribute('aria-label', 'Email Support (opens email client)');
  });

  it('supports overriding email config parameters via props', () => {
    render(<SupportFaq supportEmail="custom@test.com" supportSubject="My Subject" />);

    const emailLink = screen.getByTestId('support-email-link');
    expect(emailLink).toHaveAttribute('href', 'mailto:custom@test.com?subject=My%20Subject');
  });

  it('safely fallback link to # on invalid emails', () => {
    // Malformed email
    const { rerender } = render(<SupportFaq supportEmail="invalidemail" />);
    expect(screen.getByTestId('support-email-link')).toHaveAttribute('href', '#');

    // Empty email
    rerender(<SupportFaq supportEmail="" />);
    expect(screen.getByTestId('support-email-link')).toHaveAttribute('href', '#');
  });

  it('handles exclusive FAQ item expansion state toggles', () => {
    render(<SupportFaq />);

    const firstBtn = screen.getByTestId('faq-button-registration-free');
    const secondBtn = screen.getByTestId('faq-button-subscription-required');

    // Initially all panel details are collapsed or not fully expanded
    expect(firstBtn).toHaveAttribute('aria-expanded', 'false');
    expect(secondBtn).toHaveAttribute('aria-expanded', 'false');

    // Expand the first FAQ
    fireEvent.click(firstBtn);
    expect(firstBtn).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Yes. Registration is completely free.')).toBeInTheDocument();

    // Clicking it again collapses it
    fireEvent.click(firstBtn);
    expect(firstBtn).toHaveAttribute('aria-expanded', 'false');

    // Expand the first and then click the second: exclusive accordion behavior
    fireEvent.click(firstBtn);
    fireEvent.click(secondBtn);
    expect(firstBtn).toHaveAttribute('aria-expanded', 'false');
    expect(secondBtn).toHaveAttribute('aria-expanded', 'true');
  });

  it('applies focus-visible ring styles and has no role="presentation" container', () => {
    render(<SupportFaq />);

    const btn = screen.getByTestId('faq-button-registration-free');
    expect(btn).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2', 'focus-visible:ring-offset-2');

    // Confirm that the accordion layout container does not have role="presentation"
    const accordionContainer = screen.getByTestId('faq-accordion');
    expect(accordionContainer).not.toHaveAttribute('role', 'presentation');
  });

  it('fires trackEvent asynchronously with stable keys and no timestamps', async () => {
    render(<SupportFaq />);

    const firstBtn = screen.getByTestId('faq-button-registration-free');

    // Expand the first FAQ
    fireEvent.click(firstBtn);

    await waitFor(() => {
      expect(trackEvent).toHaveBeenCalledTimes(1);
    });

    expect(trackEvent).toHaveBeenCalledWith('seller_onboarding_faq_opened', {
      faqId: 'registration-free',
    });
  });

  it('isolates errors if trackEvent throws an exception', async () => {
    (trackEvent as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Analytics ingestion pipeline failed');
    });

    render(<SupportFaq />);
    const firstBtn = screen.getByTestId('faq-button-registration-free');

    // Toggle FAQ item. The state must still expand successfully despite analytics error
    expect(() => fireEvent.click(firstBtn)).not.toThrow();
    expect(firstBtn).toHaveAttribute('aria-expanded', 'true');

    await waitFor(() => {
      expect(trackEvent).toHaveBeenCalledTimes(1);
    });
  });

  it('passes automated axe accessibility scans in both states', async () => {
    const { container } = render(<SupportFaq />);

    // Closed state scan
    let results = await axe(container);
    expect(results).toHaveNoViolations();

    // Expand first item
    const firstBtn = screen.getByTestId('faq-button-registration-free');
    fireEvent.click(firstBtn);

    // Open state scan
    results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('is optimized via memoization wrapper', () => {
    expect((SupportFaq as any).$$typeof).toBe(Symbol.for('react.memo'));
    expect(SupportFaq.displayName).toBe('SupportFaq');
  });
});
