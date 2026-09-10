'use client';

import React, { useMemo } from 'react';
import { ShieldCheck, Minus } from 'lucide-react';
import { useI18n } from '@/core/i18n';
import { cn } from '@/shared/utils';
import { OnboardingLandingCTA } from './OnboardingLandingCTA';
import { PlanItem } from '../../config/subscription-plans.config';

interface PricingCardProps {
  /** The plan configuration item data. */
  plan: PlanItem;
  /** Base URL for onboarding call to action redirection. */
  ctaLink: string;
}

/**
 * Helper to build custom CTA URL with plan selection context.
 * Appends &plan=planId to path-based or OAuth callback URLs safely.
 */
const buildCtaUrl = (baseLink: string, planId: string): string => {
  try {
    const hasSignIn = baseLink.includes('/api/auth/signin');
    if (hasSignIn) {
      const url = new URL(baseLink, 'https://example.com');
      const callbackUrl = url.searchParams.get('callbackUrl');
      if (callbackUrl) {
        const separator = callbackUrl.includes('?') ? '&' : '?';
        url.searchParams.set('callbackUrl', `${callbackUrl}${separator}plan=${planId}`);
        return url.pathname + url.search;
      }
    }
    const separator = baseLink.includes('?') ? '&' : '?';
    return `${baseLink}${separator}plan=${planId}`;
  } catch {
    return baseLink;
  }
};

/**
 * Helper to format numeric prices locally based on ISO currency standards.
 */
const formatPrice = (amount: number, currency: string, locale: string): string => {
  const formatLocale = locale === 'hi' ? 'hi-IN' : 'en-IN';
  return new Intl.NumberFormat(formatLocale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const PricingCard = React.memo(function PricingCard({
  plan,
  ctaLink,
}: PricingCardProps): React.JSX.Element {
  const { t, locale } = useI18n();

  const planNameTranslated = t(plan.nameKey);
  
  const formattedPrice = useMemo(
    () => formatPrice(plan.priceMonthly, plan.currency, locale),
    [plan.priceMonthly, plan.currency, locale]
  );

  const ctaUrl = useMemo(
    () => buildCtaUrl(ctaLink, plan.planId),
    [ctaLink, plan.planId]
  );

  return (
    <div
      className={cn(
        "relative flex flex-col justify-between p-6 bg-white dark:bg-slate-950 border rounded-2xl shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md",
        plan.popular
          ? "border-primary ring-2 ring-primary/15 dark:ring-primary/40"
          : "border-slate-200/80 dark:border-slate-800/40"
      )}
      data-testid={`plan-card-${plan.planId}`}
    >
      {plan.popular && (
        <span
          className="absolute top-0 right-6 -translate-y-1/2 bg-primary text-white text-xs font-extrabold tracking-wider uppercase rounded-full px-3 py-0.5"
          aria-hidden="true"
        >
          {t('subscriptionPlans.pricing.mostPopular')}
        </span>
      )}

      <div>
        <h3 className="text-slate-900 dark:text-white text-base font-bold">
          {planNameTranslated}
          {plan.popular && (
            <span className="sr-only">
              {` — ${t('subscriptionPlans.pricing.mostPopular')}`}
            </span>
          )}
        </h3>
        
        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1.5 leading-relaxed min-h-[36px]">
          {t(plan.descKey)}
        </p>
        
        <div className="mt-4 flex items-baseline">
          <span className="text-slate-900 dark:text-white text-3xl font-extrabold tracking-tight">
            {formattedPrice}
          </span>
          <span className="text-slate-500 text-xs font-semibold ml-1">
            /{t('subscriptionPlans.pricing.perMonth')}
          </span>
        </div>

        <div className="border-slate-100 dark:border-slate-900 border-t my-5" aria-hidden="true" />

        <ul className="space-y-3" role="list">
          {plan.features.map((feature) => (
            <li
              key={feature.textKey}
              className="flex items-start gap-2.5 text-xs"
              data-testid={`feature-${feature.textKey.split('.').pop()}`}
            >
              {/*
                A distinct icon per state, not one icon in two shades. An
                excluded feature previously rendered the same ShieldCheck —
                a *check* mark — merely greyed, which says "yes" while meaning
                "no". A minus reads as absence at a glance and does not depend
                on the reader distinguishing two tints of the same glyph, which
                is exactly what fails for low-vision and colour-blind users.
              */}
              {feature.included ? (
                <ShieldCheck className="text-primary h-4 w-4 shrink-0" aria-hidden="true" />
              ) : (
                <Minus className="text-muted-foreground/50 h-4 w-4 shrink-0" aria-hidden="true" />
              )}
              <span
                className={cn(
                  'font-medium',
                  feature.included
                    ? 'text-foreground'
                    : // Muted, but NOT struck through. `line-through` means
                      // "deleted content" — it describes text that was removed,
                      // not a capability another tier has. Paired with a check
                      // icon it was actively contradictory. The previous
                      // `text-slate-500 dark:text-slate-500` also set the same
                      // value for both themes, so it was not theme-aware at all.
                      'text-muted-foreground'
                )}
              >
                {t(feature.textKey)}
                {!feature.included && (
                  <span className="sr-only">
                    {` — ${t('subscriptionPlans.pricing.notIncluded')}`}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6">
        <OnboardingLandingCTA
          ctaLink={ctaUrl}
          position="pricing"
          planName={planNameTranslated}
          ariaLabel={t('subscriptionPlans.pricing.ctaAria', {
            ctaText: t(plan.ctaTextKey),
            planName: planNameTranslated,
            price: formattedPrice,
          })}
          className={cn(
            "w-full flex h-11 items-center justify-center rounded-xl text-xs font-bold transition-all",
            plan.popular
              ? "bg-primary hover:bg-primary/95 text-white shadow-md"
              : "bg-slate-100 hover:bg-slate-200 text-slate-900 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-white"
          )}
        >
          {t(plan.ctaTextKey)}
        </OnboardingLandingCTA>
      </div>
    </div>
  );
});

PricingCard.displayName = 'PricingCard';
