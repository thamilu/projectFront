'use client';

/**
 * TermsStep
 *
 * Step 6 of seller onboarding — final merchant terms and agreement acceptance gate.
 *
 * Features:
 * - Localized using useI18n
 * - Fully type safe Form bindings with Radix UI CheckedState guard
 * - Keyboard navigable and Screen reader accessible (Polite live status regions, correct ARIA associations)
 * - Observability: view and action triggers mapped with error protection
 * - Memoized for render efficiency
 * - Semantic UI colors matching project tokens
 */

import { memo, useEffect, useCallback } from 'react';
import type { ReactElement } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { motion, useReducedMotion } from 'framer-motion';
import { CheckCircle2, ShieldAlert, FileText } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Checkbox } from '@/shared/ui/atoms/checkbox';
import { Label } from '@/shared/ui/atoms/label';
import { useI18n } from '@/core/i18n';
import { trackEvent } from '@/core/providers/analytics-provider';
import { cn } from '@/shared/utils';
import type { SellerOnboardingValues } from '@/domains/seller/contracts/seller.schema';
import { StepLayout } from '@/shared/ui/organisms/StepLayout';
import { logger } from '@/core/telemetry/logger';

// ─── Constants & Configurations ──────────────────────────────────────────────

const TERMS_VERSION = process.env.NEXT_PUBLIC_SELLER_TERMS_VERSION ?? '1.0';
const LEGAL_TERMS_URL = process.env.NEXT_PUBLIC_LEGAL_TERMS_URL ?? '/legal/seller-terms';

// ─── Sub-Components ──────────────────────────────────────────────────────────

interface InfoItemProps {
  icon: LucideIcon;
  title: string;
  description: string;
  variant?: 'default' | 'warning';
}

function InfoItem({ icon: IconComponent, title, description, variant = 'default' }: InfoItemProps): ReactElement {
  return (
    <div className="flex items-start gap-4">
      <div
        className={cn(
          'rounded-lg p-2',
          variant === 'warning' ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary'
        )}
      >
        <IconComponent className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <p className={cn('text-sm font-semibold', variant === 'warning' && 'text-warning')}>
          {title}
        </p>
        <p className="text-muted-foreground text-xs leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export const TermsStep = memo(function TermsStep(): ReactElement {
  const { t } = useI18n();
  const {
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useFormContext<SellerOnboardingValues>();

  const accepted = useWatch({
    control,
    name: 'acceptedTerms',
    defaultValue: false,
  }) ?? false;

  const prefersReducedMotion = useReducedMotion();

  // ── 1. Telemetry Instrumentation ───────────────────────────────────────────
  useEffect(() => {
    try {
      trackEvent('seller_onboarding_step_viewed', {
        step: 'terms_agreement',
        step_number: 6,
        terms_version: TERMS_VERSION,
      });
    } catch (err) {
      logger.warn('[TermsStep] Failed to track step view', { error: err });
    }
  }, []);

  const handleCheckboxChange = useCallback((checkedState: boolean | 'indeterminate') => {
    if (typeof checkedState === 'boolean') {
      setValue('acceptedTerms', checkedState, {
        shouldValidate: true,
        shouldDirty: true,
      });
      try {
        trackEvent(checkedState ? 'seller_terms_accepted' : 'seller_terms_unaccepted', {
          terms_version: TERMS_VERSION,
        });
      } catch (err) {
        logger.warn('[TermsStep] Failed to track acceptance change', { error: err });
      }
    }
  }, [setValue]);

  const errorId = 'acceptedTerms-error';

  return (
    <StepLayout
      title={t('sellerOnboarding.terms.title')}
      description={t('sellerOnboarding.terms.description')}
      variant="plain"
      data-testid="terms-step"
    >
      <div className="space-y-8">
        {/* Semantic notice cards block */}
        <div
          role="region"
          aria-label={t('sellerOnboarding.terms.merchantNoticesRegionLabel', { defaultValue: 'Merchant Notices' })}
          className="bg-muted/30 space-y-4 rounded-xl border p-6 shadow-sm backdrop-blur-sm"
        >
          <InfoItem
            icon={FileText}
            title={t('sellerOnboarding.terms.agreementTitle')}
            description={t('sellerOnboarding.terms.agreementDescription')}
          />

          <InfoItem
            icon={ShieldAlert}
            title={t('sellerOnboarding.terms.importantNoteTitle')}
            description={t('sellerOnboarding.terms.importantNoteDescription')}
            variant="warning"
          />
        </div>

        {/* Legal Agreement Checkbox Block */}
        <div className="group bg-background/40 flex items-start space-x-3 rounded-xl border p-5 transition-all">
          <Checkbox
            id="acceptedTerms"
            checked={accepted}
            disabled={isSubmitting}
            aria-required="true"
            aria-invalid={!!errors.acceptedTerms}
            aria-describedby={errors.acceptedTerms ? errorId : undefined}
            onCheckedChange={handleCheckboxChange}
            data-testid="accepted-terms-checkbox"
            className="mt-0.5"
          />
          <div className="grid gap-1.5 leading-none">
            <Label
              htmlFor="acceptedTerms"
              className="group-hover:text-primary cursor-pointer text-sm leading-tight font-bold transition-colors"
            >
              {t('sellerOnboarding.terms.checkboxLabelPrefix')}{' '}
              <a
                href={LEGAL_TERMS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-0.5"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent checking checkbox when clicking the link
                  try {
                    trackEvent('seller_terms_link_clicked', {
                      terms_version: TERMS_VERSION,
                    });
                  } catch (err) {
                    logger.warn('[TermsStep] Failed to track terms link click', { error: err });
                  }
                }}
              >
                {t('sellerOnboarding.terms.checkboxLabelLinkText')}
                <span className="sr-only">
                  {' '}
                  {t('common.opensInNewTab', { defaultValue: '(opens in a new tab)' })}
                </span>
              </a>
            </Label>
            <p className="text-muted-foreground text-xs leading-normal">
              {t('sellerOnboarding.terms.checkboxDescription')}
            </p>
            <div className="min-h-[1.25rem] mt-1">
              {errors.acceptedTerms && (
                <p
                  id={errorId}
                  role="alert"
                  data-testid="accepted-terms-error"
                  className="text-destructive text-xs font-semibold tracking-wide uppercase animate-in slide-in-from-top-1"
                >
                  {errors.acceptedTerms.message === 'TERMS_NOT_ACCEPTED' || errors.acceptedTerms.message === 'You must accept the terms'
                    ? t('sellerOnboarding.terms.validationError', { defaultValue: 'You must accept the terms and conditions to proceed.' })
                    : errors.acceptedTerms.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Acceptance Confirmation Success Banner */}
        {accepted && (
          <motion.div
            initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
            role="status"
            aria-live="polite"
            aria-atomic="true"
            data-testid="accepted-terms-success"
            className="flex items-center gap-3 rounded-xl border border-success/20 bg-success/10 p-4 text-success"
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            <span className="text-xs font-bold tracking-wide uppercase">
              {t('sellerOnboarding.terms.readyToSubmit')}
            </span>
          </motion.div>
        )}
      </div>
    </StepLayout>
  );
});

TermsStep.displayName = 'TermsStep';
