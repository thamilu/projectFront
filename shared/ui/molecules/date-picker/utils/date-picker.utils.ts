import {
  DEFAULT_YEAR_PAST,
  DEFAULT_YEAR_FUTURE,
} from '../constants/date-picker.constants';
import type { YearRangeConfig } from '../types/date-picker.types';

/**
 * Options for computing the selectable year array.
 */
export interface GenerateYearRangeOptions {
  yearRange?: YearRangeConfig;
  minDate?: Date | null;
  maxDate?: Date | null;
  pastYears?: number;
  futureYears?: number;
}

/**
 * Generates a descending array of years (e.g. [2046, 2045, ..., 1926]).
 * Accurately derives boundaries from minDate/maxDate or explicit year range configurations.
 */
export function generateYearRange(options?: GenerateYearRangeOptions): readonly number[] {
  const currentYear = new Date().getFullYear();

  let startYear = currentYear + (options?.futureYears ?? DEFAULT_YEAR_FUTURE);
  let endYear = currentYear - (options?.pastYears ?? DEFAULT_YEAR_PAST);

  // Handle explicit yearRange prop
  if (options?.yearRange) {
    if ('from' in options.yearRange || 'to' in options.yearRange) {
      if (options.yearRange.to != null) startYear = options.yearRange.to;
      if (options.yearRange.from != null) endYear = options.yearRange.from;
    } else if ('past' in options.yearRange || 'future' in options.yearRange) {
      if (options.yearRange.future != null) startYear = currentYear + options.yearRange.future;
      if (options.yearRange.past != null) endYear = currentYear - options.yearRange.past;
    }
  }

  // Constrain by minDate and maxDate boundaries if present
  if (options?.maxDate && !isNaN(options.maxDate.getTime())) {
    const maxYear = options.maxDate.getFullYear();
    startYear = Math.min(startYear, maxYear);
  }

  if (options?.minDate && !isNaN(options.minDate.getTime())) {
    const minYear = options.minDate.getFullYear();
    endYear = Math.max(endYear, minYear);
  }

  // Guard against inverted ranges
  if (startYear < endYear) {
    const temp = startYear;
    startYear = endYear;
    endYear = temp;
  }

  const length = Math.max(1, startYear - endYear + 1);
  return Array.from({ length }, (_, i) => startYear - i);
}

/**
 * Stable default year range for standard components.
 */
export const DEFAULT_YEAR_RANGE = generateYearRange();
