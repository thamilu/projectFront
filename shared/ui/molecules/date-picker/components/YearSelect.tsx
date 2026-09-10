'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';
import { generateYearRange } from '../utils/date-picker.utils';
import type { YearRangeConfig } from '../types/date-picker.types';
import { cn } from '@/shared/utils';

interface YearSelectProps {
  /** Currently selected full year (e.g. 1996) */
  value: number;
  /** Minimum selectable date */
  minDate?: Date | null;
  /** Maximum selectable date */
  maxDate?: Date | null;
  /** Custom year range configuration */
  yearRange?: YearRangeConfig;
  /** Callback fired when a year is selected */
  onChange: (year: number) => void;
  /** Additional CSS classes */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
}

export function YearSelect({
  value,
  minDate,
  maxDate,
  yearRange,
  onChange,
  className,
  disabled = false,
}: YearSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const allYears = useMemo(() => {
    return generateYearRange({ yearRange, minDate, maxDate });
  }, [yearRange, minDate, maxDate]);

  const filteredYears = useMemo(() => {
    if (!searchQuery.trim()) return allYears;
    const query = searchQuery.trim();
    return allYears.filter((y) => String(y).includes(query));
  }, [allYears, searchQuery]);

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

  // Auto-scroll to selected year when opened and focus search
  useEffect(() => {
    if (open) {
      setSearchQuery('');
      requestAnimationFrame(() => {
        activeItemRef.current?.scrollIntoView({ block: 'center', behavior: 'auto' });
        searchInputRef.current?.focus();
      });
    }
  }, [open]);

  const handleSelect = useCallback(
    (year: number) => {
      onChange(year);
      setOpen(false);
    },
    [onChange]
  );

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        disabled={disabled}
        aria-label="Select year"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className={cn(
          'flex h-7.5 items-center justify-between gap-1.5 rounded-md px-2.5 text-xs font-semibold text-foreground transition-all',
          'bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-200/70 dark:hover:bg-slate-700/70',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          'disabled:cursor-not-allowed disabled:opacity-40 select-none min-w-[76px]',
          open && 'bg-primary/10 border-primary/50 text-primary ring-1 ring-primary/30',
          className
        )}
      >
        <span>{value}</span>
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
          aria-label="Years"
          className="absolute right-0 top-full mt-1.5 w-[172px] p-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 focus:outline-none animate-in fade-in-0 zoom-in-95 duration-100 ring-1 ring-black/5 dark:ring-white/10"
        >
          {/* Quick Search Input with 34px height and full width */}
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              inputMode="numeric"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search year..."
              className="w-full h-8.5 pl-8 pr-2.5 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Scrollable Year List */}
          <div
            ref={listRef}
            style={{ maxHeight: 180 }}
            className="flex flex-col gap-0.5 overflow-y-auto overscroll-contain pr-1 scrollbar-thin"
          >
            {filteredYears.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400">No years found</div>
            ) : (
              filteredYears.map((year) => {
                const isSelected = year === value;
                return (
                  <button
                    key={year}
                    ref={isSelected ? activeItemRef : undefined}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(year)}
                    className={cn(
                      'flex h-8 items-center justify-between w-full px-2.5 rounded-lg text-xs font-semibold text-left transition-colors select-none',
                      'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 focus-visible:outline-none focus-visible:bg-slate-100 dark:focus-visible:bg-slate-800',
                      isSelected && 'bg-primary text-primary-foreground font-bold hover:bg-primary/95 shadow-2xs'
                    )}
                  >
                    <span>{year}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-primary-foreground" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
