'use client';

/**
 * useReducedMotion
 *
 * Returns `true` when the user has enabled the OS-level
 * "Reduce Motion" accessibility preference.
 *
 * SSR-safe: always returns `false` on the server so the initial
 * hydrated HTML never diverges from the client HTML.
 *
 * WCAG: Supports WCAG 2.3.3 — Animation from Interactions (Level AAA)
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
 * @module hooks/use-reduced-motion
 */

import { useState, useEffect } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Subscribe to the OS reduced-motion media query.
 *
 * @returns `true` if the user prefers reduced motion, `false` otherwise.
 *
 * @example
 * ```tsx
 * const prefersReducedMotion = useReducedMotion();
 *
 * // Use to skip animation entirely
 * const animationClass = prefersReducedMotion ? '' : 'animate-spin';
 * ```
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(
    // SSR-safe: window is undefined on the server, default to false
    () => {
      if (typeof window === 'undefined') return false;
      return window.matchMedia(QUERY).matches;
    }
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(QUERY);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Set correct initial value after hydration
    setPrefersReducedMotion(mediaQuery.matches);

    // Modern addEventListener API (Safari 14+, Chrome 79+, Firefox 55+)
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return prefersReducedMotion;
}
