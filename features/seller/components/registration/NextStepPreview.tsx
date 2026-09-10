'use client';

import React, { useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/core/i18n';
import { logger } from '@/core/telemetry/logger';

/**
 * Props for the NextStepPreview component in loading state.
 */
interface LoadingProps {
  /** Flag indicating that step information is currently loading. */
  isLoading: true;
  /** Hidden discriminant flag. */
  isFinalStep?: never;
  /** Hidden discriminant flag. */
  isError?: never;
  /** The total number of onboarding steps. */
  totalSteps?: number;
}

/**
 * Props for the NextStepPreview component in final step state.
 */
interface FinalStepProps {
  /** Flag indicating that step information is not loading or loading state is variable. */
  isLoading?: boolean;
  /** Flag indicating this is the final step of the onboarding flow. */
  isFinalStep: true;
  /** Hidden discriminant flag. */
  isError?: never;
  /** The total number of onboarding steps. */
  totalSteps?: number;
  /** Optional callback triggered when the completion button is clicked. */
  onComplete?: () => void;
  /** Custom label for the completion CTA button. Defaults to 'Submit'. */
  completeLabel?: string;
}

/**
 * Props for the NextStepPreview component when displaying a next step preview.
 */
interface NextStepProps {
  /** Flag indicating that step information is not loading or loading state is variable. */
  isLoading?: boolean;
  /** Flag indicating this is not the final step of the onboarding flow. */
  isFinalStep: false;
  /** Hidden discriminant flag. */
  isError?: never;
  /** The 1-indexed step number of the next required step. Must be a positive integer. */
  stepNumber: number;
  /** The total number of onboarding steps. Must be a positive integer. */
  totalSteps: number;
  /** The title of the next step. */
  nextStepTitle: string;
  /** Optional description for the next step. */
  nextStepDescription?: string;
  /** Optional callback triggered when the step action button is clicked. */
  onStepAction?: () => void;
  /** Custom label for the step preview CTA button. */
  stepActionLabel?: string;
}

/**
 * Props for the NextStepPreview component in error state.
 */
interface ErrorProps {
  /** Flag indicating that step information is not loading or loading state is variable. */
  isLoading?: boolean;
  /** Hidden discriminant flag. */
  isFinalStep?: never;
  /** Flag indicating this is an error state. */
  isError: true;
  /** The specific error message to render. */
  errorMessage?: string;
  /** The total number of onboarding steps. */
  totalSteps?: number;
  /** Optional callback triggered when the retry button is clicked. */
  onRetry?: () => void;
  /** Custom label for the retry button. */
  retryLabel?: string;
}

/**
 * Discriminated union of props for the NextStepPreview component.
 */
export type NextStepPreviewProps = LoadingProps | FinalStepProps | NextStepProps | ErrorProps;

/**
 * Shared animated container component for onboarding preview states.
 * Adheres to DRY principles, centralizing common layout and transition details.
 */
interface PreviewCardProps {
  children: React.ReactNode;
  className?: string;
  testId?: string;
  motionKey: string;
}

function PreviewCard({ children, className = '', testId, motionKey }: PreviewCardProps): React.JSX.Element {
  return (
    <motion.div
      key={motionKey}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
      className={`card p-4 min-h-[104px] flex flex-col justify-between ${className}`}
      data-testid={testId}
    >
      {children}
    </motion.div>
  );
}

/**
 * NextStepPreviewSkeleton component matches the dimensions and structure
 * of the loaded preview card to eliminate Cumulative Layout Shift (CLS).
 */
export function NextStepPreviewSkeleton({ totalSteps }: { totalSteps?: number }): React.JSX.Element {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-20 card-skeleton-line" />
          <div className="h-3 w-3 card-skeleton-line rounded-full" />
        </div>
        {totalSteps && <div className="h-3 w-16 card-skeleton-line" />}
      </div>
      <div className="h-4 w-3/4 card-skeleton-line" />
      <div className="h-3.5 w-full card-skeleton-line" />
    </div>
  );
}

/**
 * NextStepPreview Component
 * Renders a premium, dynamic preview of the next step in the onboarding flow,
 * a completion banner if the user is on the final step, or an explicit error state.
 * Uses a strict discriminated union for prop types, supports Framer Motion,
 * theme variables, localized ARIA labels, restricted announcements scope, and telemetry.
 */
export const NextStepPreview = React.memo(function NextStepPreview(
  props: NextStepPreviewProps
): React.JSX.Element {
  const { t } = useI18n();

  // Extract and validate parameters
  const isFinal = props.isFinalStep;
  const isErrorState = 'isError' in props && props.isError;
  const rawTitle = 'nextStepTitle' in props ? props.nextStepTitle : '';
  const trimmedTitle = rawTitle.trim();
  const rawStepNumber = 'stepNumber' in props ? props.stepNumber : undefined;
  const totalSteps = props.totalSteps;

  const isValidStepNumber =
    typeof rawStepNumber === 'number' && Number.isInteger(rawStepNumber) && rawStepNumber > 0;

  // Runtime validation error checks
  const hasRuntimeError =
    !props.isLoading &&
    props.isFinalStep === false &&
    (!trimmedTitle || !isValidStepNumber);

  const shouldRenderError = isErrorState || hasRuntimeError;

  // Track state changes via Telemetry
  useEffect(() => {
    if (props.isLoading) {
      logger.info('NextStepPreview State Changed: loading', { totalSteps });
    } else if (shouldRenderError) {
      const errorMsg =
        ('errorMessage' in props && props.errorMessage) ||
        (!trimmedTitle ? 'Missing nextStepTitle' : 'Invalid stepNumber');
      logger.error('NextStepPreview State Changed: error', {
        errorMessage: errorMsg,
        stepNumber: rawStepNumber,
        totalSteps,
      });
    } else if (isFinal) {
      logger.info('NextStepPreview State Changed: final', { totalSteps });
    } else {
      logger.info('NextStepPreview State Changed: nextStep', {
        stepNumber: rawStepNumber,
        totalSteps,
        nextStepTitle: trimmedTitle,
      });
    }
  }, [props.isLoading, shouldRenderError, isFinal, rawStepNumber, totalSteps, trimmedTitle, props]);

  // Determine localized ARIA labels and screen reader announcements
  const ariaLabel = props.isLoading
    ? t('sellerOnboarding.assistant.preview.loadingAria')
    : shouldRenderError
    ? t('sellerOnboarding.assistant.preview.errorBannerAria')
    : isFinal
    ? t('sellerOnboarding.assistant.preview.finalBannerAria')
    : t('sellerOnboarding.assistant.preview.nextCardAria');

  const announcementText = props.isLoading
    ? t('sellerOnboarding.assistant.preview.loadingAnnouncement')
    : shouldRenderError
    ? t('sellerOnboarding.assistant.preview.errorAnnouncement')
    : isFinal
    ? t('sellerOnboarding.assistant.preview.finalAnnouncement')
    : t('sellerOnboarding.assistant.preview.nextAnnouncement', {
        current: rawStepNumber as number,
        total: totalSteps as number,
        title: trimmedTitle,
      });

  // 1. Loading State Render
  if (props.isLoading) {
    return (
      <div role="region" aria-label={ariaLabel} data-testid="next-step-preview">
        <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
          {announcementText}
        </div>
        <AnimatePresence mode="wait">
          <PreviewCard
            motionKey="skeleton"
            className="card-hardened"
            testId="next-step-preview-skeleton"
          >
            <NextStepPreviewSkeleton totalSteps={props.totalSteps} />
          </PreviewCard>
        </AnimatePresence>
      </div>
    );
  }

  // 2. Normal / Error / Final State Render
  return (
    <div role="region" aria-label={ariaLabel} data-testid="next-step-preview">
      {/* Visual hidden live region to prevent over-announcement noise */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcementText}
      </div>

      <AnimatePresence mode="wait">
        {shouldRenderError ? (() => {
          const errorProps = props as ErrorProps;
          const errorMsg =
            errorProps.errorMessage || t('sellerOnboarding.assistant.preview.invalidStepDesc');

          const handleRetry = () => {
            logger.info('NextStepPreview Action Clicked: retry', {
              errorMessage: errorMsg,
              stepNumber: rawStepNumber,
            });
            errorProps.onRetry?.();
          };

          return (
            <PreviewCard
              motionKey="error"
              className="bg-destructive/10 border border-destructive/20 gap-3"
              testId="next-step-preview-error"
            >
              <div className="space-y-1">
                <p className="text-sm font-bold text-destructive" data-testid="next-step-preview-title">
                  {t('sellerOnboarding.assistant.preview.errorTitle')}
                </p>
                <p className="text-sm text-destructive/80 leading-normal" data-testid="next-step-preview-description">
                  {errorMsg}
                </p>
              </div>
              {errorProps.onRetry && errorProps.retryLabel && (
                <button
                  type="button"
                  onClick={handleRetry}
                  className="text-xs font-semibold text-white bg-destructive hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive rounded-lg px-3 py-2 transition-colors cursor-pointer min-h-[44px] flex items-center justify-center w-full"
                  data-testid="next-step-preview-action"
                >
                  {errorProps.retryLabel}
                </button>
              )}
            </PreviewCard>
          );
        })() : isFinal ? (() => {
          const finalProps = props as FinalStepProps;

          const handleComplete = () => {
            logger.info('NextStepPreview Action Clicked: complete', { totalSteps });
            finalProps.onComplete?.();
          };

          return (
            <PreviewCard
              motionKey="final"
              className="bg-success/10 border border-success/20 gap-3"
              testId="next-step-preview-final"
            >
              <div className="space-y-1">
                <p className="text-sm font-bold text-success" data-testid="next-step-preview-title">
                  {t('sellerOnboarding.assistant.finalStep')}
                </p>
                <p className="text-sm text-success/80 leading-normal" data-testid="next-step-preview-description">
                  {t('sellerOnboarding.assistant.timeline.notice')}
                </p>
              </div>
              {finalProps.onComplete && finalProps.completeLabel && (
                <button
                  type="button"
                  onClick={handleComplete}
                  className="text-xs font-semibold text-white bg-success hover:bg-success/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success rounded-lg px-3 py-2 transition-colors cursor-pointer min-h-[44px] flex items-center justify-center w-full"
                  data-testid="next-step-preview-action"
                >
                  {finalProps.completeLabel}
                </button>
              )}
            </PreviewCard>
          );
        })() : (() => {
          const nextProps = props as NextStepProps;

          const handleStepAction = () => {
            logger.info('NextStepPreview Action Clicked: stepAction', {
              stepNumber: rawStepNumber,
              totalSteps,
              nextStepTitle: trimmedTitle,
            });
            nextProps.onStepAction?.();
          };

          return (
            <PreviewCard
              motionKey={`card-${rawStepNumber}`}
              className="card-hardened bg-card/60 border border-border/60 gap-3"
              testId="next-step-preview-card"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold tracking-wider uppercase text-muted-foreground">
                  <div className="flex items-center gap-1" data-testid="next-step-preview-label">
                    <span>{t('sellerOnboarding.assistant.nextRequired')}</span>
                    <ArrowRight className="h-3 w-3 rtl:rotate-180" aria-hidden="true" />
                  </div>
                  {totalSteps && (
                    <span className="text-xs font-semibold lowercase text-muted-foreground" data-testid="next-step-preview-progress">
                      {t('sellerOnboarding.progress.stepText', {
                        current: rawStepNumber as number,
                        total: totalSteps as number,
                      })}
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-foreground line-clamp-2" data-testid="next-step-preview-title">
                  {rawStepNumber}. {trimmedTitle}
                </h4>
                {nextProps.nextStepDescription && (
                  <p className="text-sm text-muted-foreground leading-normal line-clamp-3" data-testid="next-step-preview-description">
                    {nextProps.nextStepDescription}
                  </p>
                )}
              </div>
              {nextProps.onStepAction && nextProps.stepActionLabel && (
                <button
                  type="button"
                  onClick={handleStepAction}
                  className="text-xs font-semibold text-primary-foreground bg-primary hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg px-3 py-2 transition-colors cursor-pointer min-h-[44px] flex items-center justify-center w-full"
                  data-testid="next-step-preview-action"
                >
                  {nextProps.stepActionLabel}
                </button>
              )}
            </PreviewCard>
          );
        })()}
      </AnimatePresence>
    </div>
  );
});

NextStepPreview.displayName = 'NextStepPreview';

export default NextStepPreview;
