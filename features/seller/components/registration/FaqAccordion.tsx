'use client';

import React, { useState, useCallback } from 'react';
import { HelpCircle } from 'lucide-react';
import { useI18n } from '@/core/i18n';
import { trackEvent } from '@/core/providers/analytics-provider';
import { FAQS_CONFIG } from '../../config/support-faq.config';
import { FaqAccordionItem } from './FaqAccordionItem';

/**
 * FaqAccordion orchestrates the controlled state of the FAQ items, renders the
 * list of accordion items, and logs opening events asynchronously with error isolation.
 */
export const FaqAccordion = React.memo(function FaqAccordion(): React.JSX.Element {
  const { t } = useI18n();
  const [openId, setOpenId] = useState<string | null>(null);

  const toggleFaq = useCallback((id: string) => {
    setOpenId((prevId) => {
      const nextId = prevId === id ? null : id;
      
      if (nextId !== null) {
        // Fire analytics events asynchronously to never block or delay the main UI thread
        void Promise.resolve().then(() => {
          try {
            trackEvent('seller_onboarding_faq_opened', {
              faqId: id,
            });
          } catch (error) {
            if (process.env.NODE_ENV === 'development') {
              console.error('[FaqAccordion] trackEvent failed:', error);
            }
          }
        });
      }
      return nextId;
    });
  }, []);

  return (
    <div className="space-y-3" data-testid="faq-accordion-section">
      <h4 className="text-slate-900 dark:text-white flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase">
        <HelpCircle className="text-primary h-4 w-4" aria-hidden="true" />
        {t('supportFaq.faqHeading')}
      </h4>

      {/* Accordion container — no role="presentation" to preserve structural accessibility semantics */}
      <div className="space-y-2.5" data-testid="faq-accordion">
        {FAQS_CONFIG.map((faq) => (
          <FaqAccordionItem
            key={faq.id}
            faq={faq}
            isOpen={openId === faq.id}
            onToggle={() => toggleFaq(faq.id)}
          />
        ))}
      </div>
    </div>
  );
});

FaqAccordion.displayName = 'FaqAccordion';

export default FaqAccordion;
