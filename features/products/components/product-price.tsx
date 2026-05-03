/**
 * ProductPrice Component
 * Displays product pricing with proper i18n support and accessibility
 */

import { cn } from '@/lib/utils';

interface ProductPriceProps {
  price: number;
  discountPrice?: number;
  currency?: string;
  locale?: string;
  className?: string;
}

export function ProductPrice({
  price,
  discountPrice,
  currency = 'INR',
  locale = 'en-IN',
  className,
}: ProductPriceProps) {
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const priceLabel = discountPrice
    ? `${formatter.format(discountPrice)}, reduced from ${formatter.format(price)}`
    : formatter.format(price);

  if (!discountPrice) {
    return (
      <span
        className={cn('text-lg font-bold text-primary', className)}
        aria-label={priceLabel}
      >
        {formatter.format(price)}
      </span>
    );
  }

  return (
    <div className={cn('flex items-baseline gap-2', className)} aria-label={priceLabel}>
      <span className="text-lg font-bold text-primary" aria-hidden="true">
        {formatter.format(discountPrice)}
      </span>
      <del className="text-sm text-muted-foreground" aria-hidden="true">
        {formatter.format(price)}
      </del>
    </div>
  );
}
