import React from 'react';
import { render, screen } from '@testing-library/react';
import { HowItWorks } from '@/features/seller/components/registration/HowItWorks';

// Mock i18n translation hook
jest.mock('@/core/i18n', () => ({
  useI18n: () => ({
    t: (key: string, _params?: any) => {
      const translations: Record<string, string> = {
        'common.step': 'Step',
        'sellerOnboarding.howItWorks.title': 'How It Works',
        'sellerOnboarding.howItWorks.subtitle': 'Start selling on our marketplace in three simple and secure steps.',
        'sellerOnboarding.howItWorks.step1.title': 'Register Profile',
        'sellerOnboarding.howItWorks.step1.desc': 'Enter your personal information, address, and store settings in our secure form.',
        'sellerOnboarding.howItWorks.step2.title': 'Verification & Audit',
        'sellerOnboarding.howItWorks.step2.desc': 'Our compliance team audits your KYC documents and tax details within 24 business hours.',
        'sellerOnboarding.howItWorks.step3.title': 'Launch Store',
        'sellerOnboarding.howItWorks.step3.desc': 'Set up your inventory catalog and instantly start selling to customers across the country.',
      };
      return translations[key] || key;
    },
    locale: 'en',
  }),
}));

describe('HowItWorks Component', () => {
  it('renders heading and subtitle correctly with translations', () => {
    render(<HowItWorks />);
    expect(screen.getByRole('heading', { name: 'How It Works', level: 2 })).toBeInTheDocument();
    expect(screen.getByText('Start selling on our marketplace in three simple and secure steps.')).toBeInTheDocument();
  });

  it('implements correct semantic list roles', () => {
    render(<HowItWorks />);
    const listElement = screen.getByRole('list');
    expect(listElement).toBeInTheDocument();
    
    const listItemElements = screen.getAllByRole('listitem');
    expect(listItemElements).toHaveLength(3);
  });

  it('renders step labels with correct step numbering for screen readers', () => {
    const { container } = render(<HowItWorks />);
    
    // Find the badges containing step numbering
    const badges = container.querySelectorAll('.absolute.top-4.left-4');
    expect(badges).toHaveLength(3);
    
    expect(badges[0].textContent?.replace(/\s+/g, ' ').trim()).toBe('Step 1');
    expect(badges[1].textContent?.replace(/\s+/g, ' ').trim()).toBe('Step 2');
    expect(badges[2].textContent?.replace(/\s+/g, ' ').trim()).toBe('Step 3');
  });

  it('renders visual icons and sets aria-hidden="true" to exclude them from accessibility tree', () => {
    render(<HowItWorks />);
    const icons = document.querySelectorAll('svg');
    expect(icons.length).toBe(3);
    icons.forEach((icon) => {
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  it('renders step descriptions correctly', () => {
    render(<HowItWorks />);
    expect(screen.getByText('Register Profile')).toBeInTheDocument();
    expect(screen.getByText('Enter your personal information, address, and store settings in our secure form.')).toBeInTheDocument();
    
    expect(screen.getByText('Verification & Audit')).toBeInTheDocument();
    expect(screen.getByText('Our compliance team audits your KYC documents and tax details within 24 business hours.')).toBeInTheDocument();
    
    expect(screen.getByText('Launch Store')).toBeInTheDocument();
    expect(screen.getByText('Set up your inventory catalog and instantly start selling to customers across the country.')).toBeInTheDocument();
  });

  it('does not contain false hover indicators to prevent confusing static card elements', () => {
    const { container } = render(<HowItWorks />);
    const items = container.querySelectorAll('[role="listitem"]');
    items.forEach((item) => {
      // Check that interactive styling classes are removed
      expect(item).not.toHaveClass('hover:-translate-y-0.5');
      expect(item).not.toHaveClass('hover:shadow-md');
      expect(item).not.toHaveClass('transition-all');
    });
  });
});
