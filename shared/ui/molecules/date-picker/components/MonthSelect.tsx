'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import { MONTHS } from '../constants/date-picker.constants';
import { isMonthInRange } from '../utils/date-validation';
import { cn } from '@/shared/utils';

interface MonthSelectProps {
  /** Selected month index (0 = January, 11 = December) */
  value: number;
  /** Current year for boundary checking */
  year: number;
  /** Minimum selectable date */
  minDate?: Date | null;
  /** Maximum selectable date */
  maxDate?: Date | null;
  /** Callback fired when a month is selected */
  onChange: (monthIndex: number) => void;
  /** Additional styling class */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
}

export function MonthSelect({
  value,
  year,
  minDate,
  maxDate,
  onChange,
  className,
  disabled = false,
}: MonthSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedMonth = MONTHS[value] ?? MONTHS[0];

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return;

    const handlePointerDownOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDownOutside);
    document.addEventListener('touchstart', handlePointerDownOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDownOutside);
      document.removeEventListener('touchstart', handlePointerDownOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const handleSelect = useCallback(
    (monthIdx: number) => {
      onChange(monthIdx);
      setOpen(false);
    },
    [onChange]
  );

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        disabled={disabled}
        aria-label="Select month"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className={cn(
          'flex h-7.5 items-center justify-between gap-1.5 rounded-md px-2.5 text-xs font-semibold text-foreground transition-all',
          'bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-200/70 dark:hover:bg-slate-700/70',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          'disabled:cursor-not-allowed disabled:opacity-40 select-none min-w-[88px]',
          open && 'bg-primary/10 border-primary/50 text-primary ring-1 ring-primary/30',
          className
        )}
      >
        <span className="truncate">{selectedMonth.full}</span>
        <ChevronDown
          className={cn(
            'h-3 w-3 text-muted-foreground transition-transform duration-150',
            open && 'rotate-180 text-primary'
          )}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Months"
          className="absolute left-0 top-full mt-1.5 w-[228px] p-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 focus:outline-none animate-in fade-in-0 zoom-in-95 duration-100 ring-1 ring-black/5 dark:ring-white/10"
        >
          <div className="text-[11px] font-semibold text-muted-foreground px-1 pb-1.5 border-b border-border/50 mb-1.5 select-none">
            Select month
          </div>
          {/* 3×4 High-Scannability Month Grid with 44×34px button targets */}
          <div className="grid grid-cols-3 gap-1.5">
            {MONTHS.map((m) => {
              const isSelected = m.index === value;
              const isEnabled = isMonthInRange(year, m.index, minDate, maxDate);

              return (
                <button
                  key={m.index}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={!isEnabled}
                  aria-label={m.full}
                  disabled={!isEnabled}
                  onClick={() => handleSelect(m.index)}
                  className={cn(
                    'flex h-8.5 items-center justify-center rounded-lg text-xs font-semibold text-center transition-all select-none',
                    'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    isSelected && 'bg-primary text-primary-foreground font-bold hover:bg-primary/95 shadow-xs',
                    !isEnabled && 'opacity-25 cursor-not-allowed pointer-events-none text-muted-foreground'
                  )}
                >
                  {m.abbr}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
