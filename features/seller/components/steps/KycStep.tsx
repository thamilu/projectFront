'use client';

import React, { Suspense, memo, useEffect, useRef, useMemo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { SellerIdentityType } from '@/domains/seller/contracts/seller.types';
import type { SellerOnboardingValues } from '@/domains/seller/contracts/seller.schema';
import { PageAnimations, FadeAnimations } from '@/shared/config';
import { useAnimationConfig } from '@/shared/hooks';
import { ONBOARDING_STEP_KEYS } from '@/domains/seller/config/onboarding-steps';
import { KycStepHeader } from './KycStepHeader';
import { KycFormSkeleton } from './KycFormSkeleton';
import { ErrorBoundary } from '@/shared/ui/feedback/error-boundary';
import { Button } from '@/shared/ui/atoms/button';
import { AlertTriangle } from 'lucide-react';
import { useI18n } from '@/core/i18n';
import { refreshPage } from '@/shared/utils';
import { logger } from '@/core/telemetry/logger';
import { trackEvent } from '@/core/providers/analytics-provider';


/**
 * Helper to retry dynamic imports when a chunk loading error occurs.
 * Enhances runtime resilience against network interruptions or deployments that invalidate old chunks.
 */
export function retryImport<T>(fn: () => Promise<T>, retriesLeft = 3, interval = 1000): Promise<T> {
  return new Promise((resolve, reject) => {
    fn()
      .then(resolve)
      .catch((error) => {
        if (retriesLeft === 0) {
          if (
            typeof window !== 'undefined' &&
            (error.name === 'ChunkLoadError' ||
              error.message?.includes('Loading chunk') ||
              error.message?.includes('Failed to fetch dynamically imported module'))
          ) {
            logger.warn('ChunkLoadError detected, forcing page reload to get fresh assets', { error });
            refreshPage();
            reject(error);
          } else {
            reject(error);
          }
          return;
        }
        setTimeout(() => {
          logger.warn(`Failed to load chunk, retrying... (${retriesLeft} retries left)`, { error });
          retryImport(fn, retriesLeft - 1, interval).then(resolve, reject);
        }, interval);
      });
  });
}

// Code-split: only load the form the user actually needs with chunk load retry and telemetry
const IndividualKycForm = dynamic(() =>
  retryImport(() =>
    import(
      /* webpackChunkName: "seller-onboarding-individual-kyc" */
      './IndividualKycForm'
    )
  )
    .then((m) => {
      trackEvent('kyc_form_loaded', { identityType: SellerIdentityType.INDIVIDUAL });
      return { default: m.IndividualKycForm };
    })
    .catch((err) => {
      trackEvent('kyc_form_error', { identityType: SellerIdentityType.INDIVIDUAL, error: err.message });
      throw err;
    }),
  { ssr: false }
);

const BusinessKycForm = dynamic(() =>
  retryImport(() =>
    import(
      /* webpackChunkName: "seller-onboarding-business-kyc" */
      './BusinessKycForm'
    )
  )
    .then((m) => {
      trackEvent('kyc_form_loaded', { identityType: SellerIdentityType.BUSINESS });
      return { default: m.BusinessKycForm };
    })
    .catch((err) => {
      trackEvent('kyc_form_error', { identityType: SellerIdentityType.BUSINESS, error: err.message });
      throw err;
    }),
  { ssr: false }
);

// `satisfies` enforces exhaustiveness — adding a new SellerIdentityType
// without updating this map will cause a compile-time error
const KYC_FORM_MAP = {
  [SellerIdentityType.INDIVIDUAL]: IndividualKycForm,
  [SellerIdentityType.BUSINESS]: BusinessKycForm,
} satisfies Record<SellerIdentityType, React.ComponentType<Record<string, never>>>;


/**
 * KycStep Component
 *
 * Orchestrator that manages structure, dynamic form selections, dynamic code splitting,
 * page/fade transition animations, error boundaries, and focus restoration across dynamic swaps.
 */
export const KycStep = memo(function KycStep(): React.ReactElement {
  const { control } = useFormContext<SellerOnboardingValues>();
  const { t } = useI18n();

  // useWatch is field-scoped — prevents re-renders from unrelated field changes
  const identityType = useWatch({ name: 'identityType', control });

  // Dynamically resolve form type component with diagnostic console logging fallbacks
  const KycForm = useMemo(() => {
    if (identityType === undefined) {
      return IndividualKycForm;
    }
    const form = KYC_FORM_MAP[identityType];
    if (!form) {
      logger.error(`[KycStep] Unknown identityType selection: ${identityType}`);
      return IndividualKycForm;
    }
    return form;
  }, [identityType]);

  const pageAnim = useAnimationConfig(PageAnimations);
  const fadeAnim = useAnimationConfig(FadeAnimations);

  // Focus management references to handle dynamic swapping for AT/keyboard users
  const formGroupRef = useRef<HTMLDivElement>(null);
  const previousIdentityType = useRef<SellerIdentityType | undefined>(undefined);

  useEffect(() => {
    const prev = previousIdentityType.current;
    previousIdentityType.current = identityType;

    // Only restore focus on subsequent changes (prevent initial mount auto-focus clash)
    if (prev !== undefined && identityType !== prev) {
      trackEvent('identity_type_changed', { from: prev, to: identityType });

      const duration = fadeAnim.transition?.duration ? fadeAnim.transition.duration * 1000 + 50 : 350;
      const timer = setTimeout(() => {
        formGroupRef.current?.focus();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [identityType, fadeAnim.transition]);

  // Screen Reader polite dynamic announcement message
  const liveAnnouncement = useMemo(() => {
    if (!identityType) return '';
    return identityType === SellerIdentityType.INDIVIDUAL
      ? t('sellerOnboarding.kyc.announcement.individual', {
          defaultValue: 'Individual verification form loaded',
        })
      : identityType === SellerIdentityType.BUSINESS
      ? t('sellerOnboarding.kyc.announcement.business', {
          defaultValue: 'Business verification form loaded',
        })
      : '';
  }, [identityType, t]);

  return (
    <motion.section
      key={ONBOARDING_STEP_KEYS.KYC}
      aria-labelledby="kyc-step-heading"
      aria-describedby="kyc-step-heading-desc"
      variants={pageAnim.variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageAnim.transition}
      className="space-y-8"
      data-testid="kyc-step"
    >
      {/* Announce form switch to screen readers with polite status region */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        data-testid="kyc-live-region"
      >
        {liveAnnouncement}
      </div>

      <KycStepHeader headingId="kyc-step-heading" />

      <div
        ref={formGroupRef}
        tabIndex={-1}
        className="bg-muted/30 border-border/50 rounded-2xl border p-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        role="group"
        aria-label={t('sellerOnboarding.kyc.formGroup.label', {
          defaultValue: 'Identity verification fields',
        })}
        data-testid="kyc-form-container"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={identityType}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={fadeAnim.variants}
            transition={fadeAnim.transition}
          >
            <ErrorBoundary
              name="KycFormErrorBoundary"
              onError={(error) => {
                trackEvent('kyc_form_error', {
                  error: error.message,
                  identityType: identityType ?? 'undefined',
                });
              }}
              fallback={(error, retry) => (
                <div
                  role="alert"
                  className="flex flex-col items-center gap-4 py-8 text-center"
                  data-testid="kyc-form-error"
                >
                  <AlertTriangle className="text-destructive h-8 w-8" aria-hidden="true" />
                  <p className="text-muted-foreground text-sm">
                    {t('sellerOnboarding.kyc.errors.loadFailure', {
                      defaultValue: 'Something went wrong loading this step.',
                    })}
                  </p>
                  
                  {/* Sanitized diagnostic context safely displayed to aid support without leaking credentials/stack */}
                  <div
                    className="text-muted-foreground/80 mt-1 font-mono text-xs"
                    data-testid="kyc-diagnostic-context"
                  >
                    <div>Error Code: KYC_LOAD_FAILURE</div>
                    {process.env.NODE_ENV === 'development' && (
                      <div className="mt-1 max-w-md break-words text-left bg-muted p-2 rounded border border-border">
                        {error.message}
                      </div>
                    )}
                  </div>

                  <Button variant="outline" onClick={retry}>
                    {t('common.retry', { defaultValue: 'Try Again' })}
                  </Button>
                </div>
              )}
            >
              <Suspense
                fallback={
                  <KycFormSkeleton
                    fieldCount={identityType === SellerIdentityType.BUSINESS ? 4 : 2}
                    columns={identityType === SellerIdentityType.BUSINESS ? 2 : 1}
                    showSectionHeaders={identityType === SellerIdentityType.BUSINESS}
                  />
                }
              >
                <KycForm />
              </Suspense>
            </ErrorBoundary>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.section>
  );
});

KycStep.displayName = 'KycStep';
