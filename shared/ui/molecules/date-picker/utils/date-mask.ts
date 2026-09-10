import type { ISODate } from '../types/date-picker.types';
import { buildISODate, parseISODateParts, getDaysInMonth } from './date-format';

export interface NormalizedDateResult {
  /** Display formatted string (e.g. '20/03/1996') */
  display: string;
  /** Valid canonical ISODate ('1996-03-20') if complete and valid, else null */
  iso: ISODate | null;
  /** Whether the string represents a complete and valid date */
  isComplete: boolean;
}

/**
 * Extracts only digits from any input string
 */
export function extractDigits(str: string): string {
  return str.replace(/\D/g, '');
}

/**
 * Formats a sequence of raw digits into masked 'DD/MM/YYYY' (or custom divider) format.
 * Automatically inserts slashes as the user enters digits without frustrating cursor jumps.
 */
export function formatMaskedDigits(
  rawDigits: string,
  delimiter: string = '/'
): { formatted: string; isComplete: boolean } {
  const digits = extractDigits(rawDigits).slice(0, 8); // Max 8 digits (DDMMYYYY)
  let formatted = '';

  if (digits.length === 0) {
    return { formatted: '', isComplete: false };
  }

  if (digits.length <= 2) {
    formatted = digits;
  } else if (digits.length <= 4) {
    formatted = `${digits.slice(0, 2)}${delimiter}${digits.slice(2)}`;
  } else {
    formatted = `${digits.slice(0, 2)}${delimiter}${digits.slice(2, 4)}${delimiter}${digits.slice(4)}`;
  }

  const isComplete = digits.length === 8;
  return { formatted, isComplete };
}

/**
 * Robust normalizer for typed or pasted date values across formats:
 * - '20-03-1996' (hyphen)
 * - '20.03.1996' (dot)
 * - '20/03/1996' (slash)
 * - '20031996'   (raw 8-digit DDMMYYYY)
 * - '1996-03-20' (ISO)
 */
export function normalizeDateInput(
  rawInput: string,
  delimiter: string = '/'
): NormalizedDateResult {
  if (!rawInput || typeof rawInput !== 'string') {
    return { display: '', iso: null, isComplete: false };
  }

  const trimmed = rawInput.trim();

  // 1. Direct ISO format check ('YYYY-MM-DD')
  const isoParts = parseISODateParts(trimmed);
  if (isoParts) {
    const dStr = String(isoParts.day).padStart(2, '0');
    const mStr = String(isoParts.month).padStart(2, '0');
    const yStr = String(isoParts.year).padStart(4, '0');
    const display = `${dStr}${delimiter}${mStr}${delimiter}${yStr}`;
    return {
      display,
      iso: buildISODate(isoParts.year, isoParts.month, isoParts.day),
      isComplete: true,
    };
  }

  // 2. Delimited check with /, -, or . (e.g. '20-03-1996', '20.03.1996', '20/03/1996')
  const delimitedMatch = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (delimitedMatch) {
    const day = parseInt(delimitedMatch[1], 10);
    const month = parseInt(delimitedMatch[2], 10);
    const year = parseInt(delimitedMatch[3], 10);

    if (month >= 1 && month <= 12 && day >= 1 && day <= getDaysInMonth(year, month)) {
      const dStr = String(day).padStart(2, '0');
      const mStr = String(month).padStart(2, '0');
      const yStr = String(year).padStart(4, '0');
      return {
        display: `${dStr}${delimiter}${mStr}${delimiter}${yStr}`,
        iso: buildISODate(year, month, day),
        isComplete: true,
      };
    }
  }

  // 3. Digits-only check (e.g. '20031996' or partial typing '2003')
  const digits = extractDigits(trimmed);
  const { formatted, isComplete } = formatMaskedDigits(digits, delimiter);

  if (isComplete && digits.length === 8) {
    const day = parseInt(digits.slice(0, 2), 10);
    const month = parseInt(digits.slice(2, 4), 10);
    const year = parseInt(digits.slice(4, 8), 10);

    if (
      year >= 1900 &&
      year <= 2100 &&
      month >= 1 &&
      month <= 12 &&
      day >= 1 &&
      day <= getDaysInMonth(year, month)
    ) {
      return {
        display: formatted,
        iso: buildISODate(year, month, day),
        isComplete: true,
      };
    }
  }

  return {
    display: formatted,
    iso: null,
    isComplete: false,
  };
}
