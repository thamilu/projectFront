import React from 'react';
import type { Locale } from 'date-fns';

/**
 * ISO-8601 calendar date representation strictly in 'YYYY-MM-DD' format.
 * Prevents timezone offset shifts when dealing with historical dates (DOB) and delivery dates.
 */
export type ISODate = `${number}-${string}-${string}` | string;

/**
 * Metadata passed to the decoupled calendar `renderDayContent` slot
 */
export interface DayRenderInfo {
  /** Day number (1..31) */
  dayNumber: number;
  /** Whether this date falls inside the currently viewed month */
  isCurrentMonth: boolean;
  /** Whether this date is currently selected */
  isSelected: boolean;
  /** Whether this date is today */
  isToday: boolean;
  /** Whether this date is disabled by min/max boundaries or custom predicate */
  isDisabled: boolean;
  /** ISO date string for this day */
  isoDate: ISODate;
}

/**
 * Year range configuration specification
 */
export type YearRangeConfig =
  | { from?: number; to?: number }
  | { past?: number; future?: number };

/**
 * Size variants supported by DatePicker components
 */
export type DatePickerSize = 'sm' | 'default' | 'lg';

/**
 * Visual variant styles supported by DatePicker components
 */
export type DatePickerVariant = 'outline' | 'default' | 'ghost' | 'secondary';

/**
 * Generic calendar view mode
 */
export type CalendarViewMode = 'calendar' | 'month-year';

/**
 * Comprehensive enterprise-grade props interface for ModernDatePicker
 */
export interface ModernDatePickerProps extends React.AriaAttributes {
  /** Optional id attribute for DOM element referencing, labelling and focus */
  id?: string;

  /** Name attribute for HTML form submission compatibility */
  name?: string;

  /** Selected date in ISO format ('yyyy-MM-dd') or custom string / null */
  value?: string | null;

  /** Callback triggered when a date is selected or cleared */
  onChange: (date: string | null) => void;

  /** Placeholder text displayed when no date is selected */
  placeholder?: string;

  /** Disables trigger button and all calendar interactions */
  disabled?: boolean;

  /** Sets the picker into read-only mode (viewable but non-editable) */
  readOnly?: boolean;

  /** Mark the input as required in forms */
  required?: boolean;

  /** Error state flag or error message for validation feedback */
  error?: boolean | string;

  /** Additional trigger CSS class overrides */
  className?: string;

  /** Content wrapper CSS class overrides for popover panel */
  popoverClassName?: string;

  /** Minimum selectable date boundary (inclusive) */
  minDate?: Date | null;

  /** Maximum selectable date boundary (inclusive) */
  maxDate?: Date | null;

  /** Custom predicate to disable specific dates (e.g., weekends, holidays, blackout dates) */
  isDateDisabled?: (date: Date) => boolean;

  /** Custom day content renderer for slot badges, pricing, custom indicators */
  renderDayContent?: (date: Date, info: DayRenderInfo) => React.ReactNode;

  /** Custom accessible label generator for a specific day cell */
  getDayAriaLabel?: (date: Date, info: DayRenderInfo) => string;

  /** Date formatting string for internal ISO value emitted to onChange (default: 'yyyy-MM-dd') */
  format?: string;

  /** Display date format string for trigger button label (default: 'PP' e.g. "May 15, 2026") */
  displayFormat?: string;

  /** Optional date-fns Locale object for multi-language internationalization */
  locale?: Locale;

  /** Day index on which the week starts (0 = Sunday, 1 = Monday; default: 0) */
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;

  /** Configurable selectable year range or relative past/future year offsets */
  yearRange?: YearRangeConfig;

  /** Whether to show an inline clear button when a date is selected (default: true) */
  clearable?: boolean;

  /** Whether to show the 'Today' quick-jump button in calendar footer (default: true) */
  showTodayButton?: boolean;

  /** Whether to show the 'Clear' button in calendar footer (default: true) */
  showClearButton?: boolean;

  /** Automatically closes the popover when a day is selected (default: true) */
  closeOnSelect?: boolean;

  /** Control component visual size ('sm' | 'default' | 'lg') */
  size?: DatePickerSize;

  /** Visual styling variant */
  variant?: DatePickerVariant;

  /** Preferred popover placement side */
  side?: 'top' | 'right' | 'bottom' | 'left';

  /** Preferred popover alignment */
  align?: 'start' | 'center' | 'end';

  /** Popover offset from trigger in pixels (default: 6) */
  sideOffset?: number;

  /** Auto-focus trigger on initial mount */
  autoFocus?: boolean;

  /** Custom tabIndex for trigger button */
  tabIndex?: number;

  /** Callback invoked when clear action occurs */
  onClear?: () => void;

  /** Callback invoked on trigger focus */
  onFocus?: (e: React.FocusEvent<HTMLButtonElement>) => void;

  /** Callback invoked on trigger blur */
  onBlur?: (e: React.FocusEvent<HTMLButtonElement>) => void;
}

export * from './dob-picker.types';
export * from './delivery-picker.types';
