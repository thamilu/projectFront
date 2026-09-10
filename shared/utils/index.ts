// ---------------------------------------------------------------------------
// DRY Utilities - Fetch, Error Handling, Tokens, API Client, cn(), formatters
// (formatters.ts's formatCurrency/formatPrice/formatDate/formatDateTime/
// calculateDiscount are re-exported transitively via this file's own
// `export * from './formatters'`.)
// ---------------------------------------------------------------------------
export * from './utils';

// ---------------------------------------------------------------------------
// String helpers (unique to this module)
// ---------------------------------------------------------------------------

// Time Complexity: O(1)
export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

// ---------------------------------------------------------------------------
// Session & Role utilities
// ---------------------------------------------------------------------------
export { extractRoles } from './session';

export { withErrorHandling } from './error-handler';
export { generateHomeMetadata } from './metadata';
export { warnOnce } from './dev-warning';
export * from './input-formatters';
export * from './logger';
export * from './error-utils';
export { getErrorMessage } from './get-error-message';
export * from './generate-id';
export { navigation } from './navigation';

// Money, Pricing, and Count utilities
export { toCents, fromCents, addMoney, multiplyMoney, formatMoney } from './money.utils';
export type { Cents } from './money.utils';
export { getDiscountPercentage } from './pricing.utils';
export { formatCount } from './format.utils';
export { formatRelativeTime } from './format-relative-time';
export { formatBadgeCount } from './format-badge-count';

// Path safety & URL Query utilities
export {
  validateId,
  validateSlug,
  validateHandle,
  validateSlugOrId,
  validateAlphanumeric,
} from './path-safety';
export { buildQueryString, buildSearchUrl } from './url-builder';
export type { ProductSearchParams } from './url-builder';
export * from './avatar';
