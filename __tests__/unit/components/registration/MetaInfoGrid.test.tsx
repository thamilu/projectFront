import React from 'react';
import { render, screen } from '@testing-library/react';
import { MetaInfoGrid } from '@/features/seller/components/registration/MetaInfoGrid';

// Mock i18n translation hook
jest.mock('@/core/i18n', () => ({
  useI18n: () => ({
    t: (key: string, params?: any) => {
      const translations: Record<string, string> = {
        'sellerOnboarding.assistant.timeLeft': 'Time Left',
        'sellerOnboarding.assistant.timeLeftValue': `${params?.minutes} mins`,
        'sellerOnboarding.assistant.security': 'Security',
        'sellerOnboarding.assistant.securityValue': '256-Bit SSL',
      };
      return translations[key] || key;
    },
    locale: 'en',
  }),
}));

describe('MetaInfoGrid Component', () => {
  it('renders correct labels and values with definition list semantics', () => {
    const { container } = render(<MetaInfoGrid timeLeft={12} />);
    
    // Validate <dl> wrapper exists
    const dlElement = container.querySelector('dl');
    expect(dlElement).toBeInTheDocument();
    expect(dlElement).toHaveClass('grid', 'grid-cols-1', 'sm:grid-cols-2');

    // Validate terms (<dt>) and definitions (<dd>) exist and contain correct content
    const dtElements = container.querySelectorAll('dt');
    const ddElements = container.querySelectorAll('dd');
    
    expect(dtElements).toHaveLength(2);
    expect(ddElements).toHaveLength(2);

    expect(dtElements[0]).toHaveTextContent('Time Left');
    expect(ddElements[0]).toHaveTextContent('12 mins');
    expect(dtElements[1]).toHaveTextContent('Security');
    expect(ddElements[1]).toHaveTextContent('256-Bit SSL');
  });

  it('clamps negative timeLeft values to zero safely', () => {
    render(<MetaInfoGrid timeLeft={-15} />);
    expect(screen.getByText('0 mins')).toBeInTheDocument();
  });

  it('handles non-finite timeLeft inputs safely (fallback to 0)', () => {
    render(<MetaInfoGrid timeLeft={NaN} />);
    expect(screen.getByText('0 mins')).toBeInTheDocument();
  });

  it('excludes decorative icons from screen readers', () => {
    const { container } = render(<MetaInfoGrid timeLeft={5} />);
    const icons = container.querySelectorAll('svg');
    expect(icons).toHaveLength(2);
    icons.forEach((icon) => {
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  it('applies semantic colors and layout classes from design system', () => {
    const { container } = render(<MetaInfoGrid timeLeft={5} />);
    
    const dtElements = container.querySelectorAll('dt');
    const ddElements = container.querySelectorAll('dd');
    
    dtElements.forEach((dt) => {
      expect(dt).toHaveClass('text-muted-foreground');
    });

    ddElements.forEach((dd) => {
      expect(dd).toHaveClass('text-foreground');
    });

    // Check success text color mapping for the security icon
    const shieldIcon = container.querySelector('svg.text-success');
    expect(shieldIcon).toBeInTheDocument();
  });
});
