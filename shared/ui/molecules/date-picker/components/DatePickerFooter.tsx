'use client';

import React from 'react';
import { Button } from '@/shared/ui/atoms/button';
import { cn } from '@/shared/utils';

interface DatePickerFooterProps {
  /** Optional age or status badge rendered on the left */
  leftContent?: React.ReactNode;
  /** Callback fired when user clicks Today */
  onToday?: () => void;
  /** Callback fired when user clicks Clear */
  onClear?: () => void;
  /** Callback fired when user clicks Cancel */
  onCancel?: () => void;
  /** Callback fired when user clicks Apply */
  onApply?: () => void;
  /** Whether Today button is disabled */
  isTodayDisabled?: boolean;
  /** Whether Apply button is disabled */
  isApplyDisabled?: boolean;
  /** Whether to show Today button */
  showToday?: boolean;
  /** Whether to show Clear button */
  showClear?: boolean;
  /** Whether to show Cancel and Apply buttons */
  showCancelApply?: boolean;
  /** Custom class */
  className?: string;
}

export function DatePickerFooter({
  leftContent,
  onToday,
  onClear,
  onCancel,
  onApply,
  isTodayDisabled = false,
  isApplyDisabled = false,
  showToday = false,
  showClear = false,
  showCancelApply = false,
  className,
}: DatePickerFooterProps) {
  if (!leftContent && !showToday && !showClear && !showCancelApply) {
    return null;
  }

  return (
    <div
      className={cn(
        'mt-3 flex items-center justify-between border-t border-border/70 pt-2.5 text-xs',
        className
      )}
    >
      {/* Left side: Age badge or Today/Clear actions */}
      <div className="flex items-center gap-2">
        {leftContent}

        {showToday && onToday && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isTodayDisabled}
            onClick={onToday}
            className="h-7 px-2 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
          >
            Today
          </Button>
        )}

        {showClear && onClear && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-7 px-2 text-[11px] font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Right side: Cancel / Apply actions */}
      {showCancelApply && (
        <div className="flex items-center gap-1.5">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="h-7 px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
          )}

          {onApply && (
            <Button
              type="button"
              size="sm"
              disabled={isApplyDisabled}
              onClick={onApply}
              className="h-7 px-3 text-xs font-semibold shadow-xs"
            >
              Apply
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
