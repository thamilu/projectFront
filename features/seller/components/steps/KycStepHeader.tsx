'use client';

import { Icon } from '@/shared/ui/atoms';
import { useI18n } from '@/core/i18n';

interface KycStepHeaderProps {
  /**
   * The `id` applied to the `<h2>` heading element.
   * Must match the `aria-labelledby` attribute on the parent `<section>`
   * to establish an accessible labeling relationship (WCAG 2.2 AA).
   */
  headingId: string;
  /**
   * Optional custom `id` applied to the `<p>` description element.
   * Enables explicit description association via `aria-describedby` on the parent `<section>`.
   * @default `${headingId}-desc`
   */
  descriptionId?: string;
  /**
   * Optional custom title string. Enables i18n localization overrides.
   */
  title?: string;
  /**
   * Optional custom description string. Enables i18n localization overrides.
   */
  description?: string;
}

export function KycStepHeader({
  headingId,
  descriptionId = `${headingId}-desc`,
  title,
  description,
}: KycStepHeaderProps) {
  const { t } = useI18n();

  const displayTitle = title ?? t('sellerOnboarding.kyc.header.title', {
    defaultValue: 'Verify Your Identity',
  });

  const displayDescription = description ?? t('sellerOnboarding.kyc.header.description', {
    defaultValue: 'We need this to securely verify your seller status.',
  });

  return (
    <header className="mb-8 text-center" data-testid="kyc-step-header">
      {displayTitle && (
        <h2
          id={headingId}
          className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground"
          data-testid="kyc-step-heading"
        >
          {displayTitle}
        </h2>
      )}
      {displayDescription && (
        <p
          id={descriptionId}
          className="text-muted-foreground mt-2 flex items-center justify-center gap-1.5 text-sm sm:text-base"
          data-testid="kyc-step-description"
        >
          <Icon name="ShieldCheck" className="text-success h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{displayDescription}</span>
        </p>
      )}
    </header>
  );
}

KycStepHeader.displayName = 'KycStepHeader';
