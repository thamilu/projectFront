import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { SupportSection } from '@/features/seller/components/registration/SupportSection';

expect.extend(toHaveNoViolations);

// Mock translation hooks
jest.mock('@/core/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'sellerOnboarding.assistant.needAssistance': 'Need Assistance?',
        'sellerOnboarding.assistant.chatSupport': 'Chat with Support',
        'sellerOnboarding.assistant.emailSupport': 'Email Support',
        'sellerOnboarding.assistant.emailSupportLabel': 'Email Support (opens email client)',
        'sellerOnboarding.assistant.openingChat': 'Opening Chat...',
      };
      return translations[key] || key;
    },
    locale: 'en',
  }),
}));

// Mock config constants
jest.mock('@/features/seller/constants/onboarding-assistant-config', () => ({
  SUPPORT_CONFIG: {
    email: 'support@example.com',
    subject: 'Onboarding Help Request',
  },
}));

describe('SupportSection Component', () => {
  it('renders chat button when onSupportClick is provided', () => {
    const handleSupportClick = jest.fn();
    render(<SupportSection onSupportClick={handleSupportClick} />);

    // Renders title and button text correctly
    expect(screen.getByText('Need Assistance?')).toBeInTheDocument();
    const chatBtn = screen.getByTestId('support-chat-button');
    expect(chatBtn).toBeInTheDocument();
    expect(chatBtn).toHaveTextContent('Chat with Support');
    
    // No aria-label duplication on button
    expect(chatBtn).not.toHaveAttribute('aria-label');

    // Clicking fires the handler
    fireEvent.click(chatBtn);
    expect(handleSupportClick).toHaveBeenCalledTimes(1);
  });

  it('renders mailto fallback link when onSupportClick is undefined', () => {
    render(<SupportSection />);

    const emailLink = screen.getByTestId('support-email-link');
    expect(emailLink).toBeInTheDocument();
    expect(emailLink).toHaveTextContent('Email Support');
    expect(emailLink).toHaveAttribute(
      'href',
      'mailto:support@example.com?subject=Onboarding%20Help%20Request'
    );
    expect(emailLink).toHaveAttribute(
      'aria-label',
      'Email Support (opens email client)'
    );
  });

  it('allows overriding support details using custom props', () => {
    render(
      <SupportSection
        supportEmail="custom@test.com"
        supportSubject="Custom Help Subject"
      />
    );

    const emailLink = screen.getByTestId('support-email-link');
    expect(emailLink).toHaveAttribute(
      'href',
      'mailto:custom@test.com?subject=Custom%20Help%20Subject'
    );
  });

  it('falls back safely to # when support email is empty or malformed', () => {
    // Empty email
    const { rerender } = render(<SupportSection supportEmail="" />);
    expect(screen.getByTestId('support-email-link')).toHaveAttribute('href', '#');

    // Malformed email
    rerender(<SupportSection supportEmail="not-an-email" />);
    expect(screen.getByTestId('support-email-link')).toHaveAttribute('href', '#');
  });

  it('isolates errors if the custom onSupportClick callback throws', () => {
    const buggyClick = jest.fn(() => {
      throw new Error('Chat widget initialization failed');
    });

    render(<SupportSection onSupportClick={buggyClick} />);

    const chatBtn = screen.getByTestId('support-chat-button');
    expect(() => fireEvent.click(chatBtn)).not.toThrow();
    expect(buggyClick).toHaveBeenCalledTimes(1);
  });

  it('renders loading feedback and disables interaction when isLoading is active', () => {
    render(<SupportSection onSupportClick={jest.fn()} isLoading={true} />);

    const chatBtn = screen.getByTestId('support-chat-button');
    expect(chatBtn).toBeDisabled();
    expect(chatBtn).toHaveAttribute('aria-busy', 'true');
    expect(chatBtn).toHaveTextContent('Opening Chat...');

    // Loading spinner (Loader2) icon should render and be hidden from screen readers
    const spinner = chatBtn.querySelector('svg');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute('aria-hidden', 'true');
  });

  it('applies focus-visible visibility classes matching the design system', () => {
    render(<SupportSection onSupportClick={jest.fn()} />);

    const chatBtn = screen.getByTestId('support-chat-button');
    expect(chatBtn).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2', 'focus-visible:ring-offset-2');
  });

  it('is wrapped in React.memo for rendering optimizations', () => {
    expect((SupportSection as any).$$typeof).toBe(Symbol.for('react.memo'));
    expect(SupportSection.displayName).toBe('SupportSection');
  });

  it('should pass axe accessibility scan compliance', async () => {
    const { container } = render(<SupportSection onSupportClick={jest.fn()} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
