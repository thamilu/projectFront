/**
 * Constants schema version for local/session storage cache validation and migrations.
 */
export const CONSTANTS_SCHEMA_VERSION = '2.1.0' as const;
export type ConstantsSchemaVersion = typeof CONSTANTS_SCHEMA_VERSION;

/**
 * Validates that cached data matches current schema version.
 * Use before reading any cached constants from localStorage/sessionStorage.
 *
 * @example
 * ```typescript
 * const cached = localStorage.getItem('app-config');
 * if (cached && isCurrentSchemaVersion(JSON.parse(cached))) {
 *   return JSON.parse(cached).data;
 * }
 * // Cache miss or stale → fetch fresh
 * ```
 */
export const isCurrentSchemaVersion = (
  data: unknown
): data is { __version: ConstantsSchemaVersion; data: unknown } => {
  return (
    typeof data === 'object' &&
    data !== null &&
    '__version' in data &&
    (data as Record<string, unknown>).__version === CONSTANTS_SCHEMA_VERSION
  );
};

/**
 * Wraps data with current schema version for caching.
 */
export const withSchemaVersion = <T>(data: T) =>
  ({
    __version: CONSTANTS_SCHEMA_VERSION,
    data,
    cachedAt: new Date().toISOString(),
  }) as const;
