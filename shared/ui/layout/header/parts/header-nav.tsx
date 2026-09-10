'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/core/i18n';
import { cn } from '@/shared/utils';
import type { NavItem } from '../header.types';

interface HeaderNavProps {
  navItems: NavItem[];
  isDashboard: boolean;
}

export const HeaderNav = React.memo(function HeaderNav({
  navItems,
  isDashboard,
}: HeaderNavProps) {
  const pathname = usePathname();
  const { t } = useI18n();

  const getLocalizedLabel = (label: string) => {
    const norm = label.toLowerCase().trim();
    if (norm === 'products') {
      return t('header.nav.products');
    }
    if (norm === 'deals') {
      return t('header.nav.deals');
    }
    return label;
  };

  return (
    <nav className="hidden items-center gap-1.5 lg:flex" aria-label={t('header.aria.navigation')}>
      {/* Consumer nav shown on non-dashboard routes */}
      {!isDashboard &&
        navItems
          .filter((item) => {
            const label = item.label.toLowerCase().trim();
            return label !== 'wishlist' && label !== 'cart';
          })
          .map((item) => {
            const isActive =
              item.href.startsWith('#')
                ? false
                : item.href === '/'
                  ? pathname === '/'
                  : pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                )}
              >
                {getLocalizedLabel(item.label)}
              </Link>
            );
          })}

      {/* "Back to Shop" link shown on dashboard routes */}
      {isDashboard && (
        <Link
          href="/"
          className="rounded-md px-3 py-1.5 text-xs sm:text-sm font-medium text-muted-foreground hover:bg-muted/70 hover:text-foreground whitespace-nowrap transition-colors"
        >
          {t('header.nav.backToShop')}
        </Link>
      )}
    </nav>
  );
});
