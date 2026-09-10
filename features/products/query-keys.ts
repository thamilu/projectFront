import type { PageRequest } from '@/shared/types';
import type { ProductFilters } from '@/domains/catalog/contracts/catalog.types';

/**
 * Query Key Factory for Products
 *
 * Standardizes query keys to ensure consistent caching and invalidation across the app.
 */
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters: Partial<PageRequest & ProductFilters>) =>
    [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...productKeys.details(), String(id)] as const,
  categories: () => [...productKeys.all, 'categories'] as const,
  brands: () => [...productKeys.all, 'brands'] as const,
  // params included so a query for the same text at a different page/size
  // gets its own cache entry instead of silently reusing a stale page.
  search: (query: string, params?: PageRequest) =>
    [...productKeys.all, 'search', query, params ?? {}] as const,
};
