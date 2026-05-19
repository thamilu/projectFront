"use client";

import React, { memo } from 'react';
import { Save, X, RotateCcw, User, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
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
}

const FormActions = memo(({
  isEditing,
  isDirty,
  isSubmitting,
  onEdit,
  onCancel,
  onReset,
  onSave,
  onNext,
  onBack,
  hasNext,
  hasBack,
  className
}: FormActionsProps) => {
  return (
    <div
      className={cn(
        "w-full flex items-center justify-end gap-3 pt-6 mt-8 border-t border-muted/30 transition-all duration-300",
        "sticky bottom-0 bg-background/80 backdrop-blur-md p-4 md:static md:bg-transparent md:backdrop-blur-none md:p-0 z-40",
        className
      )}
      aria-busy={isSubmitting}
    >
      {!isEditing ? (
        <Button
          type="button"
          onClick={onEdit}
          className="px-8 h-12 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold group transition-all"
        >
          <User className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
          Edit Profile
        </Button>
      ) : (
        <div className="flex items-center gap-3 w-full">
          {/* Navigation Controls (Left Side) */}
          <div className="flex items-center gap-2">
            {hasBack && (
              <Button
                type="button"
                variant="outline"
                size="default"
                onClick={onBack}
                disabled={isSubmitting}
                className="h-11 w-11 rounded-xl border-muted-foreground/20 hover:bg-muted p-0"
                title="Previous Step"
                aria-label="Previous Step"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={isSubmitting}
              className="hover:bg-destructive/10 hover:text-destructive h-11 px-4"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </div>

          <div className="flex-1" />

          {/* Action Controls (Right Side) */}
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onReset}
              disabled={!isDirty || isSubmitting}
              className="hidden sm:flex h-11 px-5 border-muted-foreground/20"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>

            {hasNext ? (
              <Button
                type="button"
                onClick={onNext}
                disabled={isSubmitting}
                className="h-11 px-8 bg-muted hover:bg-muted/80 text-foreground font-bold shadow-sm"
              >
                Next Step
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : null}

            <Button
              type="button"
              onClick={onSave}
              disabled={!isDirty || isSubmitting}
              className={cn(
                "h-11 px-8 font-bold transition-all",
                isDirty && !isSubmitting ? "shadow-lg shadow-primary/25 bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                hasNext && "hidden sm:flex" // Hide Save on early steps on mobile to focus on 'Next'
              )}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});

FormActions.displayName = 'FormActions';

export { FormActions };
