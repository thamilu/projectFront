/**
 * Data Fetching Optimization Utilities
 *
 * Optimized patterns for data fetching with caching,
 * deduplication, and error handling
 *
 * @module lib/data/fetch-helpers
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

const fetchCache = new Map<string, CacheEntry<unknown>>();

interface FetchWithCacheOptions {
  /** Cache duration in milliseconds */
  cacheDuration?: number;
  /** Cache key (defaults to URL) */
  cacheKey?: string;
  /** Skip cache and force fresh fetch */
  skipCache?: boolean;
}

/**
 * Fetch with in-memory caching
 * Reduces unnecessary API calls for repeated requests
 *
 * Time Complexity: O(1) for cache hit, O(n) for fetch
 * Space Complexity: O(n) where n is number of cached entries
 *
 * @param url - URL to fetch
 * @param options - Fetch and cache options
 * @returns Fetched data
 *
 * @example
 * ```ts
 * const products = await fetchWithCache<Product[]>(
 *   '/api/products',
 *   { cacheDuration: 5 * 60 * 1000 } // 5 minutes
 * );
 * ```
 */
export async function fetchWithCache<T>(
  url: string,
  options?: RequestInit & FetchWithCacheOptions
): Promise<T> {
  const {
    cacheDuration = 60 * 1000, // 1 minute default
    cacheKey = url,
    skipCache = false,
    ...fetchOptions
  } = options || {};

  // Check cache
  if (!skipCache) {
    const cached = fetchCache.get(cacheKey) as CacheEntry<T> | undefined;
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }
  }

  // Fetch fresh data
  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = (await response.json()) as T;

  // Update cache
  fetchCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
    expiresAt: Date.now() + cacheDuration,
  });

  return data;
}

/**
 * Clears fetch cache
 *
 * @param cacheKey - Specific key to clear, or undefined to clear all
 */
export function clearFetchCache(cacheKey?: string): void {
  if (cacheKey) {
    fetchCache.delete(cacheKey);
  } else {
    fetchCache.clear();
  }
}

/**
 * Deduplicates concurrent requests to the same endpoint
 * Prevents multiple identical API calls from running simultaneously
 *
 * @example
 * ```ts
 * const dedupedFetch = createDedupedFetcher();
 *
 * // These will result in only ONE actual API call
 * const [result1, result2, result3] = await Promise.all([
 *   dedupedFetch('/api/user'),
 *   dedupedFetch('/api/user'),
 *   dedupedFetch('/api/user'),
 * ]);
 * ```
 */
export function createDedupedFetcher() {
  const pendingRequests = new Map<string, Promise<unknown>>();

  return async function dedupedFetch<T>(url: string, options?: RequestInit): Promise<T> {
    const cacheKey = `${url}:${JSON.stringify(options || {})}`;

    // Return pending request if exists
    const pending = pendingRequests.get(cacheKey) as Promise<T> | undefined;
    if (pending) {
      return pending;
    }

    // Create new request
    const requestPromise = fetch(url, options)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json() as Promise<T>;
      })
      .finally(() => {
        // Clean up after request completes
        pendingRequests.delete(cacheKey);
      });

    pendingRequests.set(cacheKey, requestPromise);
    return requestPromise;
  };
}

/**
 * Batch multiple API calls into configurable time window
 * Reduces request overhead for rapid successive calls
 *
 * @param batchFn - Function that processes batch
 * @param delay - Batch delay in ms (default: 50ms)
 * @returns Batched function
 *
 * @example
 * ```ts
 * const batchedFetch = createBatchedFetcher(
 *   async (ids: number[]) => {
 *     return api.getProductsByIds(ids);
 *   },
 *   50
 * );
 *
 * // These will be batched into one call
 * const product1 = batchedFetch(1);
 * const product2 = batchedFetch(2);
 * const product3 = batchedFetch(3);
 * ```
 */
export function createBatchedFetcher<TInput, TOutput>(
  batchFn: (inputs: TInput[]) => Promise<TOutput[]>,
  delay = 50
) {
  let queue: Array<{
    input: TInput;
    resolve: (value: TOutput) => void;
    reject: (error: Error) => void;
  }> = [];
  let timeoutId: NodeJS.Timeout | null = null;

  const processBatch = async () => {
    const currentBatch = queue;
    queue = [];

    try {
      const inputs = currentBatch.map((item) => item.input);
      const results = await batchFn(inputs);

      currentBatch.forEach((item, index) => {
        item.resolve(results[index]);
      });
    } catch (error) {
      currentBatch.forEach((item) => {
        item.reject(error as Error);
      });
    }
  };

  return (input: TInput): Promise<TOutput> => {
    return new Promise((resolve, reject) => {
      queue.push({ input, resolve, reject });

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(processBatch, delay);
    });
  };
}

/**
 * Retry fetch with exponential backoff
 * Handles transient failures gracefully
 *
 * @param fetchFn - Function to retry
 * @param options - Retry options
 * @returns Result of successful fetch
 *
 * @example
 * ```ts
 * const data = await retryFetch(
 *   () => fetch('/api/products').then(r => r.json()),
 *   { maxRetries: 3, initialDelay: 1000 }
 * );
 * ```
 */
export async function retryFetch<T>(
  fetchFn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffMultiplier?: number;
  } = {}
): Promise<T> {
  const { maxRetries = 3, initialDelay = 1000, maxDelay = 10000, backoffMultiplier = 2 } = options;

  let lastError: Error | null = null;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fetchFn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay = Math.min(delay * backoffMultiplier, maxDelay);
      }
    }
  }

  throw lastError;
}

/**
 * Prefetch data for future use
 * Warms up cache before user needs it
 *
 * @param url - URL to prefetch
 * @param options - Fetch options
 *
 * @example
 * ```ts
 * // On hover, prefetch the product details
 * <ProductCard
 *   onMouseEnter={() => prefetchData(`/api/products/${id}`)}
 * />
 * ```
 */
export function prefetchData(url: string, options?: RequestInit): void {
  if (typeof window === 'undefined') return;

  // Use fetchWithCache to populate cache
  fetchWithCache(url, options).catch(() => {
    // Silently ignore prefetch failures
  });
}

/**
 * Creates an optimistic update handler
 * Updates UI immediately, rolls back on failure
 *
 * @example
 * ```ts
 * const updateProduct = createOptimisticUpdate(
 *   async (product) => api.updateProduct(product),
 *   (product) => {
 *     // Optimistic update
 *     setProducts(prev => prev.map(p =>
 *       p.id === product.id ? product : p
 *     ));
 *   },
 *   (error, product) => {
 *     // Rollback
 *     setProducts(prev => prev.map(p =>
 *       p.id === product.id ? originalProduct : p
 *     ));
 *   }
 * );
 * ```
 */
export function createOptimisticUpdate<T, TResult>(
  mutationFn: (data: T) => Promise<TResult>,
  onOptimistic: (data: T) => void,
  onRollback: (error: Error, data: T) => void
) {
  return async (data: T): Promise<TResult> => {
    // Apply optimistic update
    onOptimistic(data);

    try {
      // Perform actual mutation
      const result = await mutationFn(data);
      return result;
    } catch (error) {
      // Rollback on error
      onRollback(error as Error, data);
      throw error;
    }
  };
}
