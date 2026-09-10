'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Calendar as CalendarIcon, X as ClearIcon, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/atoms/popover';
import { cn } from '@/shared/utils';
import { DatePickerCalendar } from '../DatePickerCalendar';
import { DatePickerFooter } from '../components/DatePickerFooter';
import { useDateInputMask } from '../hooks/useDateInputMask';
import { parseISODateParts, buildISODate } from '../utils/date-format';
import { deriveDobBoundaries, calculateExactAge, validateDob } from '../utils/date-validation';
import { POP_CONTENT_CLASSES, DOB_DEFAULT_INPUT_FORMAT } from '../constants/date-picker.constants';
import type { DateOfBirthPickerProps } from '../types/dob-picker.types';

export function DateOfBirthPicker({
  id,
  name,
  value,
  onChange,
  onAgeChange,
  placeholder = 'DD / MM / YYYY',
  inputFormat = DOB_DEFAULT_INPUT_FORMAT,
  disabled = false,
  readOnly = false,
  required = false,
  error,
  className,
  popoverClassName,
  minAge,
  maxAge,
  minDate,
  maxDate,
  showAgeBadge = true,
  formatAgeBadge,
  clearable = true,
  locale,
  weekStartsOn = 1,
  // Accepted for API-shape parity with the other date-picker variants; this
  // one renders a fixed-size input rather than a size/variant-driven trigger.
  size: _size = 'default',
  variant: _variant = 'outline',
  autoFocus,
  tabIndex,
  onClear,
  onFocus,
  onBlur,
  ...ariaProps
}: DateOfBirthPickerProps) {
  const [open, setOpen] = useState(false);

  // Derive DOB calendar boundaries (e.g. minAge = 18 derives effectiveMaxDate = today - 18y)
  const { effectiveMinDate, effectiveMaxDate } = useMemo(() => {
    return deriveDobBoundaries({ minAge, maxAge, maxDate, minDate });
  }, [minAge, maxAge, maxDate, minDate]);

  // Direct keyboard input mask hook
  const {
    displayText,
    validationResult,
    handleInputChange,
    handlePaste,
    handleClearInput,
  } = useDateInputMask({
    value,
    onChange,
    onAgeChange,
    minAge,
    maxAge,
    maxDate: effectiveMaxDate,
    inputFormat,
    disabled,
    readOnly,
  });

  // Draft date state for popover selection (Cancel reverts, Apply commits)
  const [draftDate, setDraftDate] = useState<Date | null>(() => {
    const parts = parseISODateParts(value);
    return parts ? new Date(parts.year, parts.month - 1, parts.day) : null;
  });

  // Active viewing date for calendar month/year
  const [currentViewDate, setCurrentViewDate] = useState<Date>(() => {
    const parts = parseISODateParts(value);
    if (parts) return new Date(parts.year, parts.month - 1, parts.day);
    return effectiveMaxDate; // Default to the latest selectable date (e.g. 18 years ago if minAge=18)
  });

  // Sync draft and viewing date when popover opens or value changes
  useEffect(() => {
    if (value) {
      const parts = parseISODateParts(value);
      if (parts) {
        const d = new Date(parts.year, parts.month - 1, parts.day);
        setDraftDate(d);
        setCurrentViewDate(d);
        return;
      }
    }
    setDraftDate(null);
    setCurrentViewDate(effectiveMaxDate);
  }, [value, effectiveMaxDate, open]);

  // Draft age calculation
  const draftAge = useMemo(() => {
    if (!draftDate) return -1;
    const iso = buildISODate(
      draftDate.getFullYear(),
      draftDate.getMonth() + 1,
      draftDate.getDate()
    );
    return calculateExactAge(iso);
  }, [draftDate]);

  const isDraftValid = useMemo(() => {
    if (!draftDate) return false;
    const iso = buildISODate(
      draftDate.getFullYear(),
      draftDate.getMonth() + 1,
      draftDate.getDate()
    );
    const res = validateDob(iso, minAge, maxAge, effectiveMaxDate);
    return res.valid;
  }, [draftDate, minAge, maxAge, effectiveMaxDate]);

  // Selection inside calendar sets draft date
  const handleCalendarSelect = useCallback(
    (date: Date) => {
      setDraftDate(date);
      setCurrentViewDate(date);
    },
    []
  );

  // Apply commits draft date to parent form
  const handleApply = useCallback(() => {
    if (draftDate && isDraftValid) {
      const iso = buildISODate(
        draftDate.getFullYear(),
        draftDate.getMonth() + 1,
        draftDate.getDate()
      );
      onChange(iso);
    }
    setOpen(false);
  }, [draftDate, isDraftValid, onChange]);

  // Cancel reverts draft state
  const handleCancel = useCallback(() => {
    const parts = parseISODateParts(value);
    setDraftDate(parts ? new Date(parts.year, parts.month - 1, parts.day) : null);
    setOpen(false);
  }, [value]);

  const handleClear = useCallback(() => {
    handleClearInput();
    setDraftDate(null);
    onClear?.();
    setOpen(false);
  }, [handleClearInput, onClear]);

  const hasError = Boolean(error) || (validationResult.valid === false && Boolean(validationResult.error));
  const errorMessage = typeof error === 'string' ? error : validationResult.error;

  // Render age badge text
  const currentAge = validationResult.age ?? draftAge;
  const ageBadgeText = useMemo(() => {
    if (currentAge < 0) return null;
    if (formatAgeBadge) return formatAgeBadge(currentAge);
    return `Age: ${currentAge} years`;
  }, [currentAge, formatAgeBadge]);

  return (
    <div className={cn('relative w-full', className)}>
      <Popover open={open} onOpenChange={(next) => !disabled && !readOnly && setOpen(next)}>
        {/* ── Input Container with Icon and Inline Clear ────────────────── */}
        <div
          className={cn(
            'group relative flex h-[42px] w-full items-center rounded-lg border border-input bg-background text-foreground transition-all',
            'hover:border-accent-foreground/30 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20',
            hasError && 'border-destructive text-destructive focus-within:border-destructive focus-within:ring-destructive/20',
            disabled && 'cursor-not-allowed bg-muted/40 opacity-60'
          )}
        >
          {/* Left Interactive Calendar Popover Trigger Button */}
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={disabled || readOnly}
              aria-label="Open date of birth calendar"
              className="flex h-full items-center pl-3 pr-1 text-muted-foreground hover:text-primary transition-colors focus-visible:outline-none cursor-pointer disabled:cursor-not-allowed"
            >
              <CalendarIcon className="h-4 w-4 shrink-0 text-primary opacity-80 group-hover:opacity-100 transition-opacity" />
            </button>
          </PopoverTrigger>

          {/* Masked Keyboard Input Field */}
          <input
            id={id}
            name={name}
            type="text"
            inputMode="numeric"
            value={displayText}
            onChange={handleInputChange}
            onPaste={handlePaste}
            onFocus={onFocus}
            onBlur={onBlur}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readOnly}
            required={required}
            autoFocus={autoFocus}
            tabIndex={tabIndex}
            aria-invalid={hasError ? true : undefined}
            aria-required={required}
            aria-readonly={readOnly}
            aria-describedby={hasError && id ? `${id}-error` : undefined}
            className="flex-1 bg-transparent px-2 text-sm font-medium text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
            {...ariaProps}
          />

          {/* Right Action: Inline Clear Button Only */}
          {clearable && displayText && !disabled && !readOnly && (
            <div className="flex items-center pr-2.5">
              <button
                type="button"
                aria-label="Clear date of birth"
                onClick={handleClear}
                className="flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus:outline-none"
              >
                <ClearIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Inline Age Badge (When valid and configured) */}
        {showAgeBadge && validationResult.valid && ageBadgeText && (
          <div className="mt-1 flex items-center gap-1.5 pl-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
              <Check className="h-3 w-3 shrink-0" />
              {ageBadgeText}
            </span>
          </div>
        )}

        {/* Error Feedback Message */}
        {hasError && errorMessage && (
          <p
            id={id ? `${id}-error` : undefined}
            role="alert"
            className="mt-1 text-xs font-semibold text-destructive pl-1 animate-in fade-in-50"
          >
            {errorMessage}
          </p>
        )}

        {/* ── Popover Panel with Direct Month & Year Dropdowns ─────────── */}
        <PopoverContent
          side="bottom"
          align="start"
          sideOffset={6}
          avoidCollisions={true}
          collisionPadding={16}
          className={cn(POP_CONTENT_CLASSES, popoverClassName)}
        >
          <div className="flex flex-col">
            {/* Popover Header Title */}
            <div className="mb-2 px-1 text-xs font-bold tracking-tight text-foreground">
              Select date of birth
            </div>

            {/* Calendar with Direct Month & Year Dropdown Selectors */}
            <DatePickerCalendar
              selectedDate={draftDate}
              currentViewDate={currentViewDate}
              setCurrentViewDate={setCurrentViewDate}
              onSelect={handleCalendarSelect}
              minDate={effectiveMinDate}
              maxDate={effectiveMaxDate}
              locale={locale}
              weekStartsOn={weekStartsOn}
              showMonthYearDropdowns={true}
            />

            {/* Action Footer: Age badge + Cancel & Apply */}
            <DatePickerFooter
              leftContent={
                draftAge >= 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                    <Check className="h-3 w-3 shrink-0" />
                    Age: {draftAge} years
                  </span>
                ) : undefined
              }
              showCancelApply={true}
              isApplyDisabled={!draftDate || !isDraftValid}
              onCancel={handleCancel}
              onApply={handleApply}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
