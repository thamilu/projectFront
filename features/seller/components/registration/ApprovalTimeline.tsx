'use client';

import React, { useMemo } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { useI18n } from '@/core/i18n';
import { cn } from '@/shared/utils';
import type { ApprovalStageKey } from '@/features/seller/constants/onboarding-assistant-config';

/**
 * Props for the ApprovalTimeline component.
 */
export interface ApprovalTimelineProps {
  /** The current approval stage of the seller onboarding process. @default 'register' */
  currentStage?: ApprovalStageKey;
}

/**
 * Stage order lookup mapping to compare visual progress states.
 */
const STAGE_ORDER: Record<ApprovalStageKey, number> = {
  register: 0,
  verify: 1,
  launch: 2,
};

/**
 * ApprovalTimeline Component.
 * Renders the approval stages (Register, Verify, Launch) dynamically based on progress.
 * Adheres to WCAG AA color contrasts and supports screen reader list count accuracy.
 */
export const ApprovalTimeline = React.memo(function ApprovalTimeline({
  currentStage = 'register',
}: ApprovalTimelineProps): React.JSX.Element {
  const { t } = useI18n();

  // Memoize stages list with fallback default strings in case keys are missing
  const stages = useMemo(() => [
    { key: 'register' as const, label: t('sellerOnboarding.assistant.timeline.register', { defaultValue: 'Register' }) },
    { key: 'verify' as const, label: t('sellerOnboarding.assistant.timeline.verify', { defaultValue: 'Verify' }) },
    { key: 'launch' as const, label: t('sellerOnboarding.assistant.timeline.launch', { defaultValue: 'Launch' }) },
  ], [t]);

  const currentStageIndex = STAGE_ORDER[currentStage] ?? 0;

  return (
    <div className="space-y-3">
      {/* Dynamic Slate-300 heading for contrast compliance */}
      <h4 className="text-xs text-slate-300 font-bold tracking-wider uppercase">
        {t('sellerOnboarding.assistant.approvalTimeline', { defaultValue: 'Approval Timeline' })}
      </h4>

      {/* Semantic ordered list for approval stages with translated aria-label */}
      <ol
        className="relative flex items-center justify-between px-1"
        aria-label={t('sellerOnboarding.assistant.timeline.ariaLabel', { defaultValue: 'Approval stages' })}
      >
        {stages.map((stage, idx) => {
          const stageIndex = STAGE_ORDER[stage.key];
          const isCurrent = stage.key === currentStage;
          const isCompleted = stageIndex < currentStageIndex;

          return (
            <React.Fragment key={stage.key}>
              <li
                className="flex flex-col items-center"
                aria-current={isCurrent ? 'step' : undefined}
              >
                {/* 24x24px (h-6 w-6) circle for WCAG 2.5.8 touch target compliance.
                    Number contents hidden from screen readers since order is announced by the list element. */}
                <div
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ease-in-out',
                    isCurrent
                      ? 'bg-primary text-white font-bold ring-2 ring-primary/40 shadow-lg shadow-primary/20 scale-105'
                      : isCompleted
                      ? 'border border-emerald-500/50 bg-emerald-950/20 text-emerald-400'
                      : 'border border-slate-800 bg-slate-900 text-slate-300'
                  )}
                  aria-hidden="true"
                >
                  {isCompleted ? (
                    <Check className="h-3.5 w-3.5 stroke-[3px]" />
                  ) : (
                    idx + 1
                  )}
                </div>
                {/* Stage labels text overflow wrap protection */}
                <span className="mt-1 text-xs font-semibold text-slate-200 max-w-[5rem] text-center leading-tight break-words">
                  {stage.label}
                </span>
              </li>
              {/* Separators with role="presentation" to prevent screen reader list count pollution */}
              {idx < stages.length - 1 && (
                <li role="presentation" className="flex items-center justify-center" aria-hidden="true">
                  <ArrowRight className="h-3 w-3 text-slate-700 mx-2 rtl:rotate-180" />
                </li>
              )}
            </React.Fragment>
          );
        })}
      </ol>
      {/* notice text Slate-300 contrast compliance */}
      <p className="text-xs text-slate-300 text-center leading-normal">
        {t('sellerOnboarding.assistant.timeline.notice', { defaultValue: 'Verification typically completes within 24 hours.' })}
      </p>
    </div>
  );
});

export default ApprovalTimeline;
