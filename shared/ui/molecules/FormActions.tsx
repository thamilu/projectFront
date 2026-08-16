'use client';

import React, { memo } from 'react';
import { Save, X, RotateCcw, Loader2, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/shared/ui/atoms/button';
import { cn } from '@/shared/utils';

/**
 * Enterprise Form Actions Component [HARDEN]
 *
 * A shared, reusable action bar for forms.
 * Enhanced with stepped navigation (Next/Back).
 */

interface FormActionsProps {
  isEditing: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onReset: () => void;
  onSave: () => void;
  onNext?: () => void;
  onBack?: () => void;
  hasNext?: boolean;
  hasBack?: boolean;
  className?: string;
  lastSavedTime?: string;
}

// ─── EditModeActions Component (SRP) ──────────────────────────────────────────

interface EditModeActionsProps {
  hasBack: boolean;
  hasNext: boolean;
  onBack?: () => void;
  onNext?: () => void;
  onCancel: () => void;
  onReset: () => void;
  onSave: () => void;
  isDirty: boolean;
  isSubmitting: boolean;
  lastSavedTime?: string;
}

const EditModeActions = memo(function EditModeActions({
  hasBack,
  hasNext,
  onBack,
  onNext,
  onCancel,
  onReset,
  onSave,
  isDirty,
  isSubmitting,
  lastSavedTime,
}: EditModeActionsProps) {
  return (
    <div className="flex w-full flex-col gap-3">
      {/* Top Status Area - Directly above buttons */}
      <div className="text-xs font-semibold select-none px-1 flex items-center justify-between">
        {!isDirty ? (
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
            No unsaved changes. Use tabs to navigate.
          </span>
        ) : !isSubmitting ? (
          <span className="flex items-center gap-1.5 text-amber-500 font-semibold animate-pulse">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
            Unsaved changes detected. Save before leaving.
          </span>
        ) : (
          <span className="text-primary flex items-center gap-1.5 font-semibold">
            <span className="bg-primary h-1.5 w-1.5 animate-ping rounded-full" />
            Saving changes...
          </span>
        )}

        {!isDirty && lastSavedTime && (
          <span className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Saved successfully at {lastSavedTime}
          </span>
        )}
      </div>

      <div className="flex w-full items-center justify-between">
        {/* Left Action Group (Cancel, Reset) */}
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="text-slate-350 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 focus-visible:ring-ring h-10 rounded-xl border-slate-800 bg-slate-900/40 px-4 text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] disabled:scale-100 disabled:opacity-40"
          >
            <X className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
            Cancel
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={onReset}
            disabled={!isDirty || isSubmitting}
            className="text-slate-305 focus-visible:ring-ring h-10 rounded-xl border-slate-800 bg-slate-900/40 px-4 text-xs font-bold transition-all hover:border-slate-700 hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-35"
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
            Reset
          </Button>
        </div>

        {/* Right Action Group (Back, Next/Save) */}
        <div className="flex items-center gap-3">
          {hasBack && (
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={onBack}
              disabled={isSubmitting}
              className="focus-visible:ring-ring h-10 w-10 rounded-xl border-slate-800 bg-slate-900/40 p-0 transition-all hover:border-slate-700 hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] disabled:scale-100 disabled:opacity-40"
              title="Previous Step"
              aria-label="Previous Step"
            >
              <ArrowLeft className="h-4 w-4 text-slate-400" />
            </Button>
          )}

          {/* Save is always reachable (dirty OR no next step) — a user must be
              able to save without being forced to navigate away first. */}
          {(isDirty || !hasNext) && (
            <Button
              type="button"
              onClick={onSave}
              disabled={!isDirty || isSubmitting}
              className={cn(
                'h-10 rounded-xl px-6 text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98]',
                isDirty
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-650 cursor-not-allowed shadow-none opacity-40'
              )}
            >
              {isSubmitting ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="mr-1.5 h-3.5 w-3.5" />
              )}
              Save Changes
            </Button>
          )}

          {/* Next is independent of Save — navigating to the next tab doesn't
              require (or discard) an in-progress save of the current one. */}
          {hasNext && (
            <Button
              type="button"
              onClick={onNext}
              disabled={isSubmitting}
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 h-10 rounded-xl px-6 text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98]"
            >
              Next Step
              <ArrowRight className="ml-1.5 h-3.5 w-3.5 text-primary-foreground" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});

EditModeActions.displayName = 'EditModeActions';

// ─── Main FormActions Component (Orchestrator Shell) ─────────────────────────

const FormActions = memo(
  ({
    isEditing,
    isDirty,
    isSubmitting,
    onCancel,
    onReset,
    onSave,
    onNext,
    onBack,
    hasNext,
    hasBack,
    className,
    lastSavedTime,
  }: FormActionsProps) => {
    // Entering edit mode is triggered from ProfileHeader's own "Edit Profile"
    // button, not here — this action bar only has a reason to exist once
    // editing has actually started (Cancel/Reset/Save/step navigation).
    if (!isEditing) {
      return null;
    }

    return (
      <div
        className={cn(
          // Docked sticky footer: stick to bottom of viewport when scrolled, negative margins breakout matches card bounds
          'sticky bottom-0 z-40 -mx-8 mt-8 -mb-8 flex flex-col w-[calc(100%+4rem)] border-t border-slate-800 bg-slate-950/90 backdrop-blur-md px-8 py-5 shadow-2xl rounded-b-2xl',
          'transition-all duration-300',
          className
        )}
        aria-busy={isSubmitting}
      >
        <EditModeActions
          hasBack={!!hasBack}
          hasNext={!!hasNext}
          onBack={onBack}
          onNext={onNext}
          onCancel={onCancel}
          onReset={onReset}
          onSave={onSave}
          isDirty={isDirty}
          isSubmitting={isSubmitting}
          lastSavedTime={lastSavedTime}
        />
      </div>
    );
  }
);

FormActions.displayName = 'FormActions';

export { FormActions };
