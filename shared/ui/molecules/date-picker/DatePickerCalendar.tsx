'use client';

import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import {
  format,
  subMonths,
  addMonths,
  startOfWeek,
  startOfMonth,
  endOfWeek,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  type Locale,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/shared/ui/atoms/button';
import { cn } from '@/shared/utils';
import {
  MONTHS,
  WEEK_DAYS_SUNDAY_FIRST,
  WEEK_DAYS_MONDAY_FIRST,
  DAY_BASE_CLASSES,
  DAY_OUTSIDE_MONTH_CLASSES,
  DAY_HOVER_CLASSES,
  DAY_SELECTED_CLASSES,
  DAY_TODAY_CLASSES,
  DAY_DISABLED_CLASSES,
} from './constants/date-picker.constants';
import { useCalendarKeyboard } from './hooks/useCalendarKeyboard';
import { isDateDisabledCheck, isMonthInRange } from './utils/date-validation';
import { generateYearRange } from './utils/date-picker.utils';
import { buildISODate } from './utils/date-format';
import { MonthSelect } from './components/MonthSelect';
import { YearSelect } from './components/YearSelect';
import type { YearRangeConfig, DayRenderInfo } from './types/date-picker.types';

// ─── Month/Year Selector Sub-Component (for ModernDatePicker month-year view) ─

interface MonthYearSelectorProps {
  currentViewDate: Date;
  minDate?: Date | null;
  maxDate?: Date | null;
  yearRange?: YearRangeConfig;
  onNavigateYear: (delta: number) => void;
  onSelectMonth: (monthIdx: number) => void;
  currentViewMonth: number;
  locale?: Locale;
}

function MonthYearSelector({
  currentViewDate,
  minDate,
  maxDate,
  yearRange,
  onNavigateYear,
  onSelectMonth,
  currentViewMonth,
}: MonthYearSelectorProps) {
  const currentYear = currentViewDate.getFullYear();
  const [showYearList, setShowYearList] = useState(false);
  const yearListRef = useRef<HTMLDivElement>(null);
  const activeYearRef = useRef<HTMLButtonElement>(null);

  const years = useMemo(
    () => generateYearRange({ yearRange, minDate, maxDate }),
    [yearRange, minDate, maxDate]
  );
  const minYear = years.length > 0 ? years[years.length - 1] : currentYear - 100;
  const maxYear = years.length > 0 ? years[0] : currentYear + 20;

  const canGoPrevYear = currentYear > minYear;
  const canGoNextYear = currentYear < maxYear;

  useEffect(() => {
    if (showYearList && activeYearRef.current && yearListRef.current) {
      requestAnimationFrame(() => {
        activeYearRef.current?.scrollIntoView({ block: 'center', behavior: 'auto' });
      });
    }
  }, [showYearList]);

  const handleYearSelect = useCallback(
    (year: number) => {
      const delta = year - currentYear;
      if (delta !== 0) {
        onNavigateYear(delta);
      }
      setShowYearList(false);
    },
    [currentYear, onNavigateYear]
  );

  return (
    <div className="flex flex-col overflow-hidden">
      {/* Year Navigation Header */}
      <div className="mb-2 flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={!canGoPrevYear}
          aria-label={showYearList ? 'Previous year page' : 'Previous year'}
          className="h-7 w-7 rounded-md hover:bg-muted text-foreground/80 hover:text-foreground disabled:opacity-30"
          onClick={() => onNavigateYear(showYearList ? -12 : -1)}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>

        <button
          type="button"
          aria-label={showYearList ? 'Close year list' : 'Open year list'}
          aria-expanded={showYearList}
          className={cn(
            'text-sm font-bold tracking-tight transition-colors duration-150',
            'hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md px-2 py-0.5',
            showYearList ? 'text-primary' : 'text-foreground'
          )}
          onClick={() => setShowYearList((prev) => !prev)}
        >
          {currentYear}
        </button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={!canGoNextYear}
          aria-label={showYearList ? 'Next year page' : 'Next year'}
          className="h-7 w-7 rounded-md hover:bg-muted text-foreground/80 hover:text-foreground disabled:opacity-30"
          onClick={() => onNavigateYear(showYearList ? 12 : 1)}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      {showYearList ? (
        /* Scrollable Year Grid */
        <div
          ref={yearListRef}
          style={{ height: 180, maxHeight: 180 }}
          className="overflow-y-auto overflow-x-hidden pr-1 min-h-0"
        >
          <div role="listbox" aria-label="Select a year" className="grid grid-cols-4 gap-1">
            {years.map((year) => {
              const isActive = year === currentYear;
              return (
                <button
                  key={year}
                  ref={isActive ? activeYearRef : undefined}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  aria-label={`${year}`}
                  onClick={() => handleYearSelect(year)}
                  className={cn(
                    'rounded-md py-1 text-xs font-medium transition-all select-none',
                    'focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-primary',
                    isActive
                      ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                      : 'text-foreground/80 hover:bg-muted hover:text-foreground'
                  )}
                >
                  {year}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* 4×3 Month Grid */
        <div
          role="group"
          aria-label={`Months for ${currentYear}`}
          className="grid grid-cols-3 gap-1.5 flex-1 content-center"
        >
          {MONTHS.map(({ index, abbr, full }) => {
            const isActive = currentViewMonth === index;
            const isMonthDisabled = !isMonthInRange(currentYear, index, minDate, maxDate);

            return (
              <button
                key={index}
                type="button"
                disabled={isMonthDisabled}
                aria-disabled={isMonthDisabled}
                aria-label={`${full} ${currentYear}${isMonthDisabled ? ' (disabled)' : ''}`}
                aria-pressed={isActive}
                onClick={() => onSelectMonth(index)}
                className={cn(
                  'rounded-md py-1.5 text-xs font-medium transition-all select-none',
                  'focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-primary',
                  isActive
                    ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                    : 'text-foreground/80 hover:bg-muted hover:text-foreground',
                  isMonthDisabled && 'opacity-25 cursor-not-allowed pointer-events-none text-muted-foreground'
                )}
              >
                {abbr}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Calendar Component ──────────────────────────────────────────────────

export interface DatePickerCalendarProps {
  /** Currently selected Date object */
  selectedDate: Date | null;
  /** Active viewing Date driving the month/year grid */
  currentViewDate: Date;
  /** State setter for updating active viewing date */
  setCurrentViewDate: React.Dispatch<React.SetStateAction<Date>>;
  /** Selection callback */
  onSelect: (date: Date) => void;
  /** Clear callback */
  onClear?: () => void;
  /** Minimum selectable date boundary */
  minDate?: Date | null;
  /** Maximum selectable date boundary */
  maxDate?: Date | null;
  /** Custom predicate for disabling dates */
  isDateDisabled?: (date: Date) => boolean;
  /** Optional date-fns locale */
  locale?: Locale;
  /** Week starts on (0 = Sunday, 1 = Monday; default: 0) */
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** Custom day content slot renderer (e.g. for pricing tags, availability icons) */
  renderDayContent?: (date: Date, info: DayRenderInfo) => React.ReactNode;
  /** Custom accessible label generator */
  getDayAriaLabel?: (date: Date, info: DayRenderInfo) => string;
  /** Whether to render direct Month & Year dropdowns in the header (ideal for DOB) */
  showMonthYearDropdowns?: boolean;
  /** Custom year range configuration for year selector */
  yearRange?: YearRangeConfig;
  /** Additional container styling */
  className?: string;
  /** View mode support for legacy month-year selector panel */
  view?: 'calendar' | 'month-year';
  onToggleView?: () => void;
  onNavigateYear?: (delta: number) => void;
  onSelectMonth?: (monthIdx: number) => void;
  showTodayButton?: boolean;
  showClearButton?: boolean;
}

export function DatePickerCalendar({
  selectedDate,
  currentViewDate,
  setCurrentViewDate,
  onSelect,
  onClear,
  minDate,
  maxDate,
  isDateDisabled,
  locale,
  weekStartsOn = 0,
  renderDayContent,
  getDayAriaLabel,
  showMonthYearDropdowns = false,
  yearRange,
  className,
  view = 'calendar',
  onToggleView,
  onNavigateYear,
  onSelectMonth,
  showTodayButton = false,
  showClearButton = false,
}: DatePickerCalendarProps) {
  // Flat list of days in current month grid
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentViewDate), { weekStartsOn });
    const end = endOfWeek(endOfMonth(currentViewDate), { weekStartsOn });
    return eachDayOfInterval({ start, end });
  }, [currentViewDate, weekStartsOn]);

  // 7-day week rows
  const weekRows = useMemo(() => {
    const rows: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      rows.push(days.slice(i, i + 7));
    }
    return rows;
  }, [days]);

  // Weekday column headers
  const weekDayHeaders = useMemo(() => {
    if (weekStartsOn === 1) {
      return WEEK_DAYS_MONDAY_FIRST;
    }
    return WEEK_DAYS_SUNDAY_FIRST;
  }, [weekStartsOn]);

  const handleNavigateDate = useCallback(
    (targetDate: Date) => {
      setCurrentViewDate(targetDate);
    },
    [setCurrentViewDate]
  );

  const { handleKeyDown, registerRef } = useCalendarKeyboard({
    days,
    onSelect,
    onNavigateDate: handleNavigateDate,
  });

  const checkIsDayDisabled = useCallback(
    (day: Date) => isDateDisabledCheck(day, minDate, maxDate, isDateDisabled),
    [minDate, maxDate, isDateDisabled]
  );

  const currentYear = currentViewDate.getFullYear();
  const currentMonthIdx = currentViewDate.getMonth();

  const handleMonthChange = useCallback(
    (newMonthIdx: number) => {
      setCurrentViewDate(new Date(currentYear, newMonthIdx, 1));
    },
    [currentYear, setCurrentViewDate]
  );

  const handleYearChange = useCallback(
    (newYear: number) => {
      setCurrentViewDate(new Date(newYear, currentMonthIdx, 1));
    },
    [currentMonthIdx, setCurrentViewDate]
  );

  const handlePrevMonth = useCallback(() => {
    setCurrentViewDate((prev) => subMonths(prev, 1));
  }, [setCurrentViewDate]);

  const handleNextMonth = useCallback(() => {
    setCurrentViewDate((prev) => addMonths(prev, 1));
  }, [setCurrentViewDate]);

  return (
    <div className={cn('flex w-full flex-col select-none relative', className)}>
      {/* ── Header: Navigation & Month/Year Selectors ────────────────────── */}
      <div className="mb-2 flex items-center justify-between">
        {showMonthYearDropdowns ? (
          /* Symmetrical DOB Header: ‹ [Month] [Year] › */
          <div className="flex w-full items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Previous month"
              onClick={handlePrevMonth}
              className="h-7 w-7 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-1">
              <MonthSelect
                value={currentMonthIdx}
                year={currentYear}
                minDate={minDate}
                maxDate={maxDate}
                onChange={handleMonthChange}
              />
              <YearSelect
                value={currentYear}
                minDate={minDate}
                maxDate={maxDate}
                yearRange={yearRange}
                onChange={handleYearChange}
              />
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Next month"
              onClick={handleNextMonth}
              className="h-7 w-7 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          /* Standard Header with clickable Month/Year Title */
          <>
            {view === 'calendar' ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Previous month"
                onClick={handlePrevMonth}
                className="h-7 w-7 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            ) : (
              <div className="w-7" />
            )}

            {onToggleView ? (
              <button
                type="button"
                aria-label={view === 'calendar' ? 'Switch to month and year selector' : 'Switch to calendar'}
                onClick={onToggleView}
                className={cn(
                  'rounded-md px-2 py-0.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  view === 'month-year' && 'text-primary font-bold'
                )}
              >
                {format(currentViewDate, 'MMMM yyyy', { locale })}
              </button>
            ) : (
              <span className="text-xs font-semibold text-foreground">
                {format(currentViewDate, 'MMMM yyyy', { locale })}
              </span>
            )}

            {view === 'calendar' ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Next month"
                onClick={handleNextMonth}
                className="h-7 w-7 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <div className="w-7" />
            )}
          </>
        )}
      </div>

      {/* ── View Body: Month/Year selector OR Days Grid ───────────────── */}
      {view === 'month-year' && onNavigateYear && onSelectMonth ? (
        <MonthYearSelector
          currentViewDate={currentViewDate}
          minDate={minDate}
          maxDate={maxDate}
          yearRange={yearRange}
          onNavigateYear={onNavigateYear}
          onSelectMonth={onSelectMonth}
          currentViewMonth={currentMonthIdx}
          locale={locale}
        />
      ) : (
        /* Days Grid */
        <div
          role="grid"
          aria-label={`Calendar for ${format(currentViewDate, 'MMMM yyyy', { locale })}`}
          className="flex min-h-0 flex-col gap-1"
        >
          {/* Weekday Column Headers (Subdued) */}
          <div role="row" className="grid grid-cols-7 gap-1 pb-0.5">
            {weekDayHeaders.map((day) => (
              <div
                key={day}
                role="columnheader"
                aria-label={day}
                className="flex h-6 items-center justify-center text-center text-[11px] font-medium text-muted-foreground/60 select-none"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Week Rows */}
          <div className="flex flex-col gap-1">
            {weekRows.map((week, rowIdx) => (
              <div key={rowIdx} role="row" className="grid grid-cols-7 gap-1">
                {week.map((day, colIdx) => {
                  const idx = rowIdx * 7 + colIdx;
                  const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                  const isCurrentMonth = isSameMonth(day, currentViewDate);
                  const isDisabled = checkIsDayDisabled(day);
                  const isToday = isSameDay(day, new Date());
                  const dayNumber = day.getDate();
                  const isoDate = buildISODate(day.getFullYear(), day.getMonth() + 1, dayNumber);

                  const renderInfo: DayRenderInfo = {
                    dayNumber,
                    isCurrentMonth,
                    isSelected,
                    isToday,
                    isDisabled,
                    isoDate,
                  };

                  const isFocusable =
                    isSelected ||
                    (!selectedDate && isCurrentMonth && dayNumber === 1) ||
                    (!selectedDate && idx === 0);

                  const defaultAriaLabel = `${isToday ? 'Today, ' : ''}${format(day, 'EEEE, MMMM d, yyyy', { locale })}${isDisabled ? ' (disabled)' : ''}`;
                  const ariaLabel = getDayAriaLabel ? getDayAriaLabel(day, renderInfo) : defaultAriaLabel;

                  return (
                    <button
                      key={idx}
                      ref={(el) => registerRef(idx, el)}
                      type="button"
                      role="gridcell"
                      aria-selected={isSelected}
                      aria-disabled={isDisabled}
                      aria-current={isToday ? 'date' : undefined}
                      aria-label={ariaLabel}
                      disabled={isDisabled}
                      tabIndex={isFocusable ? 0 : -1}
                      onKeyDown={(e) => handleKeyDown(e, day, idx)}
                      onClick={() => {
                        if (!isDisabled) {
                          onSelect(day);
                        }
                      }}
                      className={cn(
                        DAY_BASE_CLASSES,
                        !isCurrentMonth && DAY_OUTSIDE_MONTH_CLASSES,
                        isCurrentMonth && !isSelected && !isDisabled && DAY_HOVER_CLASSES,
                        isSelected && DAY_SELECTED_CLASSES,
                        isToday && !isSelected && DAY_TODAY_CLASSES,
                        isDisabled && DAY_DISABLED_CLASSES
                      )}
                    >
                      {renderDayContent ? renderDayContent(day, renderInfo) : dayNumber}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Action Footer ──────────────────────────────────────────────── */}
      {(showTodayButton || showClearButton) && (
        <div className="mt-2 flex items-center justify-between border-t border-border/60 pt-2">
          {showTodayButton ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                const today = new Date();
                if (!checkIsDayDisabled(today)) {
                  setCurrentViewDate(today);
                  onSelect(today);
                }
              }}
              className="h-6 px-2 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
            >
              Today
            </Button>
          ) : (
            <div />
          )}

          {showClearButton && onClear && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="h-6 px-2 text-[11px] font-semibold text-destructive hover:bg-destructive/10"
            >
              Clear
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
