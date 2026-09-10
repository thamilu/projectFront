'use client';

import React from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/shared/ui/atoms/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/atoms/tooltip';
import { useWishlist } from '@/features/wishlist/hooks/use-wishlist';
import { useI18n } from '@/core/i18n';

interface HeaderWishlistButtonProps {
  onClick: () => void;
}

export const HeaderWishlistButton = React.memo(function HeaderWishlistButton({
  onClick,
}: HeaderWishlistButtonProps) {
  const { t } = useI18n();
  const { items } = useWishlist();
  const count = items.length;

  const displayLabel =
    count === 1 ? t('header.aria.wishlistCountSingle') : t('header.aria.wishlistCountPlural');

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClick}
          aria-label={`${t('header.aria.wishlist')}, ${count} ${displayLabel}`}
          className="relative h-9 w-9 rounded-lg hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Heart className="h-5 w-5 text-foreground" />
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
      <TooltipContent>{t('header.aria.wishlist')}</TooltipContent>
    </Tooltip>
  );
});
