/**
 * @fileoverview Pure utility functions for Textarea component.
 * All functions are pure, testable, and have no side effects.
 * Separation of concerns: business logic isolated from rendering.
 */

import { CHAR_COUNT_WARNING_THRESHOLD, CHAR_COUNT_DANGER_THRESHOLD } from './textarea.constants';

// ─────────────────────────────────────────────
// Character Count Utilities
// ─────────────────────────────────────────────

/**
 * Calculates remaining characters for a textarea with maxLength.
 *
 * @param currentLength - Current value character count
 * @param maxLength - Maximum allowed characters
 * @returns Remaining character count
 *
 * @pure No side effects
 * @example getRemainingChars(50, 200) → 150
 */
export function getRemainingChars(currentLength: number, maxLength: number): number {
  return Math.max(0, maxLength - currentLength);
}

/**
 * Determines the semantic color state for character count display.
 * Follows traffic light pattern: green → yellow → red.
 *
 * @param currentLength - Current value character count
 * @param maxLength - Maximum allowed characters
 * @returns CSS color token for the count display
 *
 * @pure No side effects
 */
export function getCharCountColorClass(currentLength: number, maxLength: number): string {
  const ratio = currentLength / maxLength;

  if (ratio >= CHAR_COUNT_DANGER_THRESHOLD) {
    return 'text-destructive font-semibold';
  }

  if (ratio >= CHAR_COUNT_WARNING_THRESHOLD) {
    return 'text-warning';
  }

  return 'text-muted-foreground';
}

// ─────────────────────────────────────────────
// Auto-Resize Utilities
// ─────────────────────────────────────────────

/**
 * Adjusts textarea height to fit content exactly.
 * Uses the shrink-then-expand technique to handle deletions.
 *
 * Performance note: Causes a single forced reflow.
 * This is unavoidable for accurate height measurement.
 * Minimize by only calling on actual value changes.
 *
 * @param element - The textarea DOM element to resize
 * @param minHeight - Minimum height in pixels
 */
export function adjustTextareaHeight(element: HTMLTextAreaElement, minHeight: number): void {
  // Shrink first to get accurate scrollHeight for shorter content
  element.style.height = `${minHeight}px`;

  const scrollHeight = element.scrollHeight;
  const newHeight = Math.max(scrollHeight, minHeight);

  element.style.height = `${newHeight}px`;
}

// ─────────────────────────────────────────────
// Accessibility Utilities
// ─────────────────────────────────────────────

/**
 * Builds aria-describedby value from multiple possible descriptor IDs.
 * Filters falsy values and joins with spaces per ARIA spec.
 *
 * @param ids - Array of element IDs that describe the textarea
 * @returns Space-separated ID string or undefined if none
 *
 * @pure No side effects
 * @example buildAriaDescribedBy(['hint-1', undefined, 'error-1']) → 'hint-1 error-1'
 */
export function buildAriaDescribedBy(ids: Array<string | undefined>): string | undefined {
  const filtered = ids.filter((id): id is string => Boolean(id));
  return filtered.length > 0 ? filtered.join(' ') : undefined;
}

/**
 * Generates a stable, unique ID for textarea sub-elements.
 * Used for hint, error, and label elements.
 *
 * @param baseId - The textarea's id prop
 * @param suffix - Element type suffix
 * @returns Compound ID string or undefined if no baseId
 *
 * @pure No side effects
 */
export function buildSubElementId(
  baseId: string | undefined,
  suffix: 'hint' | 'error' | 'label' | 'count'
): string | undefined {
  return baseId ? `${baseId}-${suffix}` : undefined;
}
