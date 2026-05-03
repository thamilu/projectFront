/**
 * React Query Optimized Configuration
 *
 * Pre-configured React Query setup with best practices
 * for performance, caching, and error handling
 *
 * @module lib/data/query-config
 */

import { QueryClient, DefaultOptions } from '@tanstack/react-query';
import { logger } from '@/lib/observability/logger';

/**
 * Optimized default options for React Query
 *
 * Performance optimizations:
 * - Aggressive caching (5 min stale time)
 * - Background refetching disabled for stable data
 * - Retry with exponential backoff
 * - Memory efficient garbage collection
 */
const queryConfig: DefaultOptions = {
  queries: {
    // Caching
    staleTime: 5 * 60 * 1000, // 5 minutes - data is considered fresh
    gcTime: 10 * 60 * 1000, // 10 minutes - unused data garbage collected (formerly cacheTime)

    // Refetching
    refetchOnWindowFocus: false, // Disable auto-refetch on focus for better UX
    refetchOnReconnect: true, // Refetch on network reconnect
    refetchOnMount: true, // Refetch on component mount

    // Retries with exponential backoff
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors (client errors)
      const err = error as unknown as { status?: number };
      if (err.status && err.status >= 400 && err.status < 500) {
        return false;
      }
      // Retry up to 3 times for 5xx or network errors
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

    // Error handling
    throwOnError: false, // Handle errors gracefully in components

    // Performance
    structuralSharing: true, // Optimize re-renders by sharing unchanged data
  },

  mutations: {
    // Retry mutations only once
    retry: 1,
    retryDelay: 1000,

    // Error handling
    throwOnError: false,

    // Global mutation callbacks
    onError: (error) => {
      logger.error('Mutation error:', { error });
    },
  },
};

/**
 * Creates an optimized QueryClient instance
 *
 * @returns Configured QueryClient
 *
 * @example
 * ```tsx
 * import { createQueryClient } from '@/lib/data/query-config';
 *
 * const queryClient = createQueryClient();
 *
 * export function Providers({ children }) {
 *   return (
 *     <QueryClientProvider client={queryClient}>
 *       {children}
 *     </QueryClientProvider>
 *   );
 * }
 * ```
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: queryConfig,
  });
}

/**
 * Query key factory for consistent key management
 * Prevents typos and ensures proper invalidation
 *
 * @example
 * ```ts
 * const queryKeys = {
 *   products: {
 *     all: ['products'] as const,
 *     lists: () => [...queryKeys.products.all, 'list'] as const,
 *     list: (filters: ProductFilters) => [...queryKeys.products.lists(), filters] as const,
 *     details: () => [...queryKeys.products.all, 'detail'] as const,
 *     detail: (id: number) => [...queryKeys.products.details(), id] as const,
 *   },
 * };
 *
 * // Usage
 * useQuery({
 *   queryKey: queryKeys.products.detail(123),
 *   queryFn: () => fetchProduct(123),
 * });
 *
 * // Invalidation
 * queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
 * ```
 */
export const createQueryKeys = <T extends Record<string, unknown>>() => {
  return {
    all: (resource: string) => [resource] as const,
    lists: (resource: string) => [resource, 'list'] as const,
    list: (resource: string, filters?: T) => [resource, 'list', filters] as const,
    details: (resource: string) => [resource, 'detail'] as const,
    detail: (resource: string, id: number | string) => [resource, 'detail', id] as const,
  };
};

/**
 * Pre-built query keys for common resources
 */
export const queryKeys = {
  products: {
    all: ['products'] as const,
    lists: () => [...queryKeys.products.all, 'list'] as const,
    list: (filters?: unknown) => [...queryKeys.products.lists(), filters] as const,
    details: () => [...queryKeys.products.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.products.details(), id] as const,
  },
  cart: {
    all: ['cart'] as const,
    current: () => [...queryKeys.cart.all, 'current'] as const,
  },
  wishlist: {
    all: ['wishlist'] as const,
    lists: () => [...queryKeys.wishlist.all, 'list'] as const,
    list: (userId?: string) => [...queryKeys.wishlist.lists(), userId] as const,
  },
  user: {
    all: ['user'] as const,
    current: () => [...queryKeys.user.all, 'current'] as const,
    profile: (id: string) => [...queryKeys.user.all, 'profile', id] as const,
  },
  orders: {
    all: ['orders'] as const,
    lists: () => [...queryKeys.orders.all, 'list'] as const,
    list: (filters?: unknown) => [...queryKeys.orders.lists(), filters] as const,
    detail: (id: number) => [...queryKeys.orders.all, 'detail', id] as const,
  },
} as const;
