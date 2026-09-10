'use client';

import React, { memo, useCallback, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboardingStore } from '../../store/onboarding-store';
import { trackEvent } from '@/core/providers/analytics-provider';
import { logger } from '@/shared/utils/logger';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/ui/atoms/dialog';
import { Button } from '@/shared/ui/atoms/button';
import { Loader2 } from 'lucide-react';

/**
 * SellerHeaderExitDialog - Conforms to enterprise UX standards (Shopify Polaris, Apple HIG)
 * and WCAG 2.2 AA accessibility guidelines.
 *
 * Enforces:
 * - Safe action "Stay Here" as the primary action (right aligned)
 * - Navigation to marketplace only on successful saveDraftCallback resolution
 * - Escape key telemetry via custom onOpenChange logic
 * - Minimum font sizing text-sm for non-caption body content (WCAG 1.4.4)
 * - Semantic theme design tokens (bg-background, text-foreground)
 */
export const SellerHeaderExitDialog = memo(function SellerHeaderExitDialog(): React.JSX.Element {
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Local state for async transitions & persistent error announcements
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Stable granular Zustand selectors to prevent unnecessary re-renders
  const confirmExitOpen = useOnboardingStore((s) => s.confirmExitOpen);
  const setConfirmExitOpen = useOnboardingStore((s) => s.setConfirmExitOpen);
  const saveDraftCallback = useOnboardingStore((s) => s.saveDraftCallback);
  const currentStep = useOnboardingStore((s) => s.currentStep);

  const analyticsStep = currentStep + 1; // 0-indexed step -> 1-indexed step for analytics

  const handleCancelExit = useCallback(() => {
    setConfirmExitOpen(false);
    setSaveError(null);
    trackEvent('seller_onboarding_exit_cancelled', { currentStep: analyticsStep });
  }, [setConfirmExitOpen, analyticsStep]);

  const handleConfirmExit = useCallback(async () => {
    trackEvent('seller_onboarding_exit_confirmed', { currentStep: analyticsStep });

    if (saveDraftCallback) {
      setIsSavingDraft(true);
      setSaveError(null);
      try {
        await saveDraftCallback();
        setConfirmExitOpen(false);
        startTransition(() => {
          try {
            router.push('/');
          } catch (navError) {
            logger.error('[SellerHeaderExitDialog] Navigation failed:', { error: navError });
            toast.error('Navigation failed. Please try refreshing the page.');
          }
        });
      } catch (error) {
        logger.error('[SellerHeaderExitDialog] Draft save failed:', { error });
        
        // Show safe user-facing message and display inline dialog alert
        const genericMessage = 'Failed to save your progress. Please try again.';
        setSaveError(genericMessage);
        toast.error(genericMessage);

        trackEvent('seller_onboarding_draft_save_error', {
          currentStep: analyticsStep,
          errorType: error instanceof Error ? error.name : 'UnknownError',
        });
      } finally {
        setIsSavingDraft(false);
      }
    } else {
      setConfirmExitOpen(false);
      startTransition(() => {
        try {
          router.push('/');
        } catch (navError) {
          logger.error('[SellerHeaderExitDialog] Navigation failed:', { error: navError });
          toast.error('Navigation failed. Please try refreshing the page.');
        }
      });
    }
  }, [saveDraftCallback, router, analyticsStep, setConfirmExitOpen]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        handleCancelExit();
      } else {
        setSaveError(null);
        setConfirmExitOpen(true);
      }
    },
    [handleCancelExit, setConfirmExitOpen]
  );

  return (
    <Dialog open={confirmExitOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md bg-background border border-border p-6 shadow-2xl rounded-2xl">
        <DialogHeader className="text-left space-y-2">
          <DialogTitle className="text-lg font-bold text-foreground">
            Leave seller registration?
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm leading-relaxed">
            {saveDraftCallback
              ? 'Your progress will be saved. You can return later to complete your registration.'
              : 'Any unsaved progress will be lost. Are you sure you want to leave?'}
          </DialogDescription>
        </DialogHeader>

        {saveError && (
          <p
            className="text-destructive bg-destructive/10 text-sm mt-3 px-3 py-2 rounded-lg"
            role="alert"
          >
            {saveError}
          </p>
        )}

        <DialogFooter className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button
            variant="ghost"
            onClick={handleConfirmExit}
            disabled={isSavingDraft}
            className="rounded-xl text-muted-foreground hover:text-foreground h-11 px-4 text-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none min-w-[200px] justify-center"
          >
            {isSavingDraft ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin text-muted-foreground" aria-hidden="true" />
                Saving...
              </>
            ) : (
              'Return to Marketplace'
            )}
          </Button>
          <Button
            onClick={handleCancelExit}
            disabled={isSavingDraft}
            className="rounded-xl h-11 px-4 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            Stay Here
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

SellerHeaderExitDialog.displayName = 'SellerHeaderExitDialog';
