'use client';

import React from 'react';
import { useI18n } from '@/core/i18n';
import { ValuePropositionSection } from './ValuePropositionSection';
import { PricingGrid } from './PricingGrid';
import { PlatformFeatureGrid } from './PlatformFeatureGrid';

interface SubscriptionPlansProps {
  /** Base URL for onboarding call to action redirection. */
  ctaLink: string;
}

/**
 * SubscriptionPlans orchestrates the pricing page section, including value propositions,
 * core subscription cards, and platform admin features.
 */
export const SubscriptionPlans = React.memo(function SubscriptionPlans({
  ctaLink,
}: SubscriptionPlansProps): React.JSX.Element {
  const { t } = useI18n();

  return (
    <section
      aria-labelledby="pricing-heading"
      className="space-y-10"
      data-testid="subscription-plans"
    >
      {/* Top Main Section Header - Unifies landmark labeling (Issue 4) */}
      <div className="text-center space-y-2">
        <h2
          id="pricing-heading"
          className="text-slate-900 dark:text-white text-2xl font-bold tracking-tight"
        >
          {t('subscriptionPlans.pricing.title')}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          {t('subscriptionPlans.pricing.subtitle')}
        </p>
      </div>

      {/* SaaS Model Value Prop Cards */}
      <ValuePropositionSection />

      {/* Pricing Cards, Free Banner, and Notices */}
      <PricingGrid ctaLink={ctaLink} />

      {/* Platform Features Grid */}
      <PlatformFeatureGrid />
    </section>
  );
});

SubscriptionPlans.displayName = 'SubscriptionPlans';

export default SubscriptionPlans;
