'use client';

import React, { memo, useCallback } from 'react';
import { HelpCircle, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/ui/atoms/button';
import { useOnboardingStore } from '../../store/onboarding-store';
import { trackEvent } from '@/core/providers/analytics-provider';
import { logger } from '@/shared/utils/logger';
import { SellerHeaderActions } from './SellerHeaderActions';
import { HEADER_ACTION_BUTTON_CLASS } from '@/shared/ui/styles/header-action-button';
import { cn } from '@/shared/utils';

/**
 * Props for the OnboardingHeaderActions component.
 */
interface OnboardingHeaderActionsProps {
  isWizardFlow?: boolean;
  locale: string;
  onLocaleChange: (localeCode: string) => void;
  isLocalePending?: boolean;
}

/**
 * OnboardingHeaderActions - Renders onboarding-specific actions (Save Draft, Help & FAQ)
 * alongside the generic SellerHeaderActions.
 */
export const OnboardingHeaderActions = memo<OnboardingHeaderActionsProps>(
  function OnboardingHeaderActions({
    isWizardFlow = true,
    locale,
    onLocaleChange,
    isLocalePending = false,
  }): React.JSX.Element {
    // Granular Zustand selectors to prevent unnecessary re-renders
    const isSaving = useOnboardingStore((s) => s.isSaving);
    const setShowHelpModal = useOnboardingStore((s) => s.setShowHelpModal);
    const saveDraftCallback = useOnboardingStore((s) => s.saveDraftCallback);

    const handleHelpClick = useCallback(() => {
      trackEvent('seller_onboarding_help_clicked', { source: 'header' });
      setShowHelpModal(true);
    }, [setShowHelpModal]);

    const handleSaveDraft = useCallback(async () => {
      if (!saveDraftCallback) return;
      trackEvent('seller_onboarding_save_draft_clicked');
      try {
        await saveDraftCallback();
        toast.success('Your progress has been saved.');
      } catch (error) {
        // Full raw error to logger for backend debugging — NEVER expose to toast/analytics
        logger.error('[OnboardingHeaderActions] Draft save failed:', { error });

        // Show a safe, generic message to the user to prevent leakage of internal system details
        toast.error('Failed to save draft. Please try again.');

        // Send only error name/type to analytics (never raw message containing sensitive details)
        trackEvent('seller_onboarding_draft_save_error', {
          errorType: error instanceof Error ? error.name : 'UnknownError',
        });
      }
    }, [saveDraftCallback]);

    return (
      <>
        {/* Manual Save Draft Button */}
        {isWizardFlow && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveDraft}
            disabled={isSaving || !saveDraftCallback}
            aria-busy={isSaving ? true : undefined}
            className={cn(HEADER_ACTION_BUTTON_CLASS, 'hidden sm:flex')}
            aria-label="Save current registration progress"
            title={!saveDraftCallback ? 'No unsaved changes' : undefined}
          >
            {isSaving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" aria-hidden="true" />
            ) : (
              <Save className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            )}
            <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
          </Button>
        )}

        {/* Unified Help Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleHelpClick}
          className={HEADER_ACTION_BUTTON_CLASS}
          aria-label="Help & FAQ"
        >
          <HelpCircle className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          <span className="hidden sm:inline">Help & FAQ</span>
          <span className="sm:hidden">Help</span>
        </Button>

        {/* Generic Header Actions */}
        <SellerHeaderActions
          locale={locale}
          onLocaleChange={onLocaleChange}
          isLocalePending={isLocalePending}
        />
      </>
    );
  }
);

OnboardingHeaderActions.displayName = 'OnboardingHeaderActions';
