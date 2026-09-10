'use client';

import React, { useEffect, useMemo } from 'react';
import { withErrorBoundary } from 'react-error-boundary';
import { captureException } from '@sentry/nextjs';
import { useI18n } from '@/core/i18n';
import { STEPS } from '@/features/seller/constants/seller-form-steps';
import {
  MarketCode,
  ApprovalStageKey,
  APPROVAL_STAGE_KEYS,
} from '@/features/seller/constants/onboarding-assistant-config';
import { useOnboardingProgress } from '@/features/seller/hooks/useOnboardingProgress';
import { ProgressTracker } from './ProgressTracker';
import { MetaInfoGrid } from './MetaInfoGrid';
import { DocumentChecklist } from './DocumentChecklist';
import { NextStepPreview } from './NextStepPreview';
import { ApprovalTimeline } from './ApprovalTimeline';
import { SupportSection } from './SupportSection';

// Validate STEPS configuration at module load time to eliminate concurrent render throws (Issue 13)
if (!STEPS || STEPS.length === 0) {
  throw new Error(
    process.env.NODE_ENV !== 'production'
      ? '[OnboardingAssistant] STEPS configuration array is empty or undefined. Check seller-form-steps config.'
      : 'Configuration error'
  );
}

/**
 * Props for the OnboardingAssistant sidebar component.
 * Renders step progress, document requirements, timeline, and support options.
 */
export interface OnboardingAssistantProps {
  /** Zero-indexed current step. Must be in range [0, STEPS.length - 1]. */
  currentStep: number;
  /** Display-ready string showing when progress was last saved. */
  lastSaved?: string;
  /** When true, displays saving indicator in ProgressTracker. */
  isSaving?: boolean;
  /** When true, displays save failure alert. */
  saveError?: boolean;
  /** ISO 3166-1 alpha-2 market code. Determines document requirements. @default 'IN' */
  market?: MarketCode;
  /** Called when user clicks the support CTA. If undefined, falls back to mailto. */
  onSupportClick?: () => void;
  /** The current stage key for the approval timeline. @default 'register' */
  currentStage?: ApprovalStageKey;
  /** Optional loading state for the onboarding data preview. */
  isLoading?: boolean;
  /** Optional callback triggered when user clicks the next step CTA in the preview. */
  onNextStepClick?: () => void;
  /** Optional custom label for the next step CTA. */
  nextStepActionLabel?: string;
  /** Optional callback triggered when clicking the completion CTA on the final step. */
  onCompleteClick?: () => void;
  /** Optional custom label for the completion CTA. */
  completeLabel?: string;
}

/**
 * Fallback UI component shown when the OnboardingAssistant encounters an uncaught render error.
 * Integrates translation hook to prevent non-localized strings. (Issue 4, Issue 14)
 */
function OnboardingAssistantErrorFallback(): React.JSX.Element {
  const { t } = useI18n();
  return (
    <div
      role="alert"
      data-testid="onboarding-assistant-error"
      className="rounded-2xl border border-red-900/50 bg-red-950/20 px-3.5 py-3 text-xs font-semibold text-red-400"
    >
      ⚠ {t('sellerOnboarding.assistant.errorFallback')}
    </div>
  );
}

/**
 * OnboardingAssistant functional component (Base).
 * Orchestrates rendering progress tracking, step estimates, legal documents checklist,
 * timeline stages, and support section in the seller onboarding flow.
 */
function OnboardingAssistantBase({
  currentStep,
  lastSaved,
  isSaving = false,
  saveError = false,
  market = 'IN',
  onSupportClick,
  currentStage = 'register',
  isLoading = false,
  onNextStepClick,
  nextStepActionLabel,
  onCompleteClick,
  completeLabel,
}: OnboardingAssistantProps): React.JSX.Element {
  const { t } = useI18n();

  // Runtime boundary verification & warning check relocated to side-effect (Issue 6)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      if (
        typeof currentStep !== 'number' ||
        !Number.isInteger(currentStep) ||
        currentStep < 0 ||
        currentStep >= STEPS.length
      ) {
        console.warn(
          `[OnboardingAssistant] Invalid currentStep: ${currentStep}. ` +
            `Expected integer in range [0, ${STEPS.length - 1}].`
        );
      }
    }
  }, [currentStep]);

  // Prop boundary guards to prevent injection bugs (Issue 11)
  const safeMarket: MarketCode = market === 'US' || market === 'IN' ? market : 'IN';
  const safeStage: ApprovalStageKey = (APPROVAL_STAGE_KEYS as readonly string[]).includes(currentStage)
    ? currentStage
    : 'register';

  // safeStep computation
  const safeStep = Number.isFinite(currentStep)
    ? Math.max(0, Math.min(Math.floor(currentStep), STEPS.length - 1))
    : 0;

  const currentStepData = STEPS[safeStep];
  const nextStepData = STEPS[safeStep + 1];

  // Delegate expensiveDerivedState calculations to custom hook useOnboardingProgress (Issue 1, Issue 9)
  const { percentComplete, timeLeft } = useOnboardingProgress(safeStep);

  const isLastStep = safeStep === STEPS.length - 1;

  // Deriving Step Title with null-guards (Issue 3)
  const stepTitle = currentStepData?.title?.trim() || t('sellerOnboarding.assistant.unknownStep');

  // Compute props for NextStepPreview beforehand (Issue 5)
  const nextStepPreviewProps = useMemo(() => {
    const nextStepTitle = nextStepData?.title?.trim();
    const isFinalStep = isLastStep || !nextStepTitle;

    if (isFinalStep) {
      return {
        isLoading,
        isFinalStep: true as const,
        totalSteps: STEPS.length,
        onComplete: onCompleteClick,
        completeLabel,
      };
    }

    return {
      isLoading,
      isFinalStep: false as const,
      stepNumber: safeStep + 2,
      totalSteps: STEPS.length,
      nextStepTitle: nextStepTitle,
      nextStepDescription: nextStepData.description,
      onStepAction: onNextStepClick,
      stepActionLabel: nextStepActionLabel,
    };
  }, [
    isLoading,
    isLastStep,
    nextStepData?.title,
    nextStepData?.description,
    onCompleteClick,
    completeLabel,
    safeStep,
    onNextStepClick,
    nextStepActionLabel,
  ]);

  return (
    <aside
      aria-label={t('sellerOnboarding.assistant.ariaLabel')}
      data-testid="onboarding-assistant"
      className="bg-slate-950 border border-slate-800 text-slate-100 rounded-2xl p-4 md:p-6 shadow-xl space-y-6 max-w-full"
    >
      {/* Skip Navigation Link for accessibility compliance (Issue 12) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-ring focus:ring-2 focus:ring-offset-2"
      >
        {t('sellerOnboarding.assistant.skipToForm')}
      </a>

      {/* Global screen reader announcements status region with static check guards (Issue 3) */}
      <div
        role="status"
        aria-atomic="true"
        className="sr-only"
        data-testid="onboarding-assistant-live-region"
      >
        {`Step ${safeStep + 1} of ${STEPS.length}: ${stepTitle}. ${percentComplete}% complete. Approximately ${timeLeft} minutes remaining.`}
      </div>

      {/* Structured live-region for autosave status messages (Issue 6) */}
      <div
        role="status"
        aria-atomic="true"
        className="sr-only"
        data-testid="onboarding-assistant-save-status"
      >
        {saveError
          ? t('sellerOnboarding.assistant.saveError')
          : isSaving
          ? t('sellerOnboarding.assistant.saving')
          : lastSaved
          ? t('sellerOnboarding.assistant.savedAt', { time: lastSaved })
          : ''}
      </div>

      {/* Visual save error display (Issue 6, Issue 10) */}
      {saveError && (
        <div
          role="presentation"
          aria-hidden="true"
          className="rounded-xl border border-red-900/50 bg-red-950/20 px-3.5 py-3 text-xs font-semibold text-red-400"
          data-testid="onboarding-assistant-save-error"
        >
          ⚠ {t('sellerOnboarding.assistant.saveError')}
        </div>
      )}

      <ProgressTracker
        currentStep={safeStep}
        totalSteps={STEPS.length}
        stepTitle={stepTitle}
        percentComplete={percentComplete}
        lastSaved={lastSaved}
        isSaving={isSaving}
        isComplete={isLastStep}
        saveError={saveError}
      />

      <hr className="border-slate-800" aria-hidden="true" />

      <MetaInfoGrid timeLeft={timeLeft} />

      {/* Conditionally show required document checklist driven by step configuration flag */}
      {currentStepData?.requiresDocumentChecklist && (
        <DocumentChecklist market={safeMarket} />
      )}

      <NextStepPreview {...nextStepPreviewProps} />

      <hr className="border-slate-800" aria-hidden="true" />

      <ApprovalTimeline currentStage={safeStage} />

      <hr className="border-slate-800" aria-hidden="true" />

      <SupportSection onSupportClick={onSupportClick} />
    </aside>
  );
}

// Wrap with error boundary and React.memo (Issue 2, Issue 7)
const OnboardingAssistant = React.memo(
  withErrorBoundary(OnboardingAssistantBase, {
    FallbackComponent: OnboardingAssistantErrorFallback,
    onError(error, info) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[OnboardingAssistant] Render error caught by ErrorBoundary:', error, info);
      } else {
        // Observability integration for production monitoring (Issue 2)
        captureException(error, {
          extra: { componentStack: info?.componentStack },
          tags: { component: 'OnboardingAssistant' },
        });
      }
    },
  })
);

OnboardingAssistant.displayName = 'OnboardingAssistant';

export { OnboardingAssistant, OnboardingAssistantErrorFallback };
export default OnboardingAssistant;
