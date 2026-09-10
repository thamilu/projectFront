import { env } from '@/env';

// Previously hardcoded to 'en-US'/'USD' regardless of deployment config —
// on this app's actual default configuration (NEXT_PUBLIC_DEFAULT_CURRENCY
// defaults to INR), every caller that relied on these defaults instead of
// passing currency/locale explicitly (most product prices across the
// catalog — see FeaturedProductsSection, FlashDealsSection, the product
// detail page) rendered a literal "$" in front of an INR-denominated price.
// Reading from the already-validated, already-NEXT_PUBLIC_-safe env config
// here fixes every one of those call sites from this single definition,
// while still letting any caller override either value explicitly (as
// app/(customer)/cart/page.tsx and checkout/page.tsx already do).
const DEFAULT_LOCALE = env.NEXT_PUBLIC_DEFAULT_LOCALE;
const DEFAULT_CURRENCY = env.NEXT_PUBLIC_DEFAULT_CURRENCY;

export function formatCurrency(
  amount: number,
  currency: string = DEFAULT_CURRENCY,
  locale: string = DEFAULT_LOCALE
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Alias for formatCurrency as requested by generic components
export const formatPrice = formatCurrency;

export function formatNumber(value: number, locale: string = DEFAULT_LOCALE): string {
  return new Intl.NumberFormat(locale).format(value);
}

export function calculateDiscount(originalPrice: number, sellingPrice: number): number {
  if (!originalPrice || !sellingPrice || originalPrice <= sellingPrice) return 0;
  return Math.round(((originalPrice - sellingPrice) / originalPrice) * 100);
}

export function formatDate(
  dateString: string,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  },
  locale: string = DEFAULT_LOCALE
): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat(locale, options).format(date);
}

export function formatDateTime(dateString: string, locale: string = DEFAULT_LOCALE): string {
  return formatDate(
    dateString,
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
    locale
  );
}

/**
 * NOTE: `formatRelativeTime` deliberately lives in
 * `shared/utils/format-relative-time.ts`, not here. It is re-exported from
 * `shared/utils/index.ts` alongside these formatters, so consumers import both
 * from the same barrel — but the implementation stays in one file so the two
 * cannot diverge under one name.
 */
