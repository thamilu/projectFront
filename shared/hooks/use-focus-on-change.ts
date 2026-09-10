'use client';

/**
 * useFocusOnChange
 *
 * Moves browser focus to a target element when a boolean condition
 * transitions from `false` to `true`.
 *
 * Use case: After async state changes that reveal new interactive elements
 * (e.g., a timeout expiry revealing a "Retry" button).
 *
 * WCAG: Supports WCAG 2.4.3 — Focus Order (Level A).
 * Focus is moved programmatically only when a state change creates a new
 * interactive context (not on every render), satisfying the "meaningful
 * sequence" requirement.
 *
 * Implementation:
 *   - `requestAnimationFrame` defers focus until after the browser has
 *     painted the updated DOM, preventing focus on a not-yet-visible element.
 *   - The RAF handle is cancelled on cleanup to prevent focus on unmounted elements.
 *
 * @module shared/hooks/use-focus-on-change
 */

import { useEffect, useRef, RefObject } from 'react';

/**
 * Moves focus to `targetRef` when `condition` first becomes `true`.
 *
 * @param condition - Boolean that triggers focus when it becomes `true`
 * @param targetRef - Ref to the element that should receive focus
 *
 * @example
 * ```tsx
 * const retryRef = useRef<HTMLButtonElement>(null);
 * useFocusOnChange(timedOut, retryRef);
 *
 * return timedOut && (
 *   <button ref={retryRef} onClick={onRetry}>Retry</button>
 * );
 * ```
 */
export function useFocusOnChange(
  condition: boolean,
  targetRef: RefObject<HTMLElement | null>
): void {
  const rafHandle = useRef<number | null>(null);

  useEffect(() => {
    if (!condition) return;

    // Defer to next animation frame — DOM must be painted before focus
    rafHandle.current = requestAnimationFrame(() => {
      targetRef.current?.focus({ preventScroll: true });
    });

    return () => {
      if (rafHandle.current !== null) {
        cancelAnimationFrame(rafHandle.current);
      }
    };
  }, [condition, targetRef]);
}
