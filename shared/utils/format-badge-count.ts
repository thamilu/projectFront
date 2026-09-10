/**
 * Formats a numeric count into a string representation for badges.
 * Limits values higher than the specified maximum value (defaults to 9) to a "+" notation.
 *
 * @param count - The numeric count to format.
 * @param max - The threshold value at which the formatting truncates to "+" (defaults to 9).
 * @returns A formatted string representation of the count.
 */
export function formatBadgeCount(count: number, max: number = 9): string {
  if (count <= 0) {
    return '0';
  }
  if (count <= max) {
    return String(count);
  }
  return `${max}+`;
}
