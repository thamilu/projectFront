'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { addMonths, subMonths, addYears, subYears, setMonth } from 'date-fns';
import { parseSafeDate, clampDate } from '../utils/date-validation';

interface UseDatePickerStateOptions {
  value: string | Date | null | undefined;
  minDate?: Date | null;
  maxDate?: Date | null;
  format?: string;
}

/**
 * Enterprise state machine for DatePicker.
 * Manages popover open state, active calendar view date, selected date synchronization,
 * and month/year selector view toggle while respecting min/max date clamping.
 */
export function useDatePickerState({
  value,
  minDate,
  maxDate,
  format: customFormat,
}: UseDatePickerStateOptions) {
  const [open, setOpen] = useState(false);

  // Toggle between 'calendar' (day grid) and 'month-year' (month/year selector) views
  const [view, setView] = useState<'calendar' | 'month-year'>('calendar');

  // Derive safely parsed date from value
  const selectedDate = useMemo(
    () => parseSafeDate(value, customFormat),
    [value, customFormat]
  );

  // Active viewed date in the calendar grid (clamped within min/max bounds)
  const [currentViewDate, setCurrentViewDate] = useState<Date>(() => {
    const initial = selectedDate || new Date();
    return clampDate(initial, minDate, maxDate);
  });

  // Synchronize internal view date when external value changes
  useEffect(() => {
    const parsed = parseSafeDate(value, customFormat);
    if (parsed) {
      setCurrentViewDate(clampDate(parsed, minDate, maxDate));
    }
  }, [value, customFormat, minDate, maxDate]);

  // Reset to calendar view when popover closes
  useEffect(() => {
    if (!open) {
      setView('calendar');
    }
  }, [open]);

  // ── Month/Year Selector Navigation ──────────────────────────────────────

  /** Toggle between calendar day grid and month/year selector */
  const toggleMonthYearView = useCallback(() => {
    setView((prev) => (prev === 'calendar' ? 'month-year' : 'calendar'));
  }, []);

  /** Navigate to a specific month (from month/year selector grid) */
  const selectMonth = useCallback((monthIdx: number) => {
    setCurrentViewDate((prev) => setMonth(prev, monthIdx));
    setView('calendar');
  }, []);

  /** Navigate the year in month/year selector view */
  const navigateViewYear = useCallback((delta: number) => {
    setCurrentViewDate((prev) => {
      const next = delta > 0 ? addYears(prev, delta) : subYears(prev, Math.abs(delta));
      return next;
    });
  }, []);

  // ── Calendar Day Grid Navigation ────────────────────────────────────────

  const goToToday = useCallback(() => {
    const today = clampDate(new Date(), minDate, maxDate);
    setCurrentViewDate(today);
    setView('calendar');
  }, [minDate, maxDate]);

  const nextMonth = useCallback(() => {
    setCurrentViewDate((prev) => addMonths(prev, 1));
  }, []);

  const prevMonth = useCallback(() => {
    setCurrentViewDate((prev) => subMonths(prev, 1));
  }, []);

  const nextYear = useCallback(() => {
    setCurrentViewDate((prev) => addYears(prev, 1));
  }, []);

  const prevYear = useCallback(() => {
    setCurrentViewDate((prev) => subYears(prev, 1));
  }, []);

  const setViewMonth = useCallback((monthIdx: number, year?: number) => {
    setCurrentViewDate((prev) => {
      const next = new Date(prev);
      if (year != null) next.setFullYear(year);
      next.setMonth(monthIdx);
      return next;
    });
    setView('calendar');
  }, []);

  return {
    open,
    setOpen,
    view,
    setView,
    selectedDate,
    currentViewDate,
    setCurrentViewDate,
    toggleMonthYearView,
    selectMonth,
    navigateViewYear,
    goToToday,
    nextMonth,
    prevMonth,
    nextYear,
    prevYear,
    setViewMonth,
  };
}
