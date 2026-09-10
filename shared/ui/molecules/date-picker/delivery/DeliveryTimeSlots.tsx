'use client';

import React from 'react';
import { Clock, Check } from 'lucide-react';
import { cn } from '@/shared/utils';
import type { DeliveryTimeSlot } from '../types/delivery-picker.types';
import { formatSlotPrice } from '../utils/delivery-slot.utils';

interface DeliveryTimeSlotsProps {
  /** Available time windows for selected date */
  slots: DeliveryTimeSlot[];
  /** Currently selected time slot id */
  selectedSlotId?: string | null;
  /** Callback fired when user selects a time window */
  onSelectSlot: (slot: DeliveryTimeSlot) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Additional container styling */
  className?: string;
}

export function DeliveryTimeSlots({
  slots,
  selectedSlotId,
  onSelectSlot,
  disabled = false,
  className,
}: DeliveryTimeSlotsProps) {
  if (!slots || slots.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex flex-col gap-2 w-full', className)}>
      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
        <Clock className="h-3.5 w-3.5 text-primary opacity-80" />
        <span>Delivery time</span>
      </div>

      <div
        role="radiogroup"
        aria-label="Select delivery time window"
        className="grid grid-cols-1 sm:grid-cols-3 gap-2"
      >
        {slots.map((slot) => {
          const isSelected = selectedSlotId === slot.id;
          const isSlotDisabled = slot.disabled || disabled;
          const priceLabel = formatSlotPrice(slot.price, slot.currencySymbol);
          const isFree = slot.price === 0;

          return (
            <button
              key={slot.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-disabled={isSlotDisabled}
              disabled={isSlotDisabled}
              onClick={() => !isSlotDisabled && onSelectSlot(slot)}
              className={cn(
                'flex flex-col justify-between p-2.5 rounded-lg border text-left transition-all select-none',
                'bg-card text-card-foreground',
                'hover:border-primary/60 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                isSelected && 'border-primary bg-primary/5 ring-1 ring-primary shadow-xs',
                isSlotDisabled && 'opacity-40 cursor-not-allowed border-dashed hover:border-border hover:bg-transparent'
              )}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-xs font-bold text-foreground">{slot.name}</span>
                <div
                  className={cn(
                    'h-3.5 w-3.5 rounded-full border flex items-center justify-center transition-colors',
                    isSelected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-muted-foreground/50 bg-background'
                  )}
                >
                  {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                </div>
              </div>

              <div className="text-[11px] text-muted-foreground font-medium mb-1.5">
                {slot.timeRange}
              </div>

              <div className="flex items-center gap-1 mt-auto">
                <span
                  className={cn(
                    'inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold tracking-tight',
                    isFree
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40'
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/40'
                  )}
                >
                  {priceLabel}
                </span>
                {slot.badge && (
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase">
                    {slot.badge}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
