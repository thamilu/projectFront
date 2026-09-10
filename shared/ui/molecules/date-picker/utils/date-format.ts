import { format, parse, isValid, type Locale } from 'date-fns';
import type { ISODate } from '../types/date-picker.types';
import { DEFAULT_DISPLAY_FORMAT } from '../constants/date-picker.constants';

const ISO_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Checks if a given year is a leap year (Feb has 29 days)
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Gets the total number of days in a given calendar month (1 = January, 12 = December)
 */
export function getDaysInMonth(year: number, month: number): number {
  if (month < 1 || month > 12) return 0;
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  if ([4, 6, 9, 11].includes(month)) return 30;
  return 31;
}

/**
 * Safely decomposes an ISO date string ('YYYY-MM-DD') into integer components.
 * Returns null if the format is invalid or represents an impossible calendar date (e.g. 2026-02-31).
 */
export function parseISODateParts(
  iso: string | null | undefined
): { year: number; month: number; day: number } | null {
  if (!iso || typeof iso !== 'string') return null;
  const match = iso.trim().match(ISO_REGEX);
  if (!match) return null;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10); // 1-12
  const day = parseInt(match[3], 10); // 1-31

  if (year < 1000 || year > 9999 || month < 1 || month > 12) return null;
  const maxDay = getDaysInMonth(year, month);
  if (day < 1 || day > maxDay) return null;

  return { year, month, day };
}

/**
 * Constructs a canonical 'YYYY-MM-DD' ISO date string from numeric coordinates.
 */
export function buildISODate(year: number, month: number, day: number): ISODate {
  const y = String(year).padStart(4, '0');
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns today's date formatted as canonical ISODate ('YYYY-MM-DD') in the local environment.
 */
export function todayISODate(): ISODate {
  const now = new Date();
  return buildISODate(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

/**
 * Adds an integer number of days to an ISODate, correctly handling month and year rollovers.
 */
export function addDaysISO(iso: ISODate, days: number): ISODate {
  const parts = parseISODateParts(iso);
  if (!parts) return iso;
  const d = new Date(parts.year, parts.month - 1, parts.day + days);
  return buildISODate(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

/**
 * Formats an ISODate string for display (e.g. '1996-03-20' -> '20/03/1996' or 'Mar 20, 1996')
 * Guarantees zero timezone-shifting bugs.
 */
export function formatISODateToDisplay(
  iso: ISODate | string | null | undefined,
  displayPattern: string = DEFAULT_DISPLAY_FORMAT,
  locale?: Locale
): string {
  const parts = parseISODateParts(iso);
  if (!parts) return '';

  const localDate = new Date(parts.year, parts.month - 1, parts.day);
  try {
    return format(localDate, displayPattern, { locale });
  } catch {
    return '';
  }
}

/**
 * Safely parses a display string (e.g. '20/03/1996') into a canonical ISODate ('1996-03-20').
 */
export function parseDisplayToISO(
  displayStr: string | null | undefined,
  displayPattern: string = 'dd/MM/yyyy'
): ISODate | null {
  if (!displayStr || typeof displayStr !== 'string') return null;
  const trimmed = displayStr.trim();
  if (!trimmed) return null;

  try {
    const parsed = parse(trimmed, displayPattern, new Date());
    if (isValid(parsed)) {
      const year = parsed.getFullYear();
      const month = parsed.getMonth() + 1;
      const day = parsed.getDate();
      // Double check sanity against month length
      if (day <= getDaysInMonth(year, month)) {
        return buildISODate(year, month, day);
      }
    }
  } catch {
    // Fall through
  }
  return null;
}
