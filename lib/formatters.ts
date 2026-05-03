const DEFAULT_LOCALE = 'en-US';
const DEFAULT_CURRENCY = 'USD';

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

export function formatNumber(
  value: number,
  locale: string = DEFAULT_LOCALE
): string {
  return new Intl.NumberFormat(locale).format(value);
}

export function formatCompactNumber(
  value: number,
  locale: string = DEFAULT_LOCALE
): string {
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatPercentage(
  value: number,
  decimals: number = 1,
  locale: string = DEFAULT_LOCALE
): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
}

export function calculateDiscount(
  originalPrice: number,
  sellingPrice: number
): number {
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

export function formatDateTime(
  dateString: string,
  locale: string = DEFAULT_LOCALE
): string {
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

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  }

  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  }

  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  }

  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  }

  return formatDate(dateString, { month: 'short', day: 'numeric' });
}

export function formatOrderNumber(orderNumber: string): string {
  return orderNumber.toUpperCase();
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}
