/**
 * Query Key Factory for Products
 * 
 * Standardizes query keys to ensure consistent caching and invalidation across the app.
 */
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...productKeys.details(), String(id)] as const,
  categories: () => [...productKeys.all, 'categories'] as const,
  brands: () => [...productKeys.all, 'brands'] as const,
  tags: () => [...productKeys.all, 'tags'] as const,
  featured: () => [...productKeys.all, 'featured'] as const,
  search: (query: string) => [...productKeys.all, 'search', query] as const,
}
