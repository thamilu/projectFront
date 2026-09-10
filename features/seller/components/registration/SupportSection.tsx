'use client';

import React, { useCallback, useMemo } from 'react';
import { LifeBuoy, Loader2 } from 'lucide-react';
import { useI18n } from '@/core/i18n';
import { cn } from '@/shared/utils';
import { SUPPORT_CONFIG } from '@/features/seller/constants/onboarding-assistant-config';

/**
 * Props for the SupportSection component.
 */
interface SupportSectionProps {
  /**
   * Callback triggered when clicking the primary support CTA button (e.g., opens a chat).
   * If not provided, falls back to rendering a mailto: link.
   */
  onSupportClick?: () => void;
  /**
   * Optional loading state. When true, the button is disabled, shows a spinner,
   * and sets aria-busy="true".
   */
  isLoading?: boolean;
  /**
   * Optional override for support email address. Falls back to SUPPORT_CONFIG.email.
   */
  supportEmail?: string;
  /**
   * Optional override for support email subject line. Falls back to SUPPORT_CONFIG.subject.
   */
  supportSubject?: string;
}

/**
 * Builds a safe mailto: URI by validating formatting parameters.
 * Falls back to '#' if email is invalid or missing.
 */
function buildSupportMailtoHref(email?: string, subject?: string): string {
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[SupportSection] Invalid support email configuration:', email);
    }
    return '#';
  }
  return `mailto:${email}?subject=${encodeURIComponent(subject ?? '')}`;
}

/**
 * SupportSection renders support action items in the seller onboarding sidebar.
 * When `onSupportClick` is provided, renders a button to trigger live support actions.
 * Otherwise, renders a mailto anchor link.
 */
export const SupportSection = React.memo(function SupportSection({
  onSupportClick,
  isLoading = false,
  supportEmail,
  supportSubject,
}: SupportSectionProps): React.JSX.Element {
  const { t } = useI18n();

  const email = supportEmail ?? SUPPORT_CONFIG.email;
  const subject = supportSubject ?? SUPPORT_CONFIG.subject;

  // Memoize construction and validation of the mailto URL to prevent redundant execution
  const mailtoHref = useMemo(
    () => buildSupportMailtoHref(email, subject),
    [email, subject]
  );

  // Wrap the custom callback in a try/catch error isolation block (Issue 10)
  const handleSupportClick = useCallback(() => {
    try {
      onSupportClick?.();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[SupportSection] onSupportClick threw an exception:', error);
      }
    }
  }, [onSupportClick]);

  // DRY class strings using tailwind-merge (Issue 8)
  const supportButtonClass = cn(
    'bg-primary hover:bg-primary/90 text-white',
    'flex h-11 w-full items-center justify-center', // h-11 = 44px target (Issue 13)
    'rounded-xl text-xs font-semibold shadow-md transition-all',
    'focus-visible:outline-none focus-visible:ring-2',
    'focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950'
  );

  return (
    <div className="space-y-3" data-testid="support-section">
      {/* Upgraded color contrast to text-slate-300 for WCAG AA compliance (Issue 6) */}
      <h4 className="text-xs text-slate-300 font-bold tracking-wider uppercase">
        {t('sellerOnboarding.assistant.needAssistance')}
      </h4>

      {onSupportClick ? (
        <button
          type="button"
          onClick={handleSupportClick}
          disabled={isLoading}
          aria-busy={isLoading}
          className={cn(supportButtonClass, 'cursor-pointer', isLoading && 'opacity-70 cursor-not-allowed')}
          data-testid="support-chat-button"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <LifeBuoy className="mr-2 h-4 w-4 shrink-0" aria-hidden="true" />
          )}
          {isLoading
            ? t('sellerOnboarding.assistant.openingChat')
            : t('sellerOnboarding.assistant.chatSupport')}
        </button>
      ) : (
        <a
          href={mailtoHref}
          rel="noopener noreferrer"
          className={supportButtonClass}
          aria-label={t('sellerOnboarding.assistant.emailSupportLabel')}
          data-testid="support-email-link"
        >
          <LifeBuoy className="mr-2 h-4 w-4 shrink-0" aria-hidden="true" />
          {t('sellerOnboarding.assistant.emailSupport')}
        </a>
      )}
    </div>
  );
});

SupportSection.displayName = 'SupportSection';

export default SupportSection;
