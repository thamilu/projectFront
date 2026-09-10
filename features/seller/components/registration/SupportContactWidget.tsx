'use client';

import React, { useMemo } from 'react';
import { LifeBuoy } from 'lucide-react';
import { useI18n } from '@/core/i18n';
import { SUPPORT_CONFIG } from '@/features/seller/constants/onboarding-assistant-config';

/**
 * Props for the SupportContactWidget component.
 */
interface SupportContactWidgetProps {
  /** Optional override for support email address. Falls back to SUPPORT_CONFIG.email. */
  supportEmail?: string;
  /** Optional override for support email subject. Falls back to SUPPORT_CONFIG.subject. */
  supportSubject?: string;
}

/**
 * Builds a safe mailto: URI by validating formatting parameters.
 * Falls back to '#' if email is invalid or missing.
 */
function buildSupportMailtoHref(email?: string, subject?: string): string {
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[SupportContactWidget] Invalid support email configuration:', email);
    }
    return '#';
  }
  return `mailto:${email}?subject=${encodeURIComponent(subject ?? '')}`;
}

/**
 * SupportContactWidget renders a contact support card with email fallback validation,
 * accessibility descriptors, and token contrast compatibility.
 */
export const SupportContactWidget = React.memo(function SupportContactWidget({
  supportEmail,
  supportSubject,
}: SupportContactWidgetProps): React.JSX.Element {
  const { t } = useI18n();

  const email = supportEmail ?? SUPPORT_CONFIG.email;
  const subject = supportSubject ?? SUPPORT_CONFIG.subject;

  // Memoize construction of the mailto URL to prevent redundant execution
  const mailtoHref = useMemo(
    () => buildSupportMailtoHref(email, subject),
    [email, subject]
  );

  return (
    <div className="space-y-3" data-testid="support-contact-widget">
      {/* WCAG AA contrast check: text-slate-900 / dark:text-slate-100 */}
      <h4 className="text-slate-900 dark:text-slate-100 flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase">
        <LifeBuoy className="text-primary h-4 w-4" aria-hidden="true" />
        {t('supportFaq.needSupport')}
      </h4>
      {/* WCAG AA contrast check: text-slate-500 / dark:text-slate-300 */}
      <p className="text-slate-500 dark:text-slate-300 text-xs">
        {t('supportFaq.description')}
      </p>
      <a
        href={mailtoHref}
        className="bg-primary/5 hover:bg-primary/10 text-primary border-primary/20 flex h-10 w-full items-center justify-center rounded-xl border text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950"
        aria-label={t('supportFaq.emailSupportLabel')}
        data-testid="support-email-link"
      >
        {t('supportFaq.emailSupport')}
      </a>
    </div>
  );
});

SupportContactWidget.displayName = 'SupportContactWidget';

export default SupportContactWidget;
