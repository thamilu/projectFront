'use client';

/**
 * Orchestrating Ultra-Enterprise Header Component
 *
 * Coordinates desktop and mobile navigation, search subsystem (Ctrl+K),
 * notification center, role-aware profile menu, dismissible announcements,
 * and session state handling.
 */

import React, { useRef, useMemo, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/shared/utils';
import { useMounted } from '@/shared/hooks';
import { useI18n } from '@/core/i18n';

// Subcomponents
import { HeaderAnnouncementBar } from './header/parts/header-announcement-bar';
import { HeaderUtilityBar } from './header/parts/header-utility-bar';
import { HeaderMobileNav } from './header/parts/header-mobile-nav';
import { HeaderLogo } from './header/parts/header-logo';
import { HeaderSearch } from './header/parts/header-search';
import { HeaderNav } from './header/parts/header-nav';
import { HeaderWishlistButton } from './header/parts/header-wishlist-button';
import { HeaderCartButton } from './header/parts/header-cart-button';
import { HeaderNotificationButton } from './header/parts/header-notification-button';
import { HeaderProfileMenu } from './header/parts/header-profile-menu';
import { HeaderAuthDialog } from './header/parts/header-auth-dialog';

// Custom Hooks & Resolvers
import { useScrollShadow } from './header/hooks/use-scroll-shadow';
import { useHeaderAuth } from './header/hooks/use-header-auth';
import { useProtectedNavigate } from './header/hooks/use-protected-navigate';
import { useHeaderHeightVar } from './header/hooks/use-header-height-var';
import { resolveRoleNavigation } from '@/domains/navigation/resolvers/role-navigation-resolver';

// Utilities & Constants
import { isDashboardRoute } from './header/header.utils';
import { DEFAULT_NAV_ITEMS, DIALOG_TARGET } from './header/header.constants';
import type { HeaderProps, NavItem } from './header/header.types';
import { RedirectingScreen } from '@/features/auth';

function HeaderComponent({ navItems: providedNavItems }: HeaderProps) {
  const mounted = useMounted();
  const pathname = usePathname();
  const { t } = useI18n();
  const scrolled = useScrollShadow(10);
  const headerRef = useRef<HTMLElement>(null);
  useHeaderHeightVar(headerRef);

  const {
    currentUser,
    isUserAuthenticated,
    isSeller,
    isDeliveryAgent,
    isPending,
    handleLogin,
    handleLogout,
  } = useHeaderAuth();

  const { dialogOpen, dialogTarget, handleProtectedNavigate, handleSellClick, handleCloseDialog } =
    useProtectedNavigate(isUserAuthenticated);

  // Stable reference so HeaderWishlistButton's React.memo isn't defeated by a
  // fresh inline closure on every Header re-render (e.g. every scroll-shadow
  // change) — HeaderCartButton already receives handleProtectedNavigate
  // directly for the same reason.
  const handleWishlistClick = useCallback(
    () => handleProtectedNavigate('/wishlist', DIALOG_TARGET.WISHLIST),
    [handleProtectedNavigate]
  );

  const isDashboard = isDashboardRoute(pathname);
  const navItems = providedNavItems ?? DEFAULT_NAV_ITEMS;

  // Resolve Declarative Navigation View Model
  const navModel = useMemo(() => {
    const roles: string[] = [];
    if (isSeller) roles.push('SELLER');
    if (isDeliveryAgent) roles.push('DELIVERY_AGENT');
    return resolveRoleNavigation(currentUser, roles, t);
  }, [currentUser, isSeller, isDeliveryAgent, t]);

  // When auth redirect is pending, render redirecting screen
  if (isPending) {
    return <RedirectingScreen />;
  }

  return (
    <>
      {/* Skip Link for WCAG 2.4.1 compliance */}
      {/*
        No skip link here. The root layout (app/layout.tsx) renders
        <SkipToContent /> as the document's first focusable element, with the
        same href and label plus real focus management. Rendering a second
        one immediately after it meant every keyboard user's first two Tab
        presses both offered "Skip to main content", pointing at the same
        target — redundancy that makes the affordance read as broken.
      */}

      <header
        ref={headerRef}
        aria-label="Site header"
        data-testid="site-header"
        data-scrolled={scrolled}
        data-dashboard={isDashboard}
        className={cn(
          'glass-premium sticky top-0 z-50 w-full transition-all duration-300',
          scrolled ? 'shadow-md border-b border-border/40' : 'shadow-none'
        )}
      >
        {/* Top Announcement Bar (Config-driven / Dismissible) */}
        {!isDashboard && <HeaderAnnouncementBar />}

        {/* Top Utility Bar (Desktop only) */}
        {!isDashboard && (
          <HeaderUtilityBar
            navModel={navModel}
            mounted={mounted}
            onBusinessClick={handleSellClick}
          />
        )}

        {/* Main Header Container */}
        {/*
          Explicit CSS Grid, not `flex-wrap`.

          The original single-row flex layout overflowed the viewport by ~195px
          at 390px — measured live — because the brand and action blocks are
          both `shrink-0` and their widths plus the search field's minimum
          exceed a phone's width.

          Wrapping was the first fix and was wrong: with `flex-wrap`, whether
          the row breaks depends on the *intrinsic width of its contents*, which
          is not constant. A signed-in user adds a name and avatar to the action
          block, and `lg` adds the nav links — so the header wrapped at a much
          wider viewport for a signed-in user than the signed-out measurement
          suggested, producing a broken three-line header on a desktop screen.

          Grid removes the guesswork: each block is placed by explicit
          row/column at each breakpoint, so the layout is identical regardless
          of how wide the contents happen to be.

            mobile   [ brand ][ actions ]   ← row 1, actions pushed right
                     [    search       ]    ← row 2, spans both columns

            md and up [ brand ][ search ][ actions ]   ← one row

          DOM order is brand → search → actions, matching the desktop visual
          order so keyboard traversal follows the page on the breakpoint where
          keyboard use is most common.
        */}
        <div
          className="container mx-auto grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 py-2 md:h-16 md:grid-cols-[auto_minmax(0,1fr)_auto] md:gap-y-0 md:py-0"
        >
          {/* Left Block: Mobile Drawer Trigger + Brand Logo */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <HeaderMobileNav
              navModel={navModel}
              mounted={mounted}
              onLogin={handleLogin}
              onLogout={handleLogout}
            />
            <HeaderLogo />
          </div>

          {/* Center Block: First-Class Global Search Subsystem */}
          <HeaderSearch isDashboard={isDashboard} />

          {/* Right Block: Navigation links + Contextual Actions */}
          <div className="col-start-2 row-start-1 flex shrink-0 items-center justify-self-end gap-1 sm:gap-2 md:col-start-3">
            {/* Desktop Navigation Links */}
            <HeaderNav navItems={navItems as NavItem[]} isDashboard={isDashboard} />

            {/* Contextual Action Area (Hidden on dashboards) */}
            {!isDashboard && (
              <>
                {/*
                  Wishlist and notifications are hidden below 360px only.

                  At 320px (iPhone SE 1st gen and older Android) the brand block
                  and the action block together measured 350px inside a 320px
                  viewport, so the page scrolled sideways. Dropping these two
                  frees ~72px and resolves it.

                  Scoped to `max-[359px]` rather than `sm` deliberately: at 360px
                  and up everything fits, and there is no reason to remove
                  functionality from the phone sizes most people actually use.
                  Both remain reachable — wishlist from the drawer, notifications
                  from the profile menu.
                */}
                <span className="contents max-[359px]:hidden">
                  <HeaderWishlistButton onClick={handleWishlistClick} />
                </span>
                <HeaderCartButton
                  mounted={mounted}
                  isUserAuthenticated={isUserAuthenticated}
                  onProtectedNavigate={handleProtectedNavigate}
                />
                <span className="contents max-[359px]:hidden">
                  <HeaderNotificationButton />
                </span>
              </>
            )}

            {/* Role-Aware Profile Menu / Sign-in */}
            <HeaderProfileMenu
              navModel={navModel}
              mounted={mounted}
              isPending={isPending}
              onLogin={handleLogin}
              onLogout={handleLogout}
            />
          </div>
        </div>

        {/* Auth Dialog for guest actions */}
        <HeaderAuthDialog
          open={dialogOpen}
          onOpenChange={handleCloseDialog}
          dialogTarget={dialogTarget}
          onLogin={handleLogin}
          isPending={isPending}
        />
      </header>
    </>
  );
}

export const Header = React.memo(HeaderComponent);
HeaderComponent.displayName = 'Header';
export default Header;
