'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { useI18n } from '@/core/i18n';
import { VALUE_PROPOSITIONS } from '../../config/subscription-plans.config';

/**
 * ValuePropositionSection renders the commission-free marketplace value cards.
 */
export const ValuePropositionSection = React.memo(function ValuePropositionSection(): React.JSX.Element {
  const { t } = useI18n();

  return (
    <div className="bg-slate-900/5 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/40 rounded-2xl p-6 md:p-8 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-slate-900 dark:text-white text-xl font-bold tracking-tight">
          {t('subscriptionPlans.valueProp.title')}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-xs">
          {t('subscriptionPlans.valueProp.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-semibold">
        {VALUE_PROPOSITIONS.map((prop) => (
          <div
            key={prop.titleKey}
            className="flex items-center gap-3 p-4 bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 rounded-xl shadow-sm hover:-translate-y-0.5 hover:shadow-sm transition-all duration-300"
            data-testid="value-prop-card"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-500/10 text-green-600 dark:text-green-400">
              <Check className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <p className="text-slate-900 dark:text-white">{t(prop.titleKey)}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-normal mt-0.5">
                {t(prop.descKey)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

ValuePropositionSection.displayName = 'ValuePropositionSection';
