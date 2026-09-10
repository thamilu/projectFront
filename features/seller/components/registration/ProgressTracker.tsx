'use client';

import React from 'react';
import { Loader2, Save, AlertCircle } from 'lucide-react';
import { useI18n } from '@/core/i18n';

/**
 * Props for the ProgressTracker component.
 */
interface ProgressTrackerProps {
  /** Zero-indexed current active step number. Clamped internally to a valid positive integer. */
  currentStep: number;
  /** Total number of onboarding steps in the wizard flow. */
  totalSteps: number;
  /** Display title of the current step. Falls back to a localized placeholder if empty. */
  stepTitle: string;
  /** Progress percentage [0, 100]. Clamped internally. */
  percentComplete: number;
  /** Optional display string indicating the last saved time. */
  lastSaved?: string;
  /** Optional state showing if an auto-save process is currently executing. */
  isSaving?: boolean;
  /** Optional completion flag. Shows a sparkle emoji next to the title on completion. */
  isComplete?: boolean;
  /** Optional flag indicating an auto-save failure. Shows a visual error status. */
  saveError?: boolean;
}

/**
 * ProgressTracker displays current active step, save status indicator,
 * and progress percentage bar in the seller onboarding flow.
 */
export const ProgressTracker = React.memo(function ProgressTracker({
  currentStep,
  totalSteps,
  stepTitle,
  percentComplete,
  lastSaved,
  isSaving,
  isComplete = false,
  saveError = false,
}: ProgressTrackerProps): React.JSX.Element {
  const { t } = useI18n();

  // Bounds validation & data sanitization guards
  const safePct = Math.max(
    0,
    Math.min(100, Number.isFinite(percentComplete) ? Math.round(percentComplete) : 0)
  );

  const safeStep = Number.isFinite(currentStep) && currentStep >= 0
    ? Math.floor(currentStep) + 1
    : 1;

  const safeTitle = stepTitle?.trim() || t('sellerOnboarding.assistant.unknownStep');
  const trimmedSaved = lastSaved?.trim();

  return (
    <div className="space-y-3" data-testid="progress-tracker">
      <div className="flex items-center justify-between text-xs text-slate-300 font-bold tracking-wider uppercase">
        <span>{t('sellerOnboarding.assistant.currentStep')}</span>
        
        {saveError ? (
          <span
            className="text-xs text-red-400 font-medium flex items-center gap-1.5"
            data-testid="progress-tracker-error"
          >
            <AlertCircle className="h-3.5 w-3.5 text-red-400" aria-hidden="true" />
            {t('sellerOnboarding.assistant.saveErrorShort')}
          </span>
        ) : isSaving ? (
          <span
            className="text-xs text-slate-300 flex items-center gap-1.5 font-normal"
            data-testid="progress-tracker-saving"
          >
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" aria-hidden="true" />
            {t('sellerOnboarding.assistant.saving')}
          </span>
        ) : trimmedSaved ? (
          <span
            className="text-xs text-emerald-300 font-medium flex items-center gap-1.5"
            data-testid="progress-tracker-saved"
          >
            <Save className="h-3.5 w-3.5 text-emerald-300" aria-hidden="true" />
            {t('sellerOnboarding.assistant.savedAt', { time: trimmedSaved })}
          </span>
        ) : null}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <h3
          className="text-sm sm:text-base font-bold text-white leading-tight flex items-center gap-1.5"
          data-testid="progress-tracker-step-title"
        >
          {isComplete && (
            <span role="img" aria-label={t('sellerOnboarding.assistant.completeEmoji')}>
              ✨
            </span>
          )}
          {safeStep}. {safeTitle}
        </h3>
        <span
          className="text-xs text-slate-300 font-medium shrink-0"
          aria-hidden="true"
          data-testid="progress-tracker-step-counter"
        >
          {t('sellerOnboarding.assistant.stepCounter', { current: safeStep, total: totalSteps })}
        </span>
      </div>

      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-300">{t('sellerOnboarding.assistant.progress')}</span>
          <span
            className="text-blue-400 bg-blue-950/30 border border-blue-900/30 rounded-md px-1.5 py-0.5 text-xs font-bold"
            aria-hidden="true"
            data-testid="progress-tracker-percentage"
          >
            {safePct}%
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={safePct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={t('sellerOnboarding.assistant.progressLabel', {
            step: safeStep,
            total: totalSteps,
            percent: safePct,
          })}
          className="w-full bg-slate-900 rounded-full h-2 select-none"
          data-testid="progress-tracker-bar"
        >
          <div
            className="bg-primary h-2 rounded-full transition-[width] duration-300 ease-out"
            style={{ width: `${safePct}%` }}
            aria-hidden="true"
            data-testid="progress-tracker-fill"
          />
        </div>
      </div>
    </div>
  );
});

ProgressTracker.displayName = 'ProgressTracker';

export default ProgressTracker;
