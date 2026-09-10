'use client';

import { ReactNode, useRef, Suspense } from 'react';
import FocusTrap from 'focus-trap-react';
import { SellerHeader } from '@/features/seller/components/layout/header';
import { SellerSidebar } from '@/features/seller/components/layout/sidebar';
import { useSellerLayout } from '@/features/seller/hooks/useSellerLayout';
import { cn } from '@/shared/utils';

interface SellerLayoutClientProps {
  children: ReactNode;
}

/**
 * SellerLayoutClient — Client-side shell for the Seller Dashboard layout.
 *
 * Architecture decisions:
 * - SellerHeader and SellerSidebar are **eagerly imported** (not lazy-loaded) because
 *   they form the permanent navigation chrome. Lazy-loading them causes layout shift
 *   and delayed navigation — contrary to enterprise shell component guidelines.
 * - Only heavy content widgets (charts, reports, analytics) should use lazy + Suspense.
 * - All layout behavior (sidebar, media queries, route announcements, escape handling,
 *   focus management, inert overlay management) is delegated to useSellerLayout().
 * - Transitions use BOTH Tailwind `motion-safe:` / `motion-reduce:` CSS variants AND
 *   the JS `prefersReducedMotion` guard — ensuring OS accessibility preferences are
 *   respected via CSS (no-JS path) as well as via React state.
 * - Semantic elements (<header>, <nav>, <main>) carry implicit ARIA landmark roles
 *   per the HTML5 spec. Redundant role= attributes are omitted.
 */
export function SellerLayoutClient({ children }: SellerLayoutClientProps) {
  /**
   * Focus/scroll target for route changes within the seller console.
   *
   * Typed to the element it is actually attached to. It used to be a
   * `<main>`, but the root layout already owns the document's single main
   * landmark, so this is now a plain <div> — see the render below.
   * `useSellerLayout` accepts the wider `RefObject<HTMLElement | null>`, so
   * narrowing here costs the hook nothing.
   */
  const mainRef = useRef<HTMLDivElement>(null);

  const {
    isSidebarOpen,
    routeAnnouncement,
    isMobile,
    prefersReducedMotion,
    isOnboarding,
    toggleSidebar,
    closeSidebar,
  } = useSellerLayout({ mainRef });

  /**
   * Overlay and sidebar transition classes.
   *
   * CSS layer: motion-safe: / motion-reduce: Tailwind variants ensure the OS
   * `prefers-reduced-motion: reduce` media query is honoured at the CSS level.
   *
   * JS layer: `prefersReducedMotion` from useReducedMotion() provides the same
   * guard for programmatically-applied classes that cannot use Tailwind variants.
   */
  const overlayTransitionClass = prefersReducedMotion
    ? ''
    : 'motion-safe:transition-opacity motion-safe:duration-300 motion-safe:ease-in-out';

  const sidebarTransitionClass = prefersReducedMotion
    ? ''
    : 'motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-in-out';

  return (
    <>
      {/*
        No skip link here either. The root layout renders <SkipToContent /> as
        the document's first focusable element; this was one of four on
        /seller/register, all pointing at the same target.
      */}

      {/* Screen reader live region — announces route changes with human-readable labels */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {routeAnnouncement}
      </div>

      <div className="min-h-screen bg-gray-50/40 dark:bg-gray-900/40">
        {/* Suspense wrapper with fallback to prevent layout shift */}
        <Suspense fallback={
          <div className={cn(
            "bg-background/95 backdrop-blur-md border-b border-border/80 w-full sticky top-0 right-0 left-0 z-50",
            isOnboarding ? "h-14" : "h-16"
          )} />
        }>
          <SellerHeader
            onMenuClick={toggleSidebar}
            isSidebarOpen={isSidebarOpen}
            isOnboarding={isOnboarding}
          />
        </Suspense>

        <div className="flex transition-all duration-200">
          {/* Sidebar — hidden during seller onboarding flow */}
          {!isOnboarding && (
            <>
              {/* Mobile overlay backdrop */}
              {isSidebarOpen && (
                <div
                  className={`fixed inset-0 z-40 bg-black/50 md:hidden ${overlayTransitionClass}`}
                  onClick={closeSidebar}
                  aria-hidden="true"
                  data-testid="overlay"
                />
              )}

              {/* <nav> carries implicit navigation landmark — no role="navigation" needed */}
              <FocusTrap active={isSidebarOpen && isMobile}>
                <nav
                  aria-label="Seller Dashboard Navigation"
                  aria-hidden={isMobile && !isSidebarOpen}
                  className={`fixed top-14 left-0 z-40 h-[calc(100vh-3.5rem)] md:sticky md:top-14 md:z-auto ${sidebarTransitionClass} ${
                    isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
                  }`}
                >
                  <SellerSidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
                </nav>
              </FocusTrap>
            </>
          )}

          {/*
            Plain <div>, NOT <main>. The root layout already renders the
            document's single `<main id="main-content">` around all children —
            a second one here produced nested <main> elements sharing an id,
            which breaks the skip-link target and duplicates the landmark.
            `tabIndex={-1}` is kept so `mainRef` remains a valid programmatic
            focus target for in-page navigation within the seller console.
          */}
          <div
            ref={mainRef}
            tabIndex={-1}
            data-testid="seller-content"
            className="flex-1 p-6 outline-none md:p-8"
          >
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
