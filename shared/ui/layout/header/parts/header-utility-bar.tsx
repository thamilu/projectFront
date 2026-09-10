'use client';

import React from 'react';
import Link from 'next/link';
import { LanguageSwitcher } from '@/shared/ui/common/language-switcher';
import { UTILITY_NAV_LINKS } from '@/domains/navigation/config/header-navigation.config';
import type { NavigationViewModel } from '@/domains/navigation/contracts/navigation.types';

interface HeaderUtilityBarProps {
  navModel: NavigationViewModel;
  mounted: boolean;
  onBusinessClick?: (href: string) => void;
}

export const HeaderUtilityBar = React.memo(function HeaderUtilityBar({
  navModel,
  mounted,
  onBusinessClick,
}: HeaderUtilityBarProps) {
  const primaryBusinessAction = navModel.businessActions[0];
  const secondaryBusinessAction = navModel.businessActions[1];

  return (
    <div className="hidden border-b border-border/40 bg-muted/20 lg:block">
      <div className="container mx-auto flex h-8 items-center justify-between px-4 text-xs font-medium text-muted-foreground md:px-6">
        {/* Left Utility Links: Help & Support | Track Order | Returns */}
        <div className="flex items-center gap-4">
          {UTILITY_NAV_LINKS.map((link) => (
            <Link
              key={link.id}
              href={link.href}
              className="flex items-center gap-1.5 transition-colors hover:text-foreground"
            >
              {link.Icon && <link.Icon className="h-3 w-3 text-muted-foreground" />}
              <span>{link.label}</span>
            </Link>
          ))}
        </div>

        {/* Right Utility Actions: Sell on eShop | Become a Delivery Partner | Language/Currency */}
        <div className="flex items-center gap-4">
          {mounted && primaryBusinessAction && (
            <Link
              href={primaryBusinessAction.href}
              onClick={(e) => {
                if (!navModel.isUserAuthenticated && onBusinessClick) {
                  e.preventDefault();
                  onBusinessClick(primaryBusinessAction.href);
                }
              }}
              className="flex items-center gap-1.5 font-semibold text-primary transition-colors hover:text-primary/80"
            >
              {primaryBusinessAction.Icon && (
                <primaryBusinessAction.Icon className="h-3.5 w-3.5 text-primary" />
              )}
              <span>{primaryBusinessAction.label}</span>
            </Link>
          )}

          {mounted && secondaryBusinessAction && (
            <Link
              href={secondaryBusinessAction.href}
              onClick={(e) => {
                if (!navModel.isUserAuthenticated && onBusinessClick) {
                  e.preventDefault();
                  onBusinessClick(secondaryBusinessAction.href);
                }
              }}
              className="hidden xl:flex items-center gap-1.5 font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {secondaryBusinessAction.Icon && (
                <secondaryBusinessAction.Icon className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <span>{secondaryBusinessAction.label}</span>
            </Link>
          )}

          <div className="flex items-center border-l border-border/40 pl-3">
            <LanguageSwitcher variant="compact" showCurrency currency="INR" />
          </div>
        </div>
      </div>
    </div>
  );
});
