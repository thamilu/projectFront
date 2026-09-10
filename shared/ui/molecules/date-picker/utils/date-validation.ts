import { parseISO, isValid, format, parse, startOfDay, endOfDay, type Locale } from 'date-fns';
import { DEFAULT_DATE_FORMAT, DEFAULT_DISPLAY_FORMAT } from '../constants/date-picker.constants';
import type { DobValidationResult } from '../types/dob-picker.types';
import { parseISODateParts, isLeapYear, getDaysInMonth } from './date-format';

/**
 * Safely parses a Date object, ISO string ('yyyy-MM-dd'), or formatted string into a valid local Date.
 * Guarantees zero timezone-shifting bugs by explicitly constructing local midnight date coordinates.
 * Returns null for invalid, empty, or unparseable inputs.
 */
export function parseSafeDate(
  value: string | Date | null | undefined,
  customFormat?: string
): Date | null {
  if (value == null) return null;

  // 1. Direct Date instance handling
  if (value instanceof Date) {
    return isValid(value) ? startOfDay(value) : null;
  }

  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (!trimmed) return null;

  // 2. Fast local-timezone-safe parsing for canonical 'YYYY-MM-DD'
  const isoParts = parseISODateParts(trimmed);
  if (isoParts) {
    return new Date(isoParts.year, isoParts.month - 1, isoParts.day);
  }

  // 3. Custom format parsing if specified
  if (customFormat) {
    try {
      const parsedWithFormat = parse(trimmed, customFormat, new Date());
      if (isValid(parsedWithFormat)) {
        return startOfDay(parsedWithFormat);
      }
    } catch {
      // Fall through to ISO parser
    }
  }

  // 4. General ISO string parsing fallback
  try {
    const parsed = parseISO(trimmed);
    return isValid(parsed) ? startOfDay(parsed) : null;
  } catch {
    return null;
  }
}

/**
 * Formats a Date object to standard output format (defaults to 'yyyy-MM-dd').
 */
export function formatDateISO(
  date: Date,
  formatPattern: string = DEFAULT_DATE_FORMAT,
  locale?: Locale
): string {
  try {
    return format(date, formatPattern, { locale });
  } catch {
    return '';
  }
}

/**
 * Formats a Date object for user display inside the trigger button (defaults to 'PP').
 */
export function formatDisplayDate(
  date: Date,
  displayPattern: string = DEFAULT_DISPLAY_FORMAT,
  locale?: Locale
): string {
  try {
    return format(date, displayPattern, { locale });
  } catch {
    return '';
  }
}

/**
 * Checks if a date falls strictly within [minDate, maxDate] boundaries (inclusive, day-level).
 */
export function isDateInRange(
  date: Date,
  minDate?: Date | null,
  maxDate?: Date | null
): boolean {
  const d = startOfDay(date).getTime();

  if (minDate && isValid(minDate)) {
    const min = startOfDay(minDate).getTime();
    if (d < min) return false;
  }

  if (maxDate && isValid(maxDate)) {
    const max = endOfDay(maxDate).getTime();
    if (d > max) return false;
  }

  return true;
}

/**
 * Checks whether a specific date is disabled either by min/max boundaries or custom predicate.
 */
export function isDateDisabledCheck(
  date: Date,
  minDate?: Date | null,
  maxDate?: Date | null,
  isDateDisabled?: (date: Date) => boolean
): boolean {
  if (!isDateInRange(date, minDate, maxDate)) {
    return true;
  }

  if (isDateDisabled && typeof isDateDisabled === 'function') {
    try {
      return isDateDisabled(date);
    } catch (err) {
      console.error('Error in isDateDisabled predicate:', err);
      return false;
    }
  }

  return false;
}

/**
 * Checks if any day of a given month/year falls within [minDate, maxDate].
 */
export function isMonthInRange(
  year: number,
  monthIndex: number,
  minDate?: Date | null,
  maxDate?: Date | null
): boolean {
  const monthStart = new Date(year, monthIndex, 1);
  const monthEnd = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);

  if (minDate && isValid(minDate)) {
    const min = startOfDay(minDate).getTime();
    if (monthEnd.getTime() < min) return false;
  }

  if (maxDate && isValid(maxDate)) {
    const max = endOfDay(maxDate).getTime();
    if (monthStart.getTime() > max) return false;
  }

  return true;
}

/**
 * Checks if any day of a given year falls within [minDate, maxDate].
 */
export function isYearInRange(
  year: number,
  minDate?: Date | null,
  maxDate?: Date | null
): boolean {
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999);

  if (minDate && isValid(minDate)) {
    const min = startOfDay(minDate).getTime();
    if (yearEnd.getTime() < min) return false;
  }

  if (maxDate && isValid(maxDate)) {
    const max = endOfDay(maxDate).getTime();
    if (yearStart.getTime() > max) return false;
  }

  return true;
}

/**
 * Clamps a given date within minDate and maxDate bounds.
 */
export function clampDate(
  date: Date,
  minDate?: Date | null,
  maxDate?: Date | null
): Date {
  if (minDate && isValid(minDate) && date < startOfDay(minDate)) {
    return startOfDay(minDate);
  }
  if (maxDate && isValid(maxDate) && date > endOfDay(maxDate)) {
    return startOfDay(maxDate);
  }
  return date;
}

// ─── Exact Birthday-Aware Age Calculation & Boundary Derivation ───────────────

/**
 * Calculates exact elapsed age in completed solar years.
 * Correctly accounts for whether the birthdate has already occurred in the reference year.
 * Handles Feb 29 leap-day birthdays accurately.
 *
 * @param dob - Date of birth as ISODate ('YYYY-MM-DD') or Date
 * @param referenceDate - Reference date (defaults to today)
 * @returns Exact integer age (or -1 if invalid or in the future)
 */
export function calculateExactAge(
  dob: string | Date | null | undefined,
  referenceDate?: string | Date | null
): number {
  if (!dob) return -1;

  let dobYear: number, dobMonth: number, dobDay: number;

  if (dob instanceof Date) {
    if (!isValid(dob)) return -1;
    dobYear = dob.getFullYear();
    dobMonth = dob.getMonth() + 1;
    dobDay = dob.getDate();
  } else {
    const parts = parseISODateParts(dob);
    if (!parts) return -1;
    dobYear = parts.year;
    dobMonth = parts.month;
    dobDay = parts.day;
  }

  const ref = referenceDate ? (referenceDate instanceof Date ? referenceDate : parseSafeDate(referenceDate) ?? new Date()) : new Date();
  const refYear = ref.getFullYear();
  const refMonth = ref.getMonth() + 1;
  const refDay = ref.getDate();

  let age = refYear - dobYear;

  // Determine if birthday has occurred in refYear
  let hasBirthdayOccurred = false;
  if (refMonth > dobMonth) {
    hasBirthdayOccurred = true;
  } else if (refMonth === dobMonth) {
    // Leap day birthday special handling: on non-leap years, Feb 29 occurs on Feb 28 end-of-day / Mar 1
    if (dobMonth === 2 && dobDay === 29 && !isLeapYear(refYear)) {
      hasBirthdayOccurred = refDay >= 28;
    } else {
      hasBirthdayOccurred = refDay >= dobDay;
    }
  }

  if (!hasBirthdayOccurred) {
    age -= 1;
  }

  return age >= 0 ? age : -1;
}

/**
 * Derives valid calendar boundaries for Date of Birth based on minAge, maxAge, and maxDate.
 * Enforces:
 * - maxDate defaults to today (no future DOBs allowed).
 * - minAge (e.g. 18) sets effectiveMaxDate to (today - 18 years).
 * - maxAge (e.g. 120) sets effectiveMinDate to (today - 120 years).
 */
export function deriveDobBoundaries(options?: {
  minAge?: number;
  maxAge?: number;
  maxDate?: Date | null;
  minDate?: Date | null;
  referenceDate?: Date;
}): { effectiveMinDate: Date; effectiveMaxDate: Date } {
  const ref = options?.referenceDate ?? new Date();
  const refYear = ref.getFullYear();
  const refMonth = ref.getMonth();
  const refDay = ref.getDate();

  // Baseline ceiling: today or custom maxDate (whichever is earlier)
  let ceiling = startOfDay(ref);
  if (options?.maxDate && isValid(options.maxDate)) {
    const customMax = startOfDay(options.maxDate);
    if (customMax < ceiling) ceiling = customMax;
  }

  // Baseline floor: 120 years ago or custom minDate (whichever is later)
  const defaultFloorYear = refYear - (options?.maxAge ?? 120);
  let floor = new Date(defaultFloorYear, refMonth, refDay);
  if (options?.minDate && isValid(options.minDate)) {
    const customMin = startOfDay(options.minDate);
    if (customMin > floor) floor = customMin;
  }

  // Apply minAge constraint to effectiveMaxDate
  if (options?.minAge && options.minAge > 0) {
    const minAgeCutoffYear = refYear - options.minAge;
    // Handle leap day boundary
    const maxDayForMonth = getDaysInMonth(minAgeCutoffYear, refMonth + 1);
    const day = Math.min(refDay, maxDayForMonth);
    const minAgeDate = new Date(minAgeCutoffYear, refMonth, day);
    if (minAgeDate < ceiling) {
      ceiling = minAgeDate;
    }
  }

  // Apply maxAge constraint to effectiveMinDate
  if (options?.maxAge && options.maxAge > 0) {
    const maxAgeCutoffYear = refYear - options.maxAge;
    const maxDayForMonth = getDaysInMonth(maxAgeCutoffYear, refMonth + 1);
    const day = Math.min(refDay, maxDayForMonth);
    const maxAgeDate = new Date(maxAgeCutoffYear, refMonth, day);
    if (maxAgeDate > floor) {
      floor = maxAgeDate;
    }
  }

  return {
    effectiveMinDate: floor,
    effectiveMaxDate: ceiling,
  };
}

/**
 * Validates a DOB value against constraints and returns a structured result
 */
export function validateDob(
  dobISO: string | null | undefined,
  minAge?: number,
  maxAge?: number,
  maxDate?: Date | null
): DobValidationResult {
  if (!dobISO) {
    return { valid: false, error: 'Date of birth is required' };
  }

  const parts = parseISODateParts(dobISO);
  if (!parts) {
    return { valid: false, error: 'Invalid date format' };
  }

  const dobDate = new Date(parts.year, parts.month - 1, parts.day);
  const now = startOfDay(new Date());

  // Prohibit future dates
  const ceiling = maxDate ? startOfDay(maxDate) : now;
  if (dobDate > ceiling) {
    return { valid: false, error: 'Date of birth cannot be in the future' };
  }

  const age = calculateExactAge(dobISO, now);
  if (age < 0) {
    return { valid: false, error: 'Date of birth cannot be in the future' };
  }

  if (minAge !== undefined && age < minAge) {
    return {
      valid: false,
      age,
      error: `Must be at least ${minAge} years old (current: ${age})`,
    };
  }

  if (maxAge !== undefined && age > maxAge) {
    return {
      valid: false,
      age,
      error: `Age cannot exceed ${maxAge} years (current: ${age})`,
    };
  }

  return {
    valid: true,
    age,
  };
}
