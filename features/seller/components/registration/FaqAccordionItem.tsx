'use client';

import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/shared/utils';
import { useI18n } from '@/core/i18n';
import type { FaqItemConfig } from '../../config/support-faq.config';

interface FaqAccordionItemProps {
  /** FAQ configuration item containing IDs and translation keys. */
  faq: FaqItemConfig;
  /** True if the item is currently expanded. */
  isOpen: boolean;
  /** Callback to trigger when toggling the item. */
  onToggle: () => void;
}

/**
 * FaqAccordionItem renders a single expandable FAQ item conforming to WAI-ARIA Accordion
 * specifications, complete with smooth height transitions and color contrast corrections.
 */
export const FaqAccordionItem = React.memo(function FaqAccordionItem({
  faq,
  isOpen,
  onToggle,
}: FaqAccordionItemProps): React.JSX.Element {
  const { t } = useI18n();

  return (
    <div
      className={cn(
        'border bg-slate-50/50 rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-0.5',
        'border-slate-200 dark:border-slate-800/40 dark:bg-slate-900/60',
        'hover:shadow-sm hover:border-slate-200 dark:hover:border-slate-700'
      )}
      data-testid={`faq-item-${faq.id}`}
    >
      <button
        id={`faq-btn-${faq.id}`}
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={`faq-panel-${faq.id}`}
        className={cn(
          'flex w-full items-center justify-between p-4 text-left text-xs font-bold transition-colors cursor-pointer',
          'text-slate-900 dark:text-slate-100 hover:text-primary dark:hover:text-primary',
          'hover:bg-slate-100/50 dark:hover:bg-slate-900/80',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950'
        )}
        data-testid={`faq-button-${faq.id}`}
      >
        <span>{t(faq.questionKey)}</span>
        {isOpen ? (
          <ChevronUp className="text-primary h-4 w-4 shrink-0" aria-hidden="true" />
        ) : (
          <ChevronDown className="text-slate-500 h-4 w-4 shrink-0" aria-hidden="true" />
        )}
      </button>

      {/* Smooth height expand transition panel */}
      <div
        id={`faq-panel-${faq.id}`}
        role="region"
        aria-labelledby={`faq-btn-${faq.id}`}
        aria-hidden={!isOpen}
        style={{ maxHeight: isOpen ? '500px' : '0px', overflow: 'hidden' }}
        className="transition-all duration-300 ease-in-out"
        data-testid={`faq-panel-${faq.id}`}
      >
        <div className="bg-white dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800/80 p-4 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
          {t(faq.answerKey)}
        </div>
      </div>
    </div>
  );
});

FaqAccordionItem.displayName = 'FaqAccordionItem';

export default FaqAccordionItem;
