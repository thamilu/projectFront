'use client';

import React from 'react';
import { useI18n } from '@/core/i18n';
import { HOW_IT_WORKS_STEPS } from '@/features/seller/constants/how-it-works-config';

/**
 * Displays the "How It Works" step-by-step registration instructions.
 * Refactored to meet accessibility (WCAG AA), localization (i18n),
 * and clean architecture standards.
 */
export function HowItWorks(): React.JSX.Element {
  const { t } = useI18n();

  return (
    <section aria-labelledby="how-it-works-heading" className="mx-auto max-w-4xl space-y-8">
      <div className="text-center space-y-2">
        <h2 id="how-it-works-heading" className="text-slate-900 dark:text-white text-2xl font-bold tracking-tight">
          {t('sellerOnboarding.howItWorks.title', { defaultValue: 'How It Works' })}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-lg mx-auto">
          {t('sellerOnboarding.howItWorks.subtitle', { defaultValue: 'Start selling on our marketplace in three simple and secure steps.' })}
        </p>
      </div>

      <div role="list" className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
        {HOW_IT_WORKS_STEPS.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.number}
              role="listitem"
              className="relative flex flex-col items-center text-center p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100/80 dark:border-slate-800/40 shadow-xs"
            >
              {/* Step number badge */}
              <span className="absolute top-4 left-4 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold font-mono">
                <span className="sr-only">
                  {t('common.step', { defaultValue: 'Step' })}
                  {` `}
                </span>
                {step.number}
              </span>

              {/* Icon wrapper */}
              <div className="mt-4 mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/5 text-primary">
                <Icon className="h-6 w-6" aria-hidden="true" />
              </div>

              <h3 className="text-slate-900 dark:text-white text-sm font-bold mb-2">
                {t(step.titleKey)}
              </h3>
              
              <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
                {t(step.descKey)}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default HowItWorks;
