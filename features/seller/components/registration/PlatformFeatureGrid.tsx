'use client';

import React from 'react';
import { useI18n } from '@/core/i18n';
import { PLATFORM_FEATURES } from '../../config/subscription-plans.config';

/**
 * PlatformFeatureGrid renders the grid of admin/marketing capabilities.
 */
export const PlatformFeatureGrid = React.memo(function PlatformFeatureGrid(): React.JSX.Element {
  const { t } = useI18n();

  return (
    <div className="border-t border-slate-100 dark:border-slate-800 pt-8 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-slate-900 dark:text-white text-xl font-bold tracking-tight">
          {t('subscriptionPlans.platform.title')}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-xs">
          {t('subscriptionPlans.platform.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PLATFORM_FEATURES.map((feat) => {
          const Icon = feat.icon;
          return (
            <div
              key={feat.titleKey}
              className="flex gap-4 p-5 bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/40 rounded-2xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
              data-testid="platform-feature-card"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-primary">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <h3 className="text-slate-900 dark:text-white text-xs font-bold">{t(feat.titleKey)}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed font-normal">
                  {t(feat.descKey)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

PlatformFeatureGrid.displayName = 'PlatformFeatureGrid';
