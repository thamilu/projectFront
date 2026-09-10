/**
 * Sanitizes user-provided values for safe usage in CSS inline styles.
 * Prevents CSS injection vectors by filtering out dangerous characters and patterns.
 *
 * @param value The raw input value to be sanitized
 * @returns The sanitized safe CSS value
 */
export function sanitizeCSSValue(value: string | undefined | null): string {
  if (!value) return '';

  const lower = value.toLowerCase();

  // Filter out protocol execution blocks and dynamic functions
  if (lower.includes('javascript:') || lower.includes('url(') || lower.includes('expression(')) {
    return '';
  }

  // Remove semicolons and braces that could allow breaking out of style attributes
  return value.replace(/[;{}]/g, '');
}
