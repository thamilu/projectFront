import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Time Complexity: O(n) where n is number of class names
// Space Complexity: O(n) for merged string
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ---------------------------------------------------------------------------
// Formatter re-exports — canonical implementations live in lib/formatters.ts
// ---------------------------------------------------------------------------
export {
  formatCurrency,
  formatPrice,
  formatDate,
  formatDateTime,
  calculateDiscount,
  truncate as truncateText,
} from './formatters';

// ---------------------------------------------------------------------------
// DRY Utilities - Fetch, Error Handling, Tokens, API Client
// ---------------------------------------------------------------------------
export * from './utils';

// Token utilities
export {
  storeTokens,
  clearTokens,
  areTokensExpired,
  extractAccessToken,
  extractRefreshToken,
  extractTokenExpiry,
  extractTokenData,
  type TokenData,
} from './token-utils';

// ---------------------------------------------------------------------------
// Inventory helpers (unique to this module)
// ---------------------------------------------------------------------------

// Time Complexity: O(1)
export function isLowStock(quantity: number, threshold: number = 10): boolean {
  return quantity > 0 && quantity <= threshold;
}

// Time Complexity: O(1)
export function isOutOfStock(quantity: number): boolean {
  return quantity <= 0;
}

// ---------------------------------------------------------------------------
// String helpers (unique to this module)
// ---------------------------------------------------------------------------

// Time Complexity: O(1)
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

// Time Complexity: O(1)
export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

// Time Complexity: O(1)
export function generateOrderNumber(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `ORD-${timestamp}-${random}`;
}
