import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { SubscriptionPlans } from '@/features/seller/components/registration/SubscriptionPlans';

expect.extend(toHaveNoViolations);

// Mock dynamic translation dictionary hook
jest.mock('@/core/i18n', () => ({
  useI18n: () => ({
    t: (key: string, params?: any) => {
      const translations: Record<string, string> = {
        'subscriptionPlans.valueProp.title': 'Start Free, Upgrade When You Grow',
        'subscriptionPlans.valueProp.subtitle': 'Unlike other marketplaces...',
        'subscriptionPlans.valueProp.keepSales.title': 'Keep 100% of Sales',
        'subscriptionPlans.valueProp.keepSales.desc': 'No hidden commission deductions.',
        'subscriptionPlans.valueProp.listings.title': 'Unlimited Product Listings',
        'subscriptionPlans.valueProp.listings.desc': 'Add as many items...',
        'subscriptionPlans.valueProp.relations.title': 'Direct Customer Relations',
        'subscriptionPlans.valueProp.relations.desc': 'Own your brand...',
        'subscriptionPlans.pricing.title': 'Grow Beyond The Free Plan',
        'subscriptionPlans.pricing.subtitle': 'Subscription plans apply...',
        'subscriptionPlans.pricing.mostPopular': 'Most Popular',
        'subscriptionPlans.pricing.perMonth': 'month',
        'subscriptionPlans.pricing.notIncluded': 'not included',
        'subscriptionPlans.pricing.celebrationEmoji': 'party popper',
        'subscriptionPlans.pricing.ctaAria': `${params?.ctaText} — ${params?.planName} plan at ${params?.price} per month`,
        'subscriptionPlans.pricing.starter.name': 'Starter',
        'subscriptionPlans.pricing.starter.desc': 'Starter plan description',
        'subscriptionPlans.pricing.starter.cta': 'Start with Starter',
        'subscriptionPlans.pricing.growth.name': 'Growth',
        'subscriptionPlans.pricing.growth.desc': 'Growth plan description',
        'subscriptionPlans.pricing.growth.cta': 'Scale with Growth',
        'subscriptionPlans.pricing.professional.name': 'Professional',
        'subscriptionPlans.pricing.professional.desc': 'Professional plan description',
        'subscriptionPlans.pricing.professional.cta': 'Go Professional',
        'subscriptionPlans.freePlan.title': 'Start Your Selling Journey 100% Free',
        'subscriptionPlans.freePlan.registration': 'Free Seller Registration',
        'subscriptionPlans.freePlan.threeProducts': 'First 3 Products Free',
        'subscriptionPlans.freePlan.firstMonth': 'First Month Free',
        'subscriptionPlans.freePlan.noCommission': 'No Commission On Sales',
        'subscriptionPlans.freePlan.upgradeNeeded': 'Upgrade Only When Needed',
        'subscriptionPlans.notice.title': 'No Credit Card Required to Register',
        'subscriptionPlans.notice.body': 'Register and list...',
        'subscriptionPlans.notice.tipEmoji': 'light bulb',
        'subscriptionPlans.features.keepSales': 'Keep 100% of your sales',
        'subscriptionPlans.features.listings100': 'Up to 100 product listings',
        'subscriptionPlans.features.listingsUnlimited': 'Unlimited product listings',
        'subscriptionPlans.features.orderManagement': 'Standard order management',
        'subscriptionPlans.features.paymentProcessing': 'eShop payment processing',
        'subscriptionPlans.features.marketingTools': 'Advanced marketing tools',
        'subscriptionPlans.features.supportRep': 'Dedicated support representative',
        'subscriptionPlans.features.analyticsDashboard': 'Advanced analytics dashboard',
        'subscriptionPlans.features.storefrontConfig': 'Custom storefront configuration',
        'subscriptionPlans.features.seoTools': 'Advanced SEO & marketing tools',
        'subscriptionPlans.features.everythingInGrowth': 'Everything in Growth plan',
        'subscriptionPlans.features.domainIntegration': 'Custom domain integration',
        'subscriptionPlans.features.apiIntegration': 'API integration & webhook feeds',
        'subscriptionPlans.platform.title': 'Comprehensive Platform Features',
        'subscriptionPlans.platform.subtitle': 'Every subscription plan includes...',
        'subscriptionPlans.platform.inventory.title': 'Inventory Management',
        'subscriptionPlans.platform.inventory.desc': 'Real-time stock sync...',
        'subscriptionPlans.platform.order.title': 'Order Management',
        'subscriptionPlans.platform.order.desc': 'Bulk order updates...',
        'subscriptionPlans.platform.message.title': 'Customer Messaging',
        'subscriptionPlans.platform.message.desc': 'Secure, integrated...',
        'subscriptionPlans.platform.marketing.title': 'Marketing Tools',
        'subscriptionPlans.platform.marketing.desc': 'Custom storefront...',
        'subscriptionPlans.platform.seo.title': 'SEO Optimization',
        'subscriptionPlans.platform.seo.desc': 'Configure meta tags...',
        'subscriptionPlans.platform.analytics.title': 'Analytics Dashboard',
        'subscriptionPlans.platform.analytics.desc': 'Weekly sales reports...',
      };
      return translations[key] || key;
    },
    locale: 'en',
  }),
}));

// Mock OnboardingLandingCTA for verifying link logic and props validation
jest.mock('@/features/seller/components/registration/OnboardingLandingCTA', () => {
  return {
    OnboardingLandingCTA: function MockOnboardingLandingCTA({
      ctaLink,
      planName,
      ariaLabel,
      children,
      className,
    }: any) {
      return (
        <a
          href={ctaLink}
          data-testid={`cta-${planName?.toLowerCase()}`}
          aria-label={ariaLabel}
          className={className}
        >
          {children}
        </a>
      );
    },
  };
});

describe('SubscriptionPlans Component', () => {
  const defaultCtaLink = '/seller/register?flow=wizard';

  it('renders all key sections and unified landmark heading', () => {
    render(<SubscriptionPlans ctaLink={defaultCtaLink} />);

    // Validate the core section container exists and uses the proper ID label
    const section = screen.getByTestId('subscription-plans');
    expect(section).toBeInTheDocument();
    expect(section).toHaveAttribute('aria-labelledby', 'pricing-heading');

    // Section title
    expect(screen.getByRole('heading', { name: 'Grow Beyond The Free Plan', level: 2 })).toBeInTheDocument();

    // Section subtitles and descriptions
    expect(screen.getByText('Start Free, Upgrade When You Grow')).toBeInTheDocument();
    expect(screen.getByText('Comprehensive Platform Features')).toBeInTheDocument();
  });

  it('applies localized currency formatting to monthly prices', () => {
    render(<SubscriptionPlans ctaLink={defaultCtaLink} />);

    // Verify INR numeric values format to rupee strings
    expect(screen.getByText('₹499')).toBeInTheDocument();
    expect(screen.getByText('₹999')).toBeInTheDocument();
    expect(screen.getByText('₹1,999')).toBeInTheDocument();
  });

  it('hides all decorative check and status icons from screen readers', () => {
    const { container } = render(<SubscriptionPlans ctaLink={defaultCtaLink} />);

    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
    svgs.forEach((svg) => {
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });

  it('annotates not-included features for screen readers using semantic sr-only details', () => {
    render(<SubscriptionPlans ctaLink={defaultCtaLink} />);

    // Starter plan: marketingTools and supportRep are not included
    const starterCard = screen.getByTestId('plan-card-starter');
    const marketingText = starterCard.querySelector('[data-testid="feature-marketingTools"]');
    const supportText = starterCard.querySelector('[data-testid="feature-supportRep"]');

    expect(marketingText).toBeInTheDocument();
    expect(marketingText).toHaveTextContent('Advanced marketing tools — not included');

    expect(supportText).toBeInTheDocument();
    expect(supportText).toHaveTextContent('Dedicated support representative — not included');
  });

  it('includes popular badge description into the h3 accessible outline', () => {
    render(<SubscriptionPlans ctaLink={defaultCtaLink} />);

    const growthCard = screen.getByTestId('plan-card-growth');
    const heading = growthCard.querySelector('h3');
    expect(heading).toHaveTextContent('Growth — Most Popular');
  });

  it('applies correct responsive breakpoints and layout grid classes', () => {
    const { container } = render(<SubscriptionPlans ctaLink={defaultCtaLink} />);

    // Value Propositions grid
    const valuePropGrid = container.querySelector('.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3');
    expect(valuePropGrid).toBeInTheDocument();

    // Platform features grid
    const platformGrid = container.querySelector('.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3');
    expect(platformGrid).toBeInTheDocument();
  });

  it('applies plan parameter dynamically to simple ctaLinks', () => {
    render(<SubscriptionPlans ctaLink={defaultCtaLink} />);

    // Validate starter link appends correctly
    const starterCta = screen.getByTestId('cta-starter');
    expect(starterCta).toHaveAttribute('href', '/seller/register?flow=wizard&plan=starter');

    // Growth
    const growthCta = screen.getByTestId('cta-growth');
    expect(growthCta).toHaveAttribute('href', '/seller/register?flow=wizard&plan=growth');

    // Professional
    const professionalCta = screen.getByTestId('cta-professional');
    expect(professionalCta).toHaveAttribute('href', '/seller/register?flow=wizard&plan=professional');
  });

  it('applies plan parameter inside OAuth sign-in callbackUrl redirect path', () => {
    const complexSignInLink = `/api/auth/signin?callbackUrl=${encodeURIComponent('/seller/register?flow=wizard')}`;
    render(<SubscriptionPlans ctaLink={complexSignInLink} />);

    const starterCta = screen.getByTestId('cta-starter');
    const expectedUrl = `/api/auth/signin?callbackUrl=${encodeURIComponent('/seller/register?flow=wizard&plan=starter')}`;
    expect(starterCta).toHaveAttribute('href', expectedUrl);
  });

  it('is wrapped in React.memo for rendering optimizations', () => {
    expect((SubscriptionPlans as any).$$typeof).toBe(Symbol.for('react.memo'));
    expect(SubscriptionPlans.displayName).toBe('SubscriptionPlans');
  });

  it('should pass axe accessibility scan checks', async () => {
    const { container } = render(<SubscriptionPlans ctaLink={defaultCtaLink} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
