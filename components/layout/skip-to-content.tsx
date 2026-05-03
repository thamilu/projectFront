/**
 * Skip to Content Component
 * 
 * Accessibility feature for keyboard navigation (WCAG 2.4.1).
 * Allows users to bypass navigation and jump to main content.
 * 
 * @module components/layout/skip-to-content
 */

'use client';

import { useCallback } from 'react';
import { cn } from '@/lib/utils';

/**
 * Skip to Content Link
 * 
 * Hidden until focused, allowing keyboard users to skip navigation.
 * Scrolls to main content and sets focus.
 * 
 * @example
 * ```tsx
 * // In layout
 * <SkipToContent />
 * 
 * // In page
 * <main id="main-content" tabIndex={-1}>
 *   {content}
 * </main>
 * ```
 */
export function SkipToContent() {
  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    const targetId = 'main-content';
    const target = document.getElementById(targetId);

    if (!target) {
      if (process.env.NODE_ENV === 'development') {
        // Helpful dev warning when layout doesn't include the expected main landmark
        console.warn(`[SkipToContent] Target element #${targetId} not found.`);
      }
      return;
    }

    // Make focusable (permanent tabindex is preferred in page markup, but ensure here)
    // Only set if not already focusable
    const prevTabIndex = target.getAttribute('tabindex');
    if (prevTabIndex === null) target.setAttribute('tabindex', '-1');

    // Respect user's reduced-motion preference
    const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Focus without scrolling, then scroll with respect to motion preference
    try {
      (target as HTMLElement).focus({ preventScroll: true });
    } catch (_err) {
      // ignore focus errors on some elements
    }

    (target as HTMLElement).scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });

    // Do not remove tabindex here — removing it can cause screen reader race conditions.
  }, []);

  return (
    <a
      href="#main-content"
      onClick={handleClick}
      className={cn(
        // Positioning with safe-area insets
        'fixed z-[100]',
        'left-[max(1rem,env(safe-area-inset-left))]',
        'top-[max(1rem,env(safe-area-inset-top))]',
        // Visual styling
        'rounded-md bg-primary px-4 py-3',
        'text-sm font-medium text-primary-foreground shadow-lg',
        // Hidden by default, visible on keyboard focus only (CSS-only)
        '-translate-y-full opacity-0 pointer-events-none',
        'focus:translate-y-0 focus:opacity-100 focus:pointer-events-auto',
        // Focus ring and offset
        'focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background focus:outline-none',
        // Respect motion preferences
        'motion-safe:transition-transform motion-safe:duration-200 motion-reduce:transition-none',
        // High contrast support
        'forced-colors:border forced-colors:border-current'
      )}
    >
      Skip to main content
    </a>
  );
}
