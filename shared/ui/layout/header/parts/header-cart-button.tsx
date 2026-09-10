'use client';

import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/shared/ui/atoms/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/atoms/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/atoms/popover';
import { useCart } from '@/features/cart/hooks/use-cart';
import CartPreview from '../../cart-preview';
import { useI18n } from '@/core/i18n';
import { APP_ROUTES } from '@/shared/routes';

interface HeaderCartButtonProps {
  isUserAuthenticated: boolean;
  mounted: boolean;
  onProtectedNavigate: (href: string, target: 'cart') => void;
}

export const HeaderCartButton = React.memo(function HeaderCartButton({
  isUserAuthenticated,
  mounted,
  onProtectedNavigate,
}: HeaderCartButtonProps) {
  const { t } = useI18n();
  const { itemCount: count } = useCart();

  const displayLabel =
    count === 1 ? t('header.aria.cartCountSingle') : t('header.aria.cartCountPlural');

  const buttonContent = (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`${t('header.aria.cart')}, ${count} ${displayLabel}`}
      className="relative h-9 w-9 rounded-lg hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary"
    >
      <ShoppingCart className="h-5 w-5 text-foreground" />
      {count > 0 && (
        <span
          className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shadow-xs animate-in zoom-in-50"
          aria-hidden="true"
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Button>
  );

  if (mounted && isUserAuthenticated) {
    return (
      <Popover>
        <PopoverTrigger asChild>{buttonContent}</PopoverTrigger>
        <PopoverContent className="p-0" align="end">
          <CartPreview />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onProtectedNavigate(APP_ROUTES.CART, 'cart')}
          aria-label={`${t('header.aria.cart')}, ${count} ${displayLabel}`}
          className="relative h-9 w-9 rounded-lg hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ShoppingCart className="h-5 w-5 text-foreground" />
          {count > 0 && (
            <span
              className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shadow-xs animate-in zoom-in-50"
              aria-hidden="true"
            >
              {count > 99 ? '99+' : count}
            </span>
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{t('header.aria.cart')}</TooltipContent>
    </Tooltip>
  );
});
