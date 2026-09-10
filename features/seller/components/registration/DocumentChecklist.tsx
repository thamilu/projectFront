'use client';

import React, { useMemo } from 'react';
import { useI18n } from '@/core/i18n';
import { MarketCode, MARKET_DOCUMENTS, DocumentRequirement } from '@/features/seller/constants/onboarding-assistant-config';

/**
 * Props for the DocumentChecklist component.
 */
export interface DocumentChecklistProps {
  /** ISO 3166-1 alpha-2 market code determining document requirements. */
  market: MarketCode;
}

/**
 * Displays the list of required and optional documents for seller onboarding,
 * based on the seller's market. Falls back to IN market if market is unconfigured.
 *
 * Note: market prop is a string primitive (MarketCode), so default shallow equality
 * is correct and sufficient. No custom comparator is needed.
 * If callback props are added in future, provide custom equality function
 * or ensure parent uses useCallback for all function props.
 */
export const DocumentChecklist = React.memo(function DocumentChecklist({
  market,
}: DocumentChecklistProps): React.JSX.Element {
  const { t } = useI18n();

  // Guard for unconfigured markets in development environment
  if (process.env.NODE_ENV === 'development' && !MARKET_DOCUMENTS[market]) {
    console.warn(
      `[DocumentChecklist] Market "${market}" has no configured documents. ` +
      `Falling back to IN. Add "${market}" to MARKET_DOCUMENTS in onboarding-assistant-config.`
    );
  }

  // Memoize config lookup using nullish coalescing to prevent returning fallback on empty arrays
  const docs = useMemo<readonly DocumentRequirement[]>(
    () => MARKET_DOCUMENTS[market] ?? MARKET_DOCUMENTS.IN,
    [market]
  );

  // Memoize resolved translations to prevent repetitive t() lookups on parent re-renders
  const resolvedDocs = useMemo(() => {
    return docs.map((doc) => ({
      id: doc.id,
      required: doc.required,
      label: t(doc.labelKey, { defaultValue: doc.labelKey }),
      hint: doc.hintKey ? t(doc.hintKey, { defaultValue: '' }) : undefined,
    }));
  }, [docs, t]);

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3.5 space-y-2">
      {/* Upgraded heading contrast text-slate-300 for WCAG AA compliance */}
      <h4 className="text-xs text-slate-300 font-bold tracking-wider uppercase">
        {t('sellerOnboarding.assistant.requiredDocuments', { defaultValue: 'Required Documents' })}
      </h4>

      {resolvedDocs.length === 0 ? (
        <p className="text-xs text-slate-300 italic">
          {t('sellerOnboarding.assistant.requiredDocuments.requiredDocumentsNone', {
            defaultValue: 'No documents are required for this market.',
          })}
        </p>
      ) : (
        <ul
          aria-label={t('sellerOnboarding.assistant.requiredDocuments.requiredDocumentsListLabel', {
            defaultValue: 'Required documents checklist',
          })}
          className="text-xs text-slate-300 space-y-1 list-disc list-outside pl-4 rtl:pr-4 rtl:pl-0"
        >
          {resolvedDocs.map((doc) => (
            <li key={doc.id}>
              <span>{doc.label}</span>
              {doc.hint && (
                <span aria-hidden="true">
                  {` `}
                  {t('common.hintWrapper', {
                    hint: doc.hint,
                    defaultValue: `(${doc.hint})`,
                  })}
                </span>
              )}
              {doc.required && (
                <>
                  <span className="text-red-300 ml-0.5 font-bold" aria-hidden="true">*</span>
                  <span className="sr-only"> ({t('common.required', { defaultValue: 'Required' })})</span>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Checklist legend indicator for required fields */}
      {resolvedDocs.some((doc) => doc.required) && (
        <p className="text-[11px] text-slate-300 leading-normal pt-1">
          <span className="text-red-300 font-bold" aria-hidden="true">* </span>
          {t('sellerOnboarding.assistant.requiredDocuments.requiredDocumentsLegend', {
            defaultValue: '* Indicates required verification documents.',
          })}
        </p>
      )}
    </div>
  );
});

export default DocumentChecklist;
