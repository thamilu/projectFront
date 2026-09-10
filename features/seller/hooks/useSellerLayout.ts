import { useState, useEffect, useCallback, RefObject } from 'react';
import { usePathname } from 'next/navigation';
import { useMediaQuery } from '@/shared/hooks/use-media-query';
import { useReducedMotion } from '@/shared/hooks/use-reduced-motion';
import { logger } from '@/shared/utils/logger';
import { trackEvent } from '@/core/providers/analytics-provider';
import { LAYOUT_CONSTANTS } from '@/shared/constants';
import { APP_ROUTES } from '@/shared/routes';

/**
 * Human-readable route labels for screen reader announcements.
 *
 * Key format: exact pathname or prefix segment (without trailing slash).
 * Used by `getRouteLabel()` with prefix-match fallback for dynamic sub-routes.
 */
const ROUTE_LABELS: Readonly<Record<string, string>> = {
  '/seller': 'Dashboard',
  '/seller/dashboard': 'Dashboard',
  '/seller/products': 'Products',
  '/seller/catalog': 'Shared Catalog',
  '/seller/orders': 'Orders',
  '/seller/inventory': 'Inventory',
  '/seller/store': 'Store Profile',
  '/seller/settings': 'Settings',
  '/seller/register': 'Register Onboarding',
  '/seller/profile': 'Profile Settings',
  '/seller/search': 'Search Results',
} as const;

/**
 * Converts a pathname into a user-friendly, human-readable label for
 * screen reader route-change announcements.
 *
 * Resolution order:
 *  1. Exact match in ROUTE_LABELS
 *  2. Longest prefix match in ROUTE_LABELS (handles dynamic sub-routes like /seller/orders/123)
 *  3. Title-case of the last URL segment as final fallback
 *
 * @param pathname - The current Next.js pathname (e.g. '/seller/orders/abc-123')
 * @returns A human-readable label (e.g. 'Orders')
 */
export function getRouteLabel(pathname: string): string {
  // 1. Exact match
  if (ROUTE_LABELS[pathname]) {
    return ROUTE_LABELS[pathname];
  }

  // 2. Longest prefix match (sorts descending by length to match most specific first)
  const matchedPrefix = Object.keys(ROUTE_LABELS)
    .filter((prefix) => prefix !== '/seller' && pathname.startsWith(prefix + '/'))
    .sort((a, b) => b.length - a.length)[0];

  if (matchedPrefix) {
    return ROUTE_LABELS[matchedPrefix];
  }

  // 3. Fallback: title-case the last URL segment, converting hyphens to spaces
  const segment = pathname.split('/').filter(Boolean).pop() ?? 'dashboard';
  return segment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

interface UseSellerLayoutOptions {
  mainRef: RefObject<HTMLElement | null>;
}

/**
 * useSellerLayout — Custom hook coordinating the seller layout lifecycle.
 *
 * Responsibilities (single hook, delegated concerns):
 * - Sidebar open/close + keyboard Escape handler
 * - Viewport media query via matchMedia (never raw resize events)
 * - Prefers-reduced-motion detection for progressive animation disabling
 * - Main content inert + aria-hidden management during mobile drawer open
 * - Route change: scroll reset, focus management, screen reader announcements
 * - Route transition analytics via trackEvent
 *
 * @param mainRef - Ref to the `<main>` element for focus and scroll management
 */
export function useSellerLayout({ mainRef }: UseSellerLayoutOptions) {
  const pathname = usePathname() || '';
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [routeAnnouncement, setRouteAnnouncement] = useState('');

  // matchMedia-based query — no raw resize event listeners (enterprise rule §Major Issue 2)
  // Derived from LAYOUT_CONSTANTS.MOBILE_BREAKPOINT which is sourced from TAILWIND_BREAKPOINTS.md
  const isMobile = useMediaQuery(`(max-width: ${LAYOUT_CONSTANTS.MOBILE_BREAKPOINT - 1}px)`);

  // Track OS prefers-reduced-motion dynamically via matchMedia
  const prefersReducedMotion = useReducedMotion();

  // Derived value — not stored in state (enterprise rule §Major Issue 3)
  const isOnboarding = pathname.startsWith(APP_ROUTES.SELLER.REGISTER);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  // ── Route change: focus, scroll, screen reader announcement, analytics ──
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.focus();
      if (typeof mainRef.current.scrollTo === 'function') {
        mainRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }

    const routeLabel = getRouteLabel(pathname);
    setRouteAnnouncement(`Navigated to ${routeLabel} page`);

    // Route transition analytics (enterprise requirement §Top 10 #10)
    trackEvent('seller_page_view', {
      pathname,
      pageLabel: routeLabel,
      timestamp: Date.now(),
    });

    logger.info('[SellerLayout] Page transition', { pathname, routeLabel });

    const timer = setTimeout(
      () => setRouteAnnouncement(''),
      LAYOUT_CONSTANTS.ROUTE_ANNOUNCEMENT_DURATION
    );

    return () => clearTimeout(timer);
  }, [pathname, mainRef]);

  // ── Auto-close sidebar on route change ──
  useEffect(() => {
    closeSidebar();
  }, [pathname, closeSidebar]);

  // ── Keyboard, body overflow, inert attribute management ──
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSidebarOpen) {
        closeSidebar();
      }
    };

    if (isSidebarOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';

      if (mainRef.current && isMobile) {
        mainRef.current.setAttribute('inert', '');
        mainRef.current.setAttribute('aria-hidden', 'true');
      }
    } else {
      document.body.style.overflow = '';

      if (mainRef.current) {
        mainRef.current.removeAttribute('inert');
        mainRef.current.removeAttribute('aria-hidden');
      }
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isSidebarOpen, isMobile, closeSidebar, mainRef]);

  return {
    pathname,
    isSidebarOpen,
    routeAnnouncement,
    isMobile,
    prefersReducedMotion,
    isOnboarding,
    toggleSidebar,
    closeSidebar,
  };
}
