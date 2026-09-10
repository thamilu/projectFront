'use client';

import React from 'react';
import { Truck, CheckCircle2 } from 'lucide-react';
import { Button } from '@/shared/ui/atoms/button';
import { cn } from '@/shared/utils';
import type { DeliverySelection } from '../types/delivery-picker.types';

interface DeliverySummaryProps {
  /** Selection metadata */
  selection: DeliverySelection | null;
  /** Callback fired on confirm click */
  onConfirm?: (selection: DeliverySelection) => void;
  /** Custom button label */
  buttonLabel?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Whether to show confirmation CTA */
  showButton?: boolean;
  /** Additional container styling */
  className?: string;
}

export function DeliverySummary({
  selection,
  onConfirm,
  buttonLabel = 'Confirm Delivery Date',
  disabled = false,
  showButton = true,
  className,
}: DeliverySummaryProps) {
  if (!selection) return null;

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-lg border border-primary/20 bg-primary/5',
        className
      )}
    >
      <div className="flex items-start sm:items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Truck className="h-4 w-4" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1 text-xs font-bold text-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{selection.isFree ? 'Free Delivery' : `${selection.currencySymbol}${selection.price} Delivery`}</span>
          </div>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">
            {selection.estimatedDelivery}
          </p>
        </div>
      </div>

      {showButton && onConfirm && (
        <Button
          type="button"
          size="sm"
          disabled={disabled}
          onClick={() => onConfirm(selection)}
          className="w-full sm:w-auto h-9 px-4 text-xs font-semibold shadow-xs shrink-0"
        >
          {buttonLabel}
        </Button>
      )}
    </div>
  );
}
