'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { useI18n } from '@/core/i18n';
import { PricingCard } from './PricingCard';
import { PLANS, FREE_PLAN_BENEFITS } from '../../config/subscription-plans.config';

interface PricingGridProps {
  /** The base redirect link for checkout. */
  ctaLink: string;
}

/**
 * PricingGrid renders the free plan summary banner, pricing cards grid, and payment warning footer.
 */
export const PricingGrid = React.memo(function PricingGrid({
  ctaLink,
}: PricingGridProps): React.JSX.Element {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      {/* Free Plan vs Paid Plans Banner */}
      <div className="bg-primary/5 border border-primary/20 dark:bg-primary/10 rounded-2xl p-6 max-w-3xl mx-auto space-y-4 shadow-sm">
        <h3 className="text-primary font-bold text-sm text-center">
          <span role="img" aria-label={t('subscriptionPlans.pricing.celebrationEmoji')}>🎉</span>
          {' '}{t('subscriptionPlans.freePlan.title')}
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-semibold text-slate-700 dark:text-slate-300 px-4">
          {FREE_PLAN_BENEFITS.map((benefitKey) => (
            <div key={benefitKey} className="flex items-center gap-2.5" data-testid="free-benefit-item">
              <Check className="h-5 w-5 text-emerald-500 shrink-0" aria-hidden="true" />
              <span>{t(benefitKey)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {PLANS.map((plan) => (
          <PricingCard key={plan.planId} plan={plan} ctaLink={ctaLink} />
        ))}
      </div>

      {/* Free Verification Period Notice */}
      <div className="text-center bg-primary/5 border border-primary/15 dark:bg-primary/10 rounded-2xl p-4 max-w-2xl mx-auto text-xs">
        <p className="font-bold text-primary">
          <span role="img" aria-label={t('subscriptionPlans.notice.tipEmoji')}>💡</span>
          {' '}{t('subscriptionPlans.notice.title')}
        </p>
        <p className="mt-1 text-slate-600 dark:text-slate-400 font-medium">
          {t('subscriptionPlans.notice.body')}
        </p>
      </div>
    </div>
  );
});

PricingGrid.displayName = 'PricingGrid';
