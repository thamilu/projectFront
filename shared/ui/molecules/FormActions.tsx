'use client';

import React, { memo } from 'react';
import { Save, X, RotateCcw, Loader2, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/shared/ui/atoms/button';
import { cn } from '@/shared/utils';

/**
 * Enterprise Form Actions Component
 * Reusable action bar for multi-step forms with save, cancel, reset, and step navigation.
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
  nextTabLabel?: string;
}

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
  nextTabLabel?: string;
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
  nextTabLabel,
}: EditModeActionsProps) {
  return (
    <div className="flex w-full flex-col gap-3">
      {/* Top Status Area */}
      <div className="text-xs font-medium select-none px-1 flex items-center justify-between">
        {!isDirty ? (
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
            No unsaved changes
          </span>
        ) : !isSubmitting ? (
          <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
            Unsaved changes detected. Save before leaving.
          </span>
        ) : (
          <span className="text-primary flex items-center gap-1.5 font-medium">
            <span className="bg-primary h-1.5 w-1.5 animate-ping rounded-full" />
            Saving changes...
          </span>
        )}

        {!isDirty && lastSavedTime && (
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Saved at {lastSavedTime}
          </span>
        )}
      </div>

      <div className="flex w-full items-center justify-between gap-3">
        {/* Left Action Group (Cancel, Reset) */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="h-9 px-3.5 text-xs font-semibold"
          >
            <X className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
            Cancel
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={onReset}
            disabled={!isDirty || isSubmitting}
            className="h-9 px-3.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Reset
          </Button>
        </div>

        {/* Right Action Group (Back, Next/Save) */}
        <div className="flex items-center gap-2">
          {hasBack && (
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={isSubmitting}
              className="h-9 w-9 p-0"
              title="Previous Step"
              aria-label="Previous Step"
            >
              <ArrowLeft className="h-4 w-4 text-muted-foreground" />
            </Button>
          )}

          {/* Save Button */}
          {(isDirty || !hasNext) && (
            <Button
              type="button"
              onClick={onSave}
              disabled={!isDirty || isSubmitting}
              className="h-9 px-4 text-xs font-semibold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                  Save Changes
                </>
              )}
            </Button>
          )}

          {/* Next Button */}
          {hasNext && (
            <Button
              type="button"
              onClick={onNext}
              disabled={isSubmitting}
              className="h-9 px-4 text-xs font-semibold"
            >
              {nextTabLabel ? `Continue to ${nextTabLabel}` : 'Next Step'}
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});

EditModeActions.displayName = 'EditModeActions';

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
    nextTabLabel,
  }: FormActionsProps) => {
    if (!isEditing) {
      return null;
    }

    return (
      <div
        className={cn(
          'sticky bottom-0 z-40 -mx-4 sm:-mx-6 mt-6 -mb-6 flex flex-col w-[calc(100%+2rem)] sm:w-[calc(100%+3rem)] border-t border-border/60 bg-card/95 backdrop-blur-xs px-4 sm:px-6 py-4 shadow-md rounded-b-xl transition-all duration-200',
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
          nextTabLabel={nextTabLabel}
        />
      </div>
    );
  }
);

FormActions.displayName = 'FormActions';

export { FormActions };
