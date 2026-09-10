/**
 * shared/utils/formatters.ts unit tests.
 *
 * Previously this file was a placeholder (`expect(true).toBe(true)`) — green
 * in CI while testing nothing about formatCurrency/formatPrice/formatDate,
 * despite them being used across most of the product catalog's price
 * displays. This also locks in the fix to formatCurrency's own defaults:
 * they were hardcoded to 'USD'/'en-US' regardless of deployment config, so
 * every caller relying on the default (not passing currency/locale
 * explicitly) rendered a literal "$" in front of what should have been an
 * INR-denominated price on this app's actual (INR-default) configuration.
 */
import {
  formatCurrency,
  formatPrice,
  formatNumber,
  calculateDiscount,
  formatDate,
  formatDateTime,
} from '@/shared/utils/formatters';

describe('formatCurrency', () => {
  it('defaults to the configured currency and locale (INR/en-IN in this test environment), not a hardcoded USD/en-US', () => {
    expect(formatCurrency(1000)).toBe('₹1,000');
  });

  it('accepts an explicit currency override', () => {
    expect(formatCurrency(1000, 'USD', 'en-US')).toBe('$1,000');
  });

  it('formats zero and negative amounts without throwing', () => {
    expect(formatCurrency(0)).toContain('0');
    expect(formatCurrency(-50)).toContain('50');
  });
});

describe('formatPrice (alias for formatCurrency)', () => {
  it('is the same function as formatCurrency', () => {
    expect(formatPrice).toBe(formatCurrency);
  });

  it('formats a plain product price using the configured defaults', () => {
    expect(formatPrice(499)).toBe('₹499');
  });
});

describe('formatNumber', () => {
  it('formats a number using the default locale grouping', () => {
    expect(formatNumber(1234567)).toBe('12,34,567');
  });

  it('accepts an explicit locale override', () => {
    expect(formatNumber(1234567, 'en-US')).toBe('1,234,567');
  });
});

describe('calculateDiscount', () => {
  it('computes the percentage discount between two prices', () => {
    expect(calculateDiscount(100, 75)).toBe(25);
  });

  it('returns 0 when there is no real discount', () => {
    expect(calculateDiscount(100, 100)).toBe(0);
    expect(calculateDiscount(100, 120)).toBe(0);
  });

  it('returns 0 for missing or zero inputs instead of throwing', () => {
    expect(calculateDiscount(0, 50)).toBe(0);
    expect(calculateDiscount(100, 0)).toBe(0);
  });
});

describe('formatDate', () => {
  it('formats an ISO date string using the default locale', () => {
    expect(formatDate('2026-01-15T00:00:00.000Z')).toMatch(/2026/);
  });

  it('accepts custom Intl.DateTimeFormatOptions', () => {
    const result = formatDate('2026-01-15T00:00:00.000Z', { year: 'numeric' });
    expect(result).toBe('2026');
  });
});

describe('formatDateTime', () => {
  it('formats an ISO date string including the time', () => {
    const result = formatDateTime('2026-01-15T10:30:00.000Z');
    expect(result).toMatch(/2026/);
  });
});
