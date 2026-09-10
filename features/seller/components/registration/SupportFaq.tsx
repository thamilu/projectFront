'use client';

import React from 'react';
import { cn } from '@/shared/utils';
import { SupportContactWidget } from './SupportContactWidget';
import { FaqAccordion } from './FaqAccordion';

/**
 * Props for the SupportFaq component.
 */
interface SupportFaqProps {
  /** Optional override for support contact email. Passed to SupportContactWidget. */
  supportEmail?: string;
  /** Optional override for support contact email subject. Passed to SupportContactWidget. */
  supportSubject?: string;
}

/**
 * SupportFaq renders the support contact card and the FAQ accordion together.
 * Conforms to enterprise SOLID and DRY principles.
 *
 * @example
 * // With default config:
 * <SupportFaq />
 *
 * // With custom contact overrides:
 * <SupportFaq supportEmail="partner-support@test.com" supportSubject="Partner Setup Help" />
 */
export const SupportFaq = React.memo(function SupportFaq({
  supportEmail,
  supportSubject,
}: SupportFaqProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-950 border rounded-2xl p-6 shadow-sm space-y-6',
        'border-slate-200 dark:border-slate-800/80'
      )}
      data-testid="support-faq"
    >
      {/* Help & Support Widget Component */}
      <SupportContactWidget
        supportEmail={supportEmail}
        supportSubject={supportSubject}
      />

      <div className="border-slate-200 dark:border-slate-800/80 border-t" />

      {/* FAQ Accordion Section Component */}
      <FaqAccordion />
    </div>
  );
});

SupportFaq.displayName = 'SupportFaq';

export default SupportFaq;
