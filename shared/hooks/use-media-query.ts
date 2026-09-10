import { useSyncExternalStore, useCallback } from 'react';

/**
 * Subscribes to a CSS media query using `window.matchMedia`.
 *
 * React 19 / Concurrent Mode safe via `useSyncExternalStore`.
 * SSR-safe: returns `false` during server-side rendering (no hydration mismatch).
 *
 * Uses `matchMedia.addEventListener('change', ...)` — never a raw `resize` listener.
 * The subscription is stable per query string (no stale closure, no unnecessary re-subscriptions).
 *
 * @param query - A valid CSS media query string, e.g. `'(max-width: 767px)'`
 * @returns `true` when the media query matches, `false` otherwise (including SSR).
 *
 * @example
 * const isMobile = useMediaQuery('(max-width: 767px)');
 * const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (callback: () => void): (() => void) => {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return () => {};
      }
      const media = window.matchMedia(query);
      media.addEventListener('change', callback);
      return () => media.removeEventListener('change', callback);
    },
    [query]
  );

  const getSnapshot = useCallback((): boolean => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }
    return window.matchMedia(query).matches;
  }, [query]);

  // SSR snapshot always returns false — no hydration mismatch
  const getServerSnapshot = (): boolean => false;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
