import type { PageRequest } from '@/types';

/**
 * Merges caller-supplied pagination params with safe defaults.
 *
 * Eliminates the repeated pattern that appeared in every query hook:
 * ```ts
 * const defaults: PageRequest = { page: 0, size: 10 };
 * const p = (params ? params : defaults) as PageRequest & SomeFilters;
 * ```
 *
 * @example
 * const p = withDefaults<PageRequest & ProductFilters>(params);
 */
export function withDefaults<T extends PageRequest>(params?: Partial<T>): T {
  return { page: 0, size: 10, ...params } as T;
}
