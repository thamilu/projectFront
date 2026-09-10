'use client';

/**
 * useBodyScrollLock
 *
 * Prevents the document body from scrolling while a full-screen overlay
 * is mounted. Correctly handles the iOS Safari "scroll-through" bug where
 * `overflow: hidden` on `<body>` alone does not prevent background scroll.
 *
 * Strategy: position:fixed + top offset
 *   1. Snapshot `window.scrollY` before locking.
 *   2. Apply `position: fixed` + `top: -${scrollY}px` to body.
 *   3. On unmount: restore original styles, call `window.scrollTo` to exact position.
 *
 * Side effect: This causes a 1-frame reflow on mount/unmount (unavoidable).
 * For full-screen auth overlays that replace the page this is acceptable.
 *
 * WCAG: Does not affect keyboard or AT navigation order.
 *
 * @see https://developer.apple.com/forums/thread/703294
 * @module shared/hooks/use-body-scroll-lock
 */

import { useEffect } from 'react';

/**
 * Locks body scroll on mount; restores it on unmount.
 * SSR-safe — no-ops when `window` is undefined.
 *
 * @example
 * ```tsx
 * export function RedirectingScreen() {
 *   useBodyScrollLock();
 *   // ...
 * }
 * ```
 */
export function useBodyScrollLock(): void {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const { body } = document;
    const scrollY = window.scrollY;

    // Capture existing inline styles so we can restore them exactly
    const originalOverflow = body.style.overflow;
    const originalPosition = body.style.position;
    const originalTop = body.style.top;
    const originalWidth = body.style.width;

    // Apply lock
    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';

    return () => {
      // Restore original styles
      body.style.overflow = originalOverflow;
      body.style.position = originalPosition;
      body.style.top = originalTop;
      body.style.width = originalWidth;

      // Restore exact scroll position (lost when position:fixed is removed)
      window.scrollTo({ top: scrollY, behavior: 'instant' as ScrollBehavior });
    };
  }, []);
}
