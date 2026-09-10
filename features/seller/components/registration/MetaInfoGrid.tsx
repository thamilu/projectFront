'use client';

import React from 'react';
import { Clock, ShieldCheck } from 'lucide-react';
import { useI18n } from '@/core/i18n';

interface MetaInfoGridProps {
  /** Estimated time remaining in minutes. Inputs are clamped to non-negative values. */
  timeLeft: number;
}

/**
 * Displays onboarding progress metadata (Estimated Time Left, Security Status).
 * Uses a semantic definition list layout and design system tokens for theme scalability.
 */
export function MetaInfoGrid({ timeLeft }: MetaInfoGridProps): React.JSX.Element {
  const { t } = useI18n();

  // Guard: Sanitize input by clamping to non-negative numbers
  const safeTimeLeft = Number.isFinite(timeLeft) ? Math.max(0, timeLeft) : 0;

  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
      {/* Time Left Metadata */}
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
        <div>
          <dt className="text-muted-foreground font-bold text-xs">
            {t('sellerOnboarding.assistant.timeLeft')}
          </dt>
          <dd className="font-bold text-foreground text-xs">
            {t('sellerOnboarding.assistant.timeLeftValue', { minutes: safeTimeLeft })}
          </dd>
        </div>
      </div>

      {/* Security Metadata */}
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-success shrink-0" aria-hidden="true" />
        <div>
          <dt className="text-muted-foreground font-bold text-xs">
            {t('sellerOnboarding.assistant.security')}
          </dt>
          <dd className="font-bold text-foreground text-xs">
            {t('sellerOnboarding.assistant.securityValue')}
          </dd>
        </div>
      </div>
    </dl>
  );
}

export default MetaInfoGrid;
