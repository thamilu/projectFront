'use client';

/**
 * SellerRoleUpgradeForm
 *
 * Multi-step form orchestrator for seller onboarding.
 * Delegates step rendering, navigation, and status display
 * to focused child components.
 *
 * State Machine:
 *   IDLE    → Form is active, user is filling steps
 *   PENDING → Submission received, awaiting admin approval
 *   SUCCESS → Seller role granted
 *   ERROR   → Submission or sync failed
 */

import { memo, useState, useRef, useEffect, useCallback } from 'react';
import { FormProvider } from 'react-hook-form';
import { ErrorBoundary } from 'react-error-boundary';
import { ShieldAlert, HelpCircle, Loader2, Save } from 'lucide-react';

import { cn } from '@/shared/utils';
import { useI18n } from '@/core/i18n';
import { PremiumCard } from '@/shared/ui/molecules/PremiumCard';
import { StepErrorFallback } from '@/shared/ui/molecules/StepErrorFallback';
import { logger } from '@/core/telemetry/logger';
import { trackEvent } from '@/core/providers/analytics-provider';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { APP_ROUTES } from '@/shared/routes';
import { STEPS } from '../constants/seller-form-steps';
import { useSellerForm, DEFAULT_SELLER_FORM_VALUES } from '../hooks/useSellerForm';
import { PREFILL_FIELDS } from '../hooks/useSellerPrefill';
import { SellerFormUIProvider } from '../contexts/SellerFormUIContext';
import { toast } from 'sonner';
import { OnboardingChecklist } from './registration/OnboardingChecklist';
import { SupportFaq } from './registration/SupportFaq';
import { useOnboardingStore } from '../store/onboarding-store';
import { sanitizeOnboardingDraftForStorage } from '../utils/storage';

import { PersonalInfoStep } from './steps/PersonalInfoStep';
import { PermanentAddressStep } from './steps/PermanentAddressStep';
import { IdentityStep } from './steps/IdentityStep';
import { KycStep } from './steps/KycStep';
import { StoreStep } from './steps/StoreStep';
import { TermsStep } from './steps/TermsStep';

import { SellerFormStepper } from './SellerFormStepper';
import { SellerFormNavigation } from './SellerFormNavigation';
import { SellerPendingStatus } from './status/SellerPendingStatus';
import { SellerSuccessStatus } from './status/SellerSuccessStatus';
import { SellerErrorStatus } from './status/SellerErrorStatus';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/ui/atoms/dialog';
import { Button } from '@/shared/ui/atoms/button';
import {
  saveOnboardingDraft,
  loadOnboardingDraft,
  clearOnboardingDraft,
} from '../utils/onboarding-draft-storage';
import { formatRelativeTime } from '@/shared/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SellerOnboardingStatus = 'IDLE' | 'PENDING' | 'SUCCESS' | 'ERROR';

export interface SellerRoleUpgradeFormProps {
  /** Pre-computed status from server-side session check */
  initialStatus?: SellerOnboardingStatus;
  /** Callback fired on successful seller registration */
  onSuccess?: () => void;
}

// ─── Step Registry ────────────────────────────────────────────────────────────

const STEP_COMPONENTS = [
  PersonalInfoStep,
  PermanentAddressStep,
  IdentityStep,
  KycStep,
  StoreStep,
  TermsStep,
] as const;

// Runtime guard for development
if (process.env.NODE_ENV === 'development') {
  if (STEP_COMPONENTS.length !== STEPS.length) {
    throw new Error(
      `[SellerRoleUpgradeForm] STEP_COMPONENTS (${STEP_COMPONENTS.length}) ` +
        `and STEPS (${STEPS.length}) must have the same length. ` +
        `Update seller-form-steps.ts or the STEP_COMPONENTS registry.`
    );
  }
}

// ─── FormSteps ────────────────────────────────────────────────────────────────

interface FormStepsProps {
  currentStep: number;
  activePanelRef: React.RefObject<HTMLDivElement | null>;
}

const FormSteps = memo(function FormSteps({ currentStep, activePanelRef }: FormStepsProps) {
  return (
    <>
      {STEP_COMPONENTS.map((StepComponent, index) => {
        const step = STEPS[index];
        const isActive = currentStep === index;

        return (
          <div
            key={step.id}
            ref={isActive ? activePanelRef : undefined}
            role="tabpanel"
            id={`step-panel-${step.id}`}
            aria-labelledby={`step-tab-${step.id}`}
            aria-hidden={!isActive}
            inert={!isActive ? true : undefined}
            tabIndex={-1}
            className={cn(
              'transition-opacity duration-200 focus:outline-hidden',
              !isActive && 'sr-only'
            )}
          >
            <ErrorBoundary
              FallbackComponent={StepErrorFallback}
              onError={(error) =>
                logger.error(`[SellerOnboarding] Step ${step.title} crashed:`, {
                  error: error instanceof Error ? error.message : String(error),
                  stack: error instanceof Error ? error.stack : undefined,
                })
              }
            >
              <StepComponent />
            </ErrorBoundary>
          </div>
        );
      })}
    </>
  );
});

// ─── Main Component ───────────────────────────────────────────────────────────

export function SellerRoleUpgradeForm({ initialStatus, onSuccess }: SellerRoleUpgradeFormProps) {
  const { t } = useI18n();
  const {
    methods,
    status,
    currentStep,
    setCurrentStep,
    isSubmitting,
    isSyncing,
    next,
    prev,
    handleForceSync,
    handleRetry,
    user,
    isSeller,
    errorMessage,
    referenceId,
  } = useSellerForm({ initialStatus, onSuccess });

  const router = useRouter();

  // ── States ──────────────────────────────────────────────────────────────────
  const [hasNavigated, setHasNavigated] = useState(false);
  const [lastSaved, setLastSaved] = useState<string>('');

  const { setTheme } = useTheme();

  // Ref to track if completed to avoid recording abandonment on success
  const isCompletedRef = useRef(false);

  // Set isCompletedRef on status change to SUCCESS or PENDING and track completed event
  useEffect(() => {
    if (status === 'SUCCESS' || status === 'PENDING') {
      isCompletedRef.current = true;
      trackEvent('seller_onboarding_completed', {
        status,
        timestamp: new Date().toISOString(),
      });
    }
  }, [status]);

  // Track started telemetry
  useEffect(() => {
    if (status === 'IDLE') {
      trackEvent('seller_onboarding_started', {
        timestamp: new Date().toISOString(),
      });
    }
  }, [status]);

  // Track abandonment telemetry
  useEffect(() => {
    return () => {
      // If we unmount and it wasn't marked completed, record abandonment
      if (!isCompletedRef.current) {
        trackEvent('seller_onboarding_abandoned', {
          lastStep: currentStep + 1,
          timestamp: new Date().toISOString(),
        });
      }
    };
  }, [currentStep]);

  // ── Theme Initialization ───────────────────────────────────────────────────
  useEffect(() => {
    try {
      const persistedTheme = localStorage.getItem('eshop-theme');
      if (!persistedTheme) {
        setTheme('light');
      }
    } catch (e) {
      logger.warn('[SellerRoleUpgradeForm] Failed to check persisted theme', { error: e });
    }
  }, [setTheme]);
  const [isSaving, setIsSaving] = useState(false);
  // Mobile OTP verification has no real backend endpoint yet (see the OTP
  // dialog below) — this can never become true, which is the honest state
  // until that backend exists.
  const [mobileVerified] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);

  const [showDraftModal, setShowDraftModal] = useState(false);
  const [draftTimestamp, setDraftTimestamp] = useState('');
  const [draftStep, setDraftStep] = useState<number | null>(null);
  const [draftData, setDraftData] = useState<any>(null);

  // Sync to Zustand Onboarding Store
  const setStoreStep = useOnboardingStore((s) => s.setCurrentStep);
  const setStoreTotal = useOnboardingStore((s) => s.setTotalSteps);
  const setStoreTitle = useOnboardingStore((s) => s.setStepTitle);
  const setIsFormDirty = useOnboardingStore((s) => s.setIsFormDirty);
  const setStoreSaving = useOnboardingStore((s) => s.setIsSaving);
  const setSaveDraftCallback = useOnboardingStore((s) => s.setSaveDraftCallback);
  const showHelpModal = useOnboardingStore((s) => s.showHelpModal);
  const setShowHelpModal = useOnboardingStore((s) => s.setShowHelpModal);


  // ── References ──────────────────────────────────────────────────────────────
  const activePanelRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // ── Unsaved changes prompt (beforeunload) ──────────────────────────────────
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (methods.formState.isDirty) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Leave anyway?';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [methods.formState.isDirty]);

  // Focus heading on mount for keyboard accessibility
  useEffect(() => {
    if (headingRef.current) {
      headingRef.current.focus();
    }
  }, []);

  // Prefetch dashboard
  useEffect(() => {
    router.prefetch(APP_ROUTES.SELLER.DASHBOARD);
  }, [router]);

  // ── Save Draft & Exit Handler ──────────────────────────────────────────────
  const handleSaveAndExit = useCallback(async () => {
    try {
      const now = new Date();
      // One call, one record, one ISO timestamp — see onboarding-draft-storage
      // for why the previous locale-formatted string could not be read back
      // reliably.
      const saved = saveOnboardingDraft({
        data: sanitizeOnboardingDraftForStorage(methods.getValues()) as Record<string, unknown>,
        step: currentStep,
      });

      if (!saved) {
        // Storage was blocked or full. Saying "saved" here and navigating away
        // would lose the user's work while telling them it was safe.
        toast.error('We could not save your progress', {
          description: 'Your browser is blocking storage. Complete the form now, or try again.',
        });
        return;
      }

      toast.success('Onboarding progress saved! Redirecting to home...');
      trackEvent('seller_onboarding_draft_saved', {
        step: currentStep + 1,
        timestamp: now.toISOString(),
      });
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (err) {
      logger.warn('[SellerRoleUpgradeForm] Could not save draft', { error: err });
      toast.error('Failed to save draft. Returning to home...');
      router.push('/');
    }
  }, [currentStep, methods, router]);

  // Sync step, total steps, and title to store
  useEffect(() => {
    setStoreStep(currentStep);
    setStoreTotal(STEPS.length);
    if (STEPS[currentStep]) {
      setStoreTitle(STEPS[currentStep].title);
    }
  }, [currentStep, setStoreStep, setStoreTotal, setStoreTitle]);

  // Sync form dirty state to store
  useEffect(() => {
    setIsFormDirty(methods.formState.isDirty);
  }, [methods.formState.isDirty, setIsFormDirty]);

  // Sync isSaving state to store
  useEffect(() => {
    setStoreSaving(isSaving);
  }, [isSaving, setStoreSaving]);

  // Register manual save draft callback to store
  useEffect(() => {
    setSaveDraftCallback(handleSaveAndExit);
    return () => setSaveDraftCallback(null);
  }, [handleSaveAndExit, setSaveDraftCallback]);

  // ── Watch form values for debounced autosave ───────────────────────────────
  // `methods.watch(callback)` (vs. `methods.watch()` called with no argument)
  // subscribes to every field without making this component re-render on
  // each keystroke — the wizard has 33 fields across 6 steps, and the value
  // is only ever consumed inside this debounced localStorage write, so a
  // re-render of the whole form (stepper, save-state, navigation) on every
  // keypress bought nothing.
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (status !== 'IDLE') return;

    const subscription = methods.watch(() => {
      setIsSaving(true);
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = setTimeout(() => {
        try {
          saveOnboardingDraft({
            data: sanitizeOnboardingDraftForStorage(methods.getValues()) as Record<string, unknown>,
            step: currentStep,
          });
          // The inline "saved at" indicator is a live, same-session signal, so a
          // clock time is the right granularity here — unlike the resume banner,
          // which is read in a later session and needs relative phrasing.
          setLastSaved(
            new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
          );
          setIsSaving(false);
        } catch (err) {
          logger.warn('[SellerRoleUpgradeForm] Auto-save persisted storage error', { error: err });
          setIsSaving(false);
        }
      }, 1000); // 1-second debounce
    });

    return () => {
      subscription.unsubscribe();
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [currentStep, status, methods]);

  // ── Restore from localStorage on initial mount ────────────────────────────
  useEffect(() => {
    if (status !== 'IDLE') return;
    try {
      const draft = loadOnboardingDraft();

      if (draft) {
        setDraftData(draft.data);
        setDraftStep(draft.step);
        // Relative, and locale-correct. The two read sites previously
        // disagreed on the fallback wording ('Recently' here vs
        // 'Previous Session' there); there is now one formatter and no
        // fallback string, because an unparseable draft is simply not returned.
        setDraftTimestamp(formatRelativeTime(draft.savedAt));
        setShowDraftModal(true); // Ask via premium dialog modal
      }
    } catch (err) {
      logger.warn('[SellerRoleUpgradeForm] Failed to scan localStorage draft', { error: err });
    }
  }, [status]);

  const handleConfirmRestore = () => {
    if (draftData) {
      // Prefer the draft's value for each field, but fall back to whatever
      // is currently in the form (populated by useSellerPrefill from the
      // live session/profile) when the draft's own value is blank. Without
      // this, a draft autosaved during a transient loading state — e.g.
      // before the profile fetch in useSellerPrefill resolved — would
      // permanently stomp a correctly-prefilled firstName/lastName/email
      // with an empty string every time it's restored, even though the
      // real profile data was available all along.
      const currentValues = methods.getValues();
      const merged = { ...currentValues } as Record<string, unknown>;
      for (const [key, draftValue] of Object.entries(draftData as Record<string, unknown>)) {
        if (draftValue !== '' && draftValue !== null && draftValue !== undefined) {
          merged[key] = draftValue;
        }
      }
      methods.reset(merged as typeof currentValues, { keepDefaultValues: false });
      if (draftStep !== null && draftStep >= 0 && draftStep < STEPS.length) {
        setCurrentStep(draftStep);
      }
      toast.success('Onboarding progress successfully restored!');
    }
    setShowDraftModal(false);
  };

  const handleCancelRestore = () => {
    clearOnboardingDraft();

    // "Start Fresh" is meant to discard the abandoned WIP draft (business
    // type, KYC numbers, store details, terms acceptance from a previous
    // attempt) — not the identity/contact/address fields useSellerPrefill
    // already populated from the user's real account profile on this same
    // mount, before this dialog ever opened. Those fields aren't part of
    // the draft being discarded; `reset(undefined, { keepDefaultValues:
    // true })` wiped them too, which made "start fresh" contradict the
    // user's own saved profile (see PREFILL_FIELDS below for the exact set
    // useSellerPrefill.ts's extractUserProfileFields populates).
    const currentValues = methods.getValues();
    const preserved = Object.fromEntries(
      PREFILL_FIELDS.map((field) => [field, currentValues[field]])
    );
    methods.reset({ ...DEFAULT_SELLER_FORM_VALUES, ...preserved }, { keepDefaultValues: false });
    setCurrentStep(0);
    toast.info('Started a fresh registration.');
    setShowDraftModal(false);
  };

  // Focus the active step panel programmatically on step changes
  useEffect(() => {
    if (hasNavigated && activePanelRef.current) {
      activePanelRef.current.focus();
    }
  }, [currentStep, hasNavigated]);

  // ── OTP Handlers ────────────────────────────────────────────────────────────
  // [NOT WIRED UP] There is no real backend endpoint to send/verify a
  // mobile OTP yet — this used to "verify" any 6-digit code typed in (the
  // condition `otpCode.length === 6` was always true once the input was
  // already gated to exactly 6 digits), which was a fake identity check,
  // not a real one. Since `mobileVerified` only drives a cosmetic
  // "verified" badge next to the phone field (see PersonalInfoStep.tsx) and
  // never gates step progression or submission, the dialog below is
  // honestly disabled instead — nothing else in the flow depends on this
  // succeeding.
  const handleTriggerVerifyMobile = useCallback(() => {
    setShowOtpModal(true);
  }, []);

  const handleSubmit = methods.handleSubmit(async () => {
    setHasNavigated(true);
    await next();
  });

  const handleNext = useCallback(async () => {
    setHasNavigated(true);

    trackEvent('seller_onboarding_step_completed', {
      step: currentStep + 1,
      stepName: STEPS[currentStep]?.id,
      timestamp: new Date().toISOString(),
    });

    await next();
  }, [currentStep, next]);

  const handlePrev = useCallback(() => {
    setHasNavigated(true);

    trackEvent('seller_onboarding_step_back', {
      from: currentStep + 1,
      to: currentStep,
    });

    prev();
  }, [currentStep, prev]);

  const stepAnnouncement = hasNavigated
    ? `Step ${currentStep + 1} of ${STEPS.length}: ${STEPS[currentStep]?.title ?? ''}`
    : '';

  // Validation errors map for dynamic summary block
  const errors = methods.formState.errors;
  const hasErrors = Object.keys(errors).length > 0;

  // ── Status-based early returns ─────────────────────────────────────────────

  if (status === 'PENDING') {
    return <SellerPendingStatus email={user?.email} referenceId={referenceId} />;
  }

  if (status === 'SUCCESS') {
    return (
      <SellerSuccessStatus
        isSeller={isSeller}
        isSyncing={isSyncing}
        onForceSync={handleForceSync}
      />
    );
  }

  if (status === 'ERROR') {
    return <SellerErrorStatus error={errorMessage} onRetry={handleRetry} />;
  }

  return (
    <SellerFormUIProvider>
      <FormProvider {...methods}>
        <div
          className={cn(
            'mx-auto max-w-7xl space-y-6 px-4 py-4 select-none',
            'motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500'
          )}
        >
          {/* Main layout columns: form (1fr) + sticky sidebar (360px) */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px] items-start">
            
            {/* Left Column — Main Onboarding Form */}
            <div className="space-y-6">
              
              {/* Header block with Support Button */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2
                  ref={headingRef}
                  tabIndex={-1}
                  className="text-slate-900 dark:text-slate-100 text-2xl font-bold focus:outline-hidden"
                >
                  {t('sellerOnboarding.formHeading')}
                </h2>
                
                {/* Need Help trigger button */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowHelpModal(true)}
                  className="rounded-xl px-4 py-2 border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 text-xs font-bold flex items-center gap-1.5 shrink-0 self-start sm:self-auto focus:ring-2 focus:ring-primary focus:outline-hidden"
                >
                  <HelpCircle className="h-4 w-4 text-primary" />
                  Need Assistance?
                </Button>
              </div>

              <div className="group relative">
                {/* Ambient background glow for visual interest */}
                <div
                  aria-hidden="true"
                  className={cn(
                    'rounded-card absolute -inset-0.5 blur-md',
                    'from-primary/20 to-primary/5 bg-gradient-to-r',
                    'opacity-40 transition duration-1000 group-hover:opacity-60 dark:from-primary/10 dark:to-transparent'
                  )}
                />

                <PremiumCard
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg dark:shadow-2xl rounded-2xl overflow-hidden min-h-[550px]"
                  contentClassName="p-0 flex flex-col justify-between"
                  gradientClassName="h-1.5 bg-linear-to-r from-primary to-primary-foreground"
                >
                  <div>
                    {/* Stepper Progress Block */}
                    <div className="space-y-4 pt-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                      <SellerFormStepper currentStep={currentStep} onStepClick={setCurrentStep} />

                      <div className="text-muted-foreground flex items-center justify-between px-8 text-xs font-semibold">
                        <div className="flex items-center gap-2">
                          <span className="text-foreground font-semibold">
                            Progress: {Math.round((currentStep / STEPS.length) * 100)}%
                          </span>
                          <span className="text-muted-foreground/50">|</span>
                          <span className="text-[11px] font-normal" data-testid="step-progress-text">
                            {t('sellerOnboarding.progress.stepText', {
                              current: currentStep + 1,
                              total: STEPS.length,
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          {isSaving ? (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Loader2 className="h-3 w-3 animate-spin text-primary" />
                              Auto-saving...
                            </span>
                          ) : lastSaved ? (
                            <span className="text-[10px] text-emerald-500 font-medium flex items-center gap-1">
                              <Save className="h-3 w-3" />
                              Saved at {lastSaved}
                            </span>
                          ) : null}
                          <span
                            className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full px-2.5 py-0.5 text-xs font-semibold border border-slate-200/50 dark:border-slate-700/50"
                            data-testid="step-time-estimate"
                          >
                            {t('sellerOnboarding.progress.timeEstimate', { minutes: Math.max(1, 6 - currentStep) })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Dynamic Validation Summary Alert Box */}
                    {hasErrors && methods.formState.submitCount > 0 && (
                      <div className="mx-8 mt-6 rounded-xl border border-red-500/20 bg-red-500/5 p-4 flex gap-3 text-red-600 dark:text-red-400 animate-in slide-in-from-top-2 duration-300">
                        <div className="mt-0.5">
                          <ShieldAlert className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold tracking-tight">Please complete the required details:</h4>
                          <ul className="list-disc list-inside text-xs font-medium space-y-0.5">
                            {(errors.firstName || errors.lastName || errors.email || errors.phone || errors.gender || errors.dateOfBirth) && (
                              <li>Missing or invalid details in <strong>Personal Information</strong></li>
                            )}
                            {(errors.addressLine1 || errors.city || errors.district || errors.state || errors.pincode) && (
                              <li>Missing or invalid details in <strong>Permanent Address</strong></li>
                            )}
                            {(errors.identityType || errors.businessTypes) && (
                              <li>Missing or invalid details in <strong>Identity Details</strong></li>
                            )}
                            {(errors.panNumber || errors.aadhar || errors.businessPan) && (
                              <li>Required documentation checks in <strong>KYC Verification</strong></li>
                            )}
                            {(errors.shopName || errors.storeAddressLine1 || errors.storeCity || errors.storeState || errors.storePincode || errors.shopHandle) && (
                              <li>Required details for <strong>Store Setup</strong></li>
                            )}
                            {errors.acceptedTerms && (
                              <li>You must accept the <strong>Terms & Conditions</strong></li>
                            )}
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* Multi-Step Form */}
                    <form
                      noValidate
                      onSubmit={handleSubmit}
                      aria-label="Seller registration"
                      aria-describedby="seller-form-step-announcement"
                      data-testid="seller-registration-form"
                      className="flex flex-col space-y-10 p-8 sm:p-10"
                    >
                      <div
                        id="seller-form-step-announcement"
                        className="sr-only"
                        aria-live="polite"
                        aria-atomic="true"
                      >
                        {stepAnnouncement}
                      </div>

                      {/* Step Content */}
                      <div className="flex-1">
                        <FormSteps currentStep={currentStep} activePanelRef={activePanelRef} />
                      </div>
                    </form>
                  </div>

                  {/* Navigation Controls Footer (Sticky) */}
                  <div className="sticky bottom-0 z-20 border-t border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm p-6 sm:p-8">
                    <SellerFormNavigation
                      currentStep={currentStep}
                      stepsCount={STEPS.length}
                      onPrev={handlePrev}
                      onNext={handleNext}
                      onSaveDraft={handleSaveAndExit}
                      isSubmitting={isSubmitting}
                    />
                  </div>
                </PremiumCard>
              </div>
            </div>

            {/* Right Column — Onboarding Side Panel Checklist (Sticky) */}
            <aside className="lg:sticky lg:top-6 space-y-6 h-fit w-full" aria-label="Registration Progress and Compliance">
              <OnboardingChecklist
                currentStep={currentStep}
                mobileVerified={mobileVerified}
                onVerifyMobile={handleTriggerVerifyMobile}
                emailVerified={!!(user as any)?.emailVerified}
              />
            </aside>
          </div>

          {/* ── Modal Dialogs ──────────────────────────────────────────────────── */}

          {/* Draft Recovery Dialog */}
          <Dialog open={showDraftModal} onOpenChange={setShowDraftModal}>
            <DialogContent className="max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl rounded-2xl">
              <DialogHeader className="text-left space-y-2">
                <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Restore Saved Application?
                </DialogTitle>
                <DialogDescription className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
                  We found an incomplete seller registration draft saved on your browser from <strong className="text-slate-800 dark:text-slate-200">{draftTimestamp}</strong>. Would you like to resume your application or start fresh?
                </DialogDescription>
              </DialogHeader>

              <DialogFooter className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={handleCancelRestore}
                  className="rounded-xl border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 focus:ring-2 focus:ring-primary focus:outline-hidden"
                >
                  Start Fresh
                </Button>
                <Button
                  onClick={handleConfirmRestore}
                  className="rounded-xl bg-primary hover:bg-primary/90 text-white font-bold focus:ring-2 focus:ring-primary focus:outline-hidden"
                >
                  Restore Draft
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Mobile OTP Verification Dialog */}
          <Dialog open={showOtpModal} onOpenChange={setShowOtpModal}>
            <DialogContent className="max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl rounded-2xl">
              <DialogHeader className="text-left space-y-2">
                <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Verify Mobile Number
                </DialogTitle>
                <DialogDescription className="text-slate-500 dark:text-slate-400 text-xs">
                  Mobile verification isn&apos;t connected yet — this is a preview of what&apos;s coming. Your registration can continue without it.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div
                  role="status"
                  className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs font-medium text-amber-700 dark:text-amber-400"
                >
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>SMS verification is coming soon. No code will be sent or checked.</span>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="otp-input" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Verification Code
                  </label>
                  <input
                    id="otp-input"
                    type="text"
                    maxLength={6}
                    placeholder="000000"
                    disabled
                    aria-disabled="true"
                    className="w-full text-center tracking-[0.7em] font-mono font-bold h-12 text-lg rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 focus:outline-hidden focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-60"
                  />
                </div>
              </div>

              <DialogFooter className="flex gap-2 justify-end mt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowOtpModal(false)}
                  className="rounded-xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-primary focus:outline-hidden"
                >
                  Close
                </Button>
                <Button
                  disabled
                  title="Not available yet"
                  className="rounded-xl bg-primary hover:bg-primary/95 text-white font-bold focus:ring-2 focus:ring-primary focus:outline-hidden"
                >
                  Verify Phone
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Help Center Support Modal */}
          <Dialog open={showHelpModal} onOpenChange={setShowHelpModal}>
            <DialogContent className="max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-0 overflow-hidden shadow-2xl rounded-2xl">
              <DialogHeader className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-left">
                <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <HelpCircle className="text-primary h-5 w-5" /> Help Center & FAQs
                </DialogTitle>
                <DialogDescription className="text-slate-500 dark:text-slate-400 text-xs">
                  Find instant answers to common questions or reach out to our seller onboarding team.
                </DialogDescription>
              </DialogHeader>
              
              <div className="p-6 max-h-[50vh] overflow-y-auto">
                <SupportFaq />
              </div>

              <DialogFooter className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/10 flex justify-end">
                <Button onClick={() => setShowHelpModal(false)} className="rounded-xl px-6 focus:ring-2 focus:ring-primary focus:outline-hidden">
                  Close Help
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        </div>
      </FormProvider>
    </SellerFormUIProvider>
  );
}

export default SellerRoleUpgradeForm;
