'use client';

import { useEffect, type RefObject } from 'react';

const HEADER_HEIGHT_CSS_VAR = '--header-height';

/**
 * Publishes the header's real rendered height as a CSS custom property on
 * the document root, consumed by `scroll-padding-top` (app/styles/base.css)
 * so anchor navigation and focus-driven scrolling (skip-link, hash links)
 * land content visibly below the sticky header instead of underneath it.
 *
 * A ResizeObserver (not a one-time measurement) is required because the
 * header's height genuinely varies at runtime — the promo/utility bar is
 * conditionally rendered per route (see header.tsx's `isDashboard` check)
 * and can wrap onto a second line on narrow viewports.
 */
export function useHeaderHeightVar(headerRef: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const node = headerRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return;

    const setHeightVar = (height: number): void => {
      document.documentElement.style.setProperty(HEADER_HEIGHT_CSS_VAR, `${Math.round(height)}px`);
    };

    setHeightVar(node.getBoundingClientRect().height);

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const height = entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height;
      setHeightVar(height);
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, [headerRef]);
}
