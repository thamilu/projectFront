'use client';

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { cn } from '@/shared/utils';
import { Button } from '@/shared/ui/atoms/button';
import { useI18n } from '@/core/i18n';
import { usePermissions } from '@/features/auth/hooks/use-permissions';
import { useMediaQuery } from '@/shared/hooks/use-media-query';
import { useReducedMotion } from '@/shared/hooks/use-reduced-motion';
import { trackEvent } from '@/core/providers/analytics-provider';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/shared/ui/atoms/tooltip';
import { getSellerNavigation, getSellerBottomNavigation, NavItem } from '../../config/navigation';

export interface SellerSidebarProps {
  /**
   * Tracks if the sidebar drawer is open on mobile overlays.
   */
  isOpen?: boolean;
  /**
   * Callback fired to close the sidebar drawer on mobile overlays.
   */
  onClose?: () => void;
}

/**
 * Pathname active check matching helper.
 *
 * @param pathname - Current Next.js pathname
 * @param itemHref - Target navigation link URL
 * @param matchPrefix - True if matching subpaths starting with itemHref
 */
export function isNavItemActive(pathname: string, itemHref: string, matchPrefix = true): boolean {
  if (pathname === itemHref) return true;
  if (matchPrefix && pathname.startsWith(`${itemHref}/`)) return true;
  return false;
}

/**
 * SellerSidebar — Responsive side navigation drawer/aside chrome for the Seller Center context.
 * Refactored to meet Ultra Enterprise requirements.
 */
export const SellerSidebar = memo(function SellerSidebar({
  isOpen = false,
  onClose,
}: SellerSidebarProps = {}): React.JSX.Element {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const { hasPermission } = usePermissions();

  const isMobile = useMediaQuery('(max-width: 767px)');
  const prefersReducedMotion = useReducedMotion();

  // Local storage persistence for collapse state (desktop only)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('seller-sidebar-collapsed') === 'true';
  });

  // Safe pathname fallback checking
  const safePathname = useMemo(() => {
    if (!pathname) {
      console.warn('SellerSidebar: usePathname returned null, falling back to empty string');
    }
    return pathname ?? '';
  }, [pathname]);

  // Load configurable nav items, filtering by dynamic permissions checks
  const navItems = useMemo(() => getSellerNavigation(hasPermission), [hasPermission]);
  const bottomNavItems = useMemo(() => getSellerBottomNavigation(), []);

  // Flattened nav list for roving tab index sequence logic
  const allItems = useMemo(() => [...navItems, ...bottomNavItems], [navItems, bottomNavItems]);

  // Derive which element should receive active tab index on initial load
  const activeIndex = useMemo(() => {
    const idx = allItems.findIndex((item) =>
      isNavItemActive(safePathname, item.href, item.matchSubpaths !== false)
    );
    return idx !== -1 ? idx : 0;
  }, [allItems, safePathname]);

  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const tabTargetIndex = focusedIndex !== null ? focusedIndex : activeIndex;

  // Toggle Collapse on Desktop
  const handleToggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('seller-sidebar-collapsed', String(next));
      trackEvent('seller_sidebar_toggle', { collapsed: next });
      return next;
    });
  }, []);

  // Handle Toggle or Mobile close click
  const handleToggleClick = useCallback(() => {
    if (isMobile && onClose) {
      trackEvent('seller_sidebar_mobile_close', {});
      onClose();
    } else {
      handleToggleCollapse();
    }
  }, [isMobile, onClose, handleToggleCollapse]);

  // Item click analytics
  const handleItemClick = useCallback((item: NavItem, isBottom: boolean) => {
    trackEvent('seller_sidebar_click', {
      title: item.defaultTitle,
      href: item.href,
      section: isBottom ? 'bottom' : 'main',
    });
  }, []);

  // Roving Tab Index handlers
  const handleItemFocus = useCallback((index: number) => {
    setFocusedIndex(index);
  }, []);

  const handleItemKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLAnchorElement>, index: number) => {
      let targetIndex: number | null = null;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        targetIndex = (index + 1) % allItems.length;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        targetIndex = (index - 1 + allItems.length) % allItems.length;
      } else if (e.key === 'Home') {
        e.preventDefault();
        targetIndex = 0;
      } else if (e.key === 'End') {
        e.preventDefault();
        targetIndex = allItems.length - 1;
      }

      if (targetIndex !== null) {
        const targetElement = document.querySelector(
          `[data-sidebar-link-index="${targetIndex}"]`
        ) as HTMLElement | null;
        targetElement?.focus();
      }
    },
    [allItems.length]
  );

  // Global keyboard shortcuts listeners
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        // Toggle Sidebar: Cmd/Ctrl + B
        if (e.key.toLowerCase() === 'b') {
          e.preventDefault();
          setIsCollapsed((prev) => {
            const next = !prev;
            localStorage.setItem('seller-sidebar-collapsed', String(next));
            trackEvent('seller_sidebar_shortcut_toggle', { collapsed: next });
            return next;
          });
        }

        // Quick Navigation: Cmd/Ctrl + [1-6]
        const num = parseInt(e.key, 10);
        if (!isNaN(num) && num >= 1 && num <= navItems.length) {
          e.preventDefault();
          const targetItem = navItems[num - 1];
          if (targetItem) {
            trackEvent('seller_sidebar_shortcut_navigate', {
              title: targetItem.defaultTitle,
              href: targetItem.href,
            });
            router.push(targetItem.href);
          }
        }
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [router, navItems]);

  const sidebarWidthClass = isCollapsed ? 'w-20' : 'w-64';
  const transitionClass = prefersReducedMotion ? '' : 'transition-[width] duration-300 ease-in-out';

  const toggleLabel = isMobile
    ? t('seller.sidebar.close')
    : isCollapsed
    ? t('seller.sidebar.expand')
    : t('seller.sidebar.collapse');

  return (
    <TooltipProvider>
      <aside
        id="seller-sidebar"
        aria-label={t('seller.sidebar.panelLabel')}
        suppressHydrationWarning
        className={cn(
          'bg-background h-full border-r relative flex flex-col',
          sidebarWidthClass,
          transitionClass
        )}
      >
        {/* Skip Navigation Landmark Link */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-md focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          {t('seller.sidebar.skipToMain')}
        </a>

        {/* Header/Collapse Action with Animation and Tooltip */}
        <div className={cn("flex p-2 border-b border-border/40 transition-all duration-300", isCollapsed ? "justify-center" : "justify-end")}>
          <Tooltip delayDuration={150}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleClick}
                className="h-10 w-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-transform duration-300 ease-in-out hover:scale-105 active:scale-95"
                aria-label={toggleLabel}
                aria-expanded={isMobile ? isOpen : !isCollapsed}
                aria-controls="seller-sidebar"
              >
                {isMobile ? (
                  <X className="h-4 w-4" />
                ) : isCollapsed ? (
                  <PanelLeftOpen className="h-4.5 w-4.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200" />
                ) : (
                  <PanelLeftClose className="h-4.5 w-4.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-semibold text-xs py-1.5 px-3">
              {toggleLabel}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Main Navigation Section */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          <nav role="navigation" aria-label={t('seller.sidebar.panelLabel')} className="space-y-1">
            {(() => {
              let currentGroup: string | undefined = undefined;
              return navItems.map((item, idx) => {
                const showHeader = !isCollapsed && item.group && item.group !== 'Dashboard' && item.group !== 'Settings' && item.group !== currentGroup;
                const showDivider = isCollapsed && item.group && item.group !== 'Dashboard' && item.group !== 'Settings' && currentGroup && item.group !== currentGroup;
                currentGroup = item.group;
                return (
                  <React.Fragment key={item.href}>
                    {showHeader && (
                      <div className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-4 mb-1.5 px-3 select-none">
                        {item.group}
                      </div>
                    )}
                    {showDivider && (
                      <div className="my-2 border-t border-border/40 mx-2" aria-hidden="true" />
                    )}
                    <NavLink
                      index={idx}
                      item={item}
                      isActive={isNavItemActive(safePathname, item.href, item.matchSubpaths !== false)}
                      isCollapsed={isCollapsed}
                      isTabTarget={idx === tabTargetIndex}
                      prefersReducedMotion={prefersReducedMotion}
                      onFocus={() => handleItemFocus(idx)}
                      onKeyDown={(e) => handleItemKeyDown(e, idx)}
                      onClick={() => handleItemClick(item, false)}
                    />
                  </React.Fragment>
                );
              });
            })()}
          </nav>
        </div>

        {/* Bottom Utility Navigation Section */}
        <div className="space-y-1 border-t border-border/80 p-3 bg-background/50">
          {bottomNavItems.map((item, idx) => {
            const globalIdx = navItems.length + idx;
            return (
              <NavLink
                key={item.href}
                index={globalIdx}
                item={item}
                isActive={isNavItemActive(safePathname, item.href, item.matchSubpaths !== false)}
                isCollapsed={isCollapsed}
                isTabTarget={globalIdx === tabTargetIndex}
                prefersReducedMotion={prefersReducedMotion}
                onFocus={() => handleItemFocus(globalIdx)}
                onKeyDown={(e) => handleItemKeyDown(e, globalIdx)}
                onClick={() => handleItemClick(item, true)}
              />
            );
          })}

          {/* Footer Branding Title with WCAG compliant contrast */}
          <div className="text-muted-foreground/75 mt-3 pb-2 text-center text-xs font-medium tracking-wide">
            {t('seller.sidebar.panelLabel')}
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
});

SellerSidebar.displayName = 'SellerSidebar';

interface NavLinkProps {
  index: number;
  item: NavItem;
  isActive: boolean;
  isCollapsed: boolean;
  isTabTarget: boolean;
  prefersReducedMotion: boolean;
  onFocus: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLAnchorElement>) => void;
  onClick: () => void;
}

function NavLink({
  index,
  item,
  isActive,
  isCollapsed,
  isTabTarget,
  prefersReducedMotion,
  onFocus,
  onKeyDown,
  onClick,
}: NavLinkProps): React.JSX.Element {
  const { t } = useI18n();
  const Icon = item.icon;

  const displayBadge = item.badge !== undefined && item.badge > 0
    ? (item.badge > 99 ? '99+' : String(item.badge))
    : null;

  const textTransitionClass = prefersReducedMotion
    ? ''
    : 'transition-all duration-300 ease-in-out';

  const shortcutHint = useMemo(() => {
    if (index < 9) {
      return `Ctrl+${index + 1}`;
    }
    if (item.titleKey.includes('profile')) {
      return 'Ctrl+Shift+P';
    }
    if (item.titleKey.includes('settings')) {
      return 'Ctrl+S';
    }
    return null;
  }, [index, item.titleKey]);

  // Base clickable link
  const linkContent = (
    <Link
      href={item.href}
      tabIndex={isTabTarget ? 0 : -1}
      data-sidebar-link-index={index}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'flex items-center text-sm font-medium transition-all outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
        isCollapsed
          ? 'justify-center p-3.5 rounded-xl border-l-0'
          : cn(
              'gap-3 px-3 py-2 rounded-r-lg rounded-l-none border-l-4',
              isActive
                ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-600 dark:border-indigo-400'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground border-transparent'
            )
      )}
    >
      <Icon className={cn("h-5 w-5 flex-shrink-0 transition-colors", isActive ? "text-indigo-600 dark:text-indigo-400" : "text-muted-foreground")} aria-hidden="true" />
      {!isCollapsed && (
        <>
          <span className={cn('flex-1 truncate', textTransitionClass)}>{t(item.titleKey)}</span>
          {displayBadge && (
            <span
              role="status"
              aria-label={t('seller.sidebar.unreadBadge', { count: item.badge ?? 0 })}
              className="bg-primary-foreground text-primary ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold select-none border border-primary/10"
            >
              {displayBadge}
              <span className="sr-only"> {t('seller.sidebar.unreadSuffix')}</span>
            </span>
          )}
        </>
      )}
    </Link>
  );

  // If collapsed, wrap with an enterprise tooltip for accessibility and discoverability
  if (isCollapsed) {
    return (
      <Tooltip delayDuration={150}>
        <TooltipTrigger asChild>
          {linkContent}
        </TooltipTrigger>
        <TooltipContent side="right" className="font-semibold text-xs py-1.5 px-3 flex items-center gap-2">
          <span>
            {item.group && <span className="text-slate-500 text-[10px]">{item.group} ›{' '}</span>}
            {t(item.titleKey)}
          </span>
          {shortcutHint && (
            <kbd className="bg-slate-800 dark:bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded font-mono text-[9px] border border-slate-700">
              {shortcutHint}
            </kbd>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  return linkContent;
}
