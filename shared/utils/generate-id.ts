/**
 * generate-id.ts
 *
 * Safe ID generation utility compatible with both Edge runtime and standard Node.js environments.
 */

export function generateCorrelationId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback generator for environments without native crypto.randomUUID support
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}
