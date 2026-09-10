'use client';

import React, { memo } from 'react';
import { useOnboardingStore } from '../../store/onboarding-store';
import { useI18n } from '@/core/i18n';

interface SellerHeaderProgressProps {
  isWizardFlow?: boolean;
}

/**
 * SellerHeaderProgress - Wizard progress bar and text tracker for seller onboarding registration.
 * Conforms to enterprise performance (Zustand selectors, React.memo) and WCAG 2.2 AA accessibility guidelines.
 */
export const SellerHeaderProgress = memo<SellerHeaderProgressProps>(
  function SellerHeaderProgress({ isWizardFlow = false }): React.JSX.Element | null {
    const { t } = useI18n();

    // Granular selectors to minimize re-renders on other store changes
    const currentStep = useOnboardingStore((s) => s.currentStep);
    const totalSteps = useOnboardingStore((s) => s.totalSteps);
    const stepTitle = useOnboardingStore((s) => s.stepTitle);

    if (!isWizardFlow) {
      return null;
    }

    const displayStep = currentStep + 1;

    // Guard against division by zero (e.g. if totalSteps has not loaded or is set to 0)
    const percentage = totalSteps > 0 ? Math.round((displayStep / totalSteps) * 100) : 0;

    // Retrieve localized string using the translation helper
    const progressText = t('sellerOnboarding.progress.stepText', {
      current: displayStep,
      total: totalSteps,
    });

    const displayTitle = stepTitle || 'Onboarding';

    return (
      <>
        {/* Mobile Viewport: Text-Only fallback to avoid horizontal overflow & give context */}
        <div className="md:hidden flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 select-none">
          <span className="font-semibold text-foreground">{displayStep}/{totalSteps}</span>
          <span className="truncate max-w-[120px]" title={displayTitle}>
            {displayTitle}
          </span>
        </div>

        {/* Desktop Viewport: Full Progress Bar layout */}
        <div className="hidden md:flex flex-col items-center justify-center flex-1 max-w-[240px] lg:max-w-[320px] mx-auto px-4 select-none">
          <div className="flex items-center justify-between w-full text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
            <span className="truncate max-w-[120px] lg:max-w-[160px]" title={displayTitle}>
              {displayTitle}
            </span>
            <span className="text-foreground shrink-0">{progressText}</span>
          </div>

          {/* Stable track container with progressbar role attributes (WCAG 4.1.2) */}
          <div
            role="progressbar"
            aria-valuenow={percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuetext={`Step ${displayStep} of ${totalSteps}${stepTitle ? ` — ${stepTitle}` : ''}`}
            aria-label="Seller onboarding step progress"
            className="w-full bg-muted rounded-full h-1.5 overflow-hidden border border-border/10"
          >
            {/* Animated fill child marked as decorative/hidden (WCAG 1.1.1) */}
            <div
              className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 h-full transition-[width] duration-300 ease-out"
              style={{
                width: `${percentage}%`,
                minWidth: percentage > 0 ? '4px' : undefined,
              }}
              aria-hidden="true"
            />
          </div>

          {/* Screen Reader Live Region for Dynamic Progress updates (P2 enhancement) */}
          <div aria-live="polite" aria-atomic="true" className="sr-only">
            {`Step ${displayStep} of ${totalSteps}${stepTitle ? `: ${stepTitle}` : ''}`}
          </div>
        </div>
      </>
    );
  }
);

SellerHeaderProgress.displayName = 'SellerHeaderProgress';
