'use client';

import React from 'react';
import { format } from 'date-fns';
import { CalendarDays, Check } from 'lucide-react';
import { cn } from '@/shared/utils';
import type { ISODate } from '../types/date-picker.types';
import type { DeliveryAvailability } from '../types/delivery-picker.types';
import { parseISODateParts } from '../utils/date-format';
import { formatSlotPrice, getRelativeDayLabel } from '../utils/delivery-slot.utils';

interface DeliverySlotStripProps {
  /** Selected date in ISO format */
  selectedDate: ISODate | null;
  /** Available delivery schedules */
  availability: DeliveryAvailability[];
  /** Callback fired when user selects a date card */
  onSelectDate: (date: ISODate) => void;
  /** Callback fired when user clicks 'More dates ▾' */
  onOpenCalendar?: () => void;
  /** Number of days to display in the quick strip (default: 4) */
  maxDays?: number;
  /** Disabled state */
  disabled?: boolean;
  /** Additional container styling */
  className?: string;
}

export function DeliverySlotStrip({
  selectedDate,
  availability,
  onSelectDate,
  onOpenCalendar,
  maxDays = 4,
  disabled = false,
  className,
}: DeliverySlotStripProps) {
  const visibleSlots = availability.slice(0, maxDays);

  return (
    <div className={cn('flex flex-col gap-1.5 w-full', className)}>
      <div
        role="radiogroup"
        aria-label="Quick delivery dates"
        className="flex items-stretch gap-2 overflow-x-auto pb-1 scrollbar-none"
      >
        {visibleSlots.map((slot) => {
          const isSelected = selectedDate === slot.date;
          const isAvailable = slot.available;
          const parts = parseISODateParts(slot.date);
          const dateObj = parts ? new Date(parts.year, parts.month - 1, parts.day) : new Date();

          const dayOfWeek = format(dateObj, 'EEE');
          const dayNumber = format(dateObj, 'd');
          const relLabel = getRelativeDayLabel(slot.date);
          const priceLabel = formatSlotPrice(slot.price, slot.currencySymbol);
          const isFree = slot.price === 0;

          return (
            <button
              key={slot.date}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-disabled={!isAvailable || disabled}
              disabled={!isAvailable || disabled}
              onClick={() => isAvailable && onSelectDate(slot.date)}
              className={cn(
                'flex flex-col justify-between min-w-[96px] flex-1 p-2.5 rounded-lg border text-left transition-all select-none',
                'bg-card text-card-foreground',
                'hover:border-primary/60 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                isSelected && 'border-primary bg-primary/5 ring-1 ring-primary shadow-xs',
                (!isAvailable || disabled) && 'opacity-40 cursor-not-allowed border-dashed hover:border-border hover:bg-transparent'
              )}
            >
              {/* Day & Date Header */}
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-xs font-bold text-foreground">
                  {dayOfWeek} {dayNumber}
                </span>
                {/* Radio selection circle */}
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

              {/* Relative Label (Today / Tomorrow / Month) */}
              <div className="text-[11px] font-medium text-muted-foreground mb-1.5 truncate">
                {relLabel ?? format(dateObj, 'MMM d')}
              </div>

              {/* Price & ETA Badge */}
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
              </div>
            </button>
          );
        })}

        {/* 'More dates ▾' Card to open full calendar */}
        {onOpenCalendar && (
          <button
            type="button"
            disabled={disabled}
            onClick={onOpenCalendar}
            aria-label="Open full delivery calendar for more dates"
            className={cn(
              'flex flex-col items-center justify-center min-w-[88px] p-2.5 rounded-lg border border-dashed text-center transition-all select-none',
              'bg-card/50 text-card-foreground hover:border-primary hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              disabled && 'opacity-40 cursor-not-allowed'
            )}
          >
            <CalendarDays className="h-4 w-4 text-primary mb-1 opacity-80" />
            <span className="text-[11px] font-semibold text-foreground leading-tight">
              More dates
            </span>
            <span className="text-[10px] text-muted-foreground">▾</span>
          </button>
        )}
      </div>
    </div>
  );
}
