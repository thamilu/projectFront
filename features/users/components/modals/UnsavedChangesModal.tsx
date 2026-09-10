'use client';

/**
 * UnsavedChangesModal.tsx
 *
 * Accessible confirmation dialog presented when a user attempts
 * to switch tabs or navigate away while possessing unsaved form modifications.
 */
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/atoms/dialog';
import { Button } from '@/shared/ui/atoms/button';
import { AlertCircle } from 'lucide-react';

export interface UnsavedChangesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmDiscard: () => void;
  onKeepEditing: () => void;
}

export function UnsavedChangesModal({
  open,
  onOpenChange,
  onConfirmDiscard,
  onKeepEditing,
}: UnsavedChangesModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader className="space-y-2.5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-5 w-5" />
            </div>
            <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
              Discard unsaved changes?
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            You have unsaved changes to your profile. If you leave or switch tabs now, your modifications will be lost.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onKeepEditing}
            className="text-xs font-semibold h-9"
          >
            Keep Editing
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirmDiscard}
            className="text-xs font-semibold h-9"
          >
            Discard Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

UnsavedChangesModal.displayName = 'UnsavedChangesModal';
