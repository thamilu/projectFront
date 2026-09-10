'use client';

import React, { useMemo, useCallback } from 'react';
import { CalendarDays as CalendarIcon, X as ClearIcon, AlertCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/atoms/popover';
import { Button } from '@/shared/ui/atoms/button';
import { cn } from '@/shared/utils';

import { useDatePickerState } from './hooks/useDatePickerState';
import { DatePickerCalendar } from './DatePickerCalendar';
import { parseSafeDate, formatDateISO, formatDisplayDate } from './utils/date-validation';
import {
  DEFAULT_DATE_FORMAT,
  DEFAULT_DISPLAY_FORMAT,
  POP_CONTENT_CLASSES,
} from './constants/date-picker.constants';
import type { ModernDatePickerProps, DatePickerSize } from './types/date-picker.types';

// ─── Error Boundary ───────────────────────────────────────────────────────────

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class DatePickerErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('DatePickerErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div
          role="alert"
          className="border-destructive/40 text-destructive bg-destructive/10 flex items-center justify-between gap-2 rounded-xl border p-2.5 text-xs font-medium"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Failed to render date picker</span>
          </div>
          <button
            type="button"
            onClick={this.handleReset}
            className="underline font-semibold hover:opacity-80 focus:outline-none"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Helper Size Class Generator ──────────────────────────────────────────────

function getSizeClasses(size: DatePickerSize = 'default') {
  switch (size) {
    case 'sm':
      return 'h-9 px-2.5 text-xs rounded-lg';
    case 'lg':
      return 'h-12 px-4 text-base rounded-xl';
    case 'default':
    default:
      return 'h-11 px-3 text-sm rounded-xl';
  }
}

// ─── Inner Date Picker Component ──────────────────────────────────────────────

function ModernDatePickerInner({
  id,
  name,
  value,
  onChange,
  placeholder = 'Select Date',
  disabled = false,
  readOnly = false,
  required = false,
  error,
  className,
  popoverClassName,
  minDate,
  maxDate,
  isDateDisabled,
  format: formatPattern = DEFAULT_DATE_FORMAT,
  displayFormat: displayPattern = DEFAULT_DISPLAY_FORMAT,
  locale,
  weekStartsOn = 0,
  yearRange,
  clearable = true,
  showTodayButton = true,
  showClearButton = true,
  closeOnSelect = true,
  size = 'default',
  variant = 'outline',
  side = 'bottom',
  align = 'start',
  sideOffset = 6,
  autoFocus,
  tabIndex,
  onClear,
  onFocus,
  onBlur,
  ...ariaProps
}: ModernDatePickerProps) {
  // Safe date conversion
  const selectedDate = useMemo(
    () => parseSafeDate(value, formatPattern),
    [value, formatPattern]
  );

  const {
    open,
    setOpen,
    view,
    currentViewDate,
    setCurrentViewDate,
    toggleMonthYearView,
    selectMonth,
    navigateViewYear,
  } = useDatePickerState({
    value,
    minDate,
    maxDate,
    format: formatPattern,
  });

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (disabled || readOnly) return;
      setOpen(nextOpen);
    },
    [disabled, readOnly, setOpen]
  );

  const handleDateSelect = useCallback(
    (date: Date) => {
      const formatted = formatDateISO(date, formatPattern, locale);
      onChange(formatted);
      if (closeOnSelect) {
        setOpen(false);
      }
    },
    [formatPattern, locale, onChange, closeOnSelect, setOpen]
  );

  const handleClear = useCallback(() => {
    onChange(null);
    onClear?.();
    setOpen(false);
  }, [onChange, onClear, setOpen]);

  const handleInlineClearClick = useCallback(
    (e: React.MouseEvent<HTMLSpanElement>) => {
      e.stopPropagation();
      e.preventDefault();
      handleClear();
    },
    [handleClear]
  );

  const hasError = Boolean(error);
  const isInteractive = !disabled && !readOnly;

  return (
    <div className="relative w-full">
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            name={name}
            type="button"
            variant={variant}
            disabled={disabled}
            autoFocus={autoFocus}
            tabIndex={tabIndex}
            onFocus={onFocus}
            onBlur={onBlur}
            aria-invalid={hasError ? true : undefined}
            aria-required={required}
            aria-readonly={readOnly}
            aria-haspopup="dialog"
            aria-expanded={open}
            className={cn(
              'group flex w-full items-center justify-between border font-normal transition-all duration-200 select-none text-left',
              'bg-background text-foreground border-input hover:border-accent-foreground/30 hover:bg-accent/40',
              'focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none',
              getSizeClasses(size),
              clearable && selectedDate && isInteractive && 'pr-9',
              !value && 'text-muted-foreground',
              hasError && 'border-destructive ring-1 ring-destructive/30 text-destructive hover:border-destructive',
              disabled && 'opacity-60 cursor-not-allowed bg-muted/30 border-dashed pointer-events-none',
              readOnly && 'cursor-default bg-muted/20 hover:bg-muted/20 border-muted',
              className
            )}
            {...ariaProps}
          >
            <div className="flex min-w-0 items-center gap-2.5 overflow-hidden">
              <CalendarIcon className="h-4 w-4 shrink-0 text-primary opacity-80 group-hover:opacity-100 transition-opacity" />
              <span className="truncate">
                {selectedDate ? (
                  formatDisplayDate(selectedDate, displayPattern, locale)
                ) : (
                  <span>{placeholder}</span>
                )}
              </span>
            </div>
          </Button>
        </PopoverTrigger>

        {/* Inline Quick Clear Action */}
        {clearable && selectedDate && isInteractive && (
          <button
            type="button"
            aria-label="Clear selected date"
            onClick={handleInlineClearClick}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-primary focus:outline-none"
          >
            <ClearIcon className="h-3.5 w-3.5" />
          </button>
        )}

        <PopoverContent
          side={side}
          align={align}
          sideOffset={sideOffset}
          collisionPadding={{ top: 80, bottom: 24, left: 16, right: 16 }}
          avoidCollisions={true}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          className={cn(
            POP_CONTENT_CLASSES,
            'max-h-[calc(100vh-140px)] overflow-y-auto overscroll-contain z-[60]',
            popoverClassName
          )}
        >
          {/* Single-panel compact calendar */}
          <DatePickerCalendar
            selectedDate={selectedDate}
            currentViewDate={currentViewDate}
            setCurrentViewDate={setCurrentViewDate}
            onSelect={handleDateSelect}
            onClear={handleClear}
            minDate={minDate}
            maxDate={maxDate}
            isDateDisabled={isDateDisabled}
            locale={locale}
            weekStartsOn={weekStartsOn}
            showTodayButton={showTodayButton}
            showClearButton={showClearButton}
            view={view}
            onToggleView={toggleMonthYearView}
            onNavigateYear={navigateViewYear}
            onSelectMonth={selectMonth}
            yearRange={yearRange}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

// ─── Exported Component Wrapped in ErrorBoundary ──────────────────────────────

export function ModernDatePicker(props: ModernDatePickerProps) {
  return (
    <DatePickerErrorBoundary>
      <ModernDatePickerInner {...props} />
    </DatePickerErrorBoundary>
  );
}
