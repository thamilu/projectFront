/**
 * Enterprise API Service Utilities
 * 
 * Features:
 * - Request deduplication (prevent duplicate simultaneous requests)
 * - Client-side caching with TTL
 * - Request batching
 * - Performance monitoring
 * - Graceful degradation
 */

import { logger } from '@/lib/observability/logger';

// ==================== DATA UNWRAPPING ====================

/**
 * Unwraps the nested `.data.data` envelope returned by the backend API.
 *
 * All API responses follow the shape `{ data: { data: T, ... } }`.
 * Using this helper avoids repeating `response.data.data!` in every service method.
 *
 * @example
 * const user = unwrapData(await apiClient.get<ApiResponse<UserDTO>>('/users/me'));
 */
export function unwrapData<T>(response: { data: { data?: T } }): T {
  return response.data.data!;
}

// ==================== REQUEST DEDUPLICATION ====================

interface PendingRequest {
  promise: Promise<unknown>;
  timestamp: number;
}

const pendingRequests = new Map<string, PendingRequest>();

/**
 * Deduplicates simultaneous identical requests.
 * If the same request is made multiple times before the first completes,
 * all callers receive the same promise.
 */
export function deduplicateRequest<T>(
  key: string,
  requestFn: () => Promise<T>
): Promise<T> {
  const existing = pendingRequests.get(key);
  
  if (existing) {
    logger.debug(`[Request Deduplication] Using existing request for key: ${key}`);
    return existing.promise as Promise<T>;
  }

  const promise = requestFn().finally(() => {
    pendingRequests.delete(key);
  });

  pendingRequests.set(key, {
    promise,
    timestamp: Date.now(),
  });

  return promise;
}

// ==================== CLIENT-SIDE CACHING ====================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class ApiCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private maxSize = 100; // Maximum cache entries

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;

    const now = Date.now();
    const age = now - entry.timestamp;

    // Check if cache entry is still valid
    if (age > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    logger.debug(`[Cache Hit] ${key} (age: ${age}ms, ttl: ${entry.ttl}ms)`);
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    // Evict oldest entry if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0][0];
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });

    logger.debug(`[Cache Set] ${key} (ttl: ${ttl}ms)`);
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      logger.debug('[Cache] Cleared all entries');
      return;
    }

    const regex = new RegExp(pattern);
    let count = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }

    logger.debug(`[Cache] Invalidated ${count} entries matching: ${pattern}`);
  }

  clear(): void {
    this.cache.clear();
    logger.debug('[Cache] Cleared');
  }
}

export const apiCache = new ApiCache();

/**
 * Wraps an API call with caching.
 * 
 * @param key - Unique cache key
 * @param requestFn - Function that performs the API request
 * @param ttl - Time to live in milliseconds (default: 5 minutes)
 */
export async function withCache<T>(
  key: string,
  requestFn: () => Promise<T>,
  ttl: number = 5 * 60 * 1000
): Promise<T> {
  // Check cache first
  const cached = apiCache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch from API
  const data = await requestFn();
  
  // Store in cache
  apiCache.set(key, data, ttl);
  
  return data;
}

// ==================== REQUEST BATCHING ====================

// interface BatchedRequest<T, R> {
//   item: T;
//   resolve: (value: R) => void;
//   reject: (error: unknown) => void;
// }

 
/*
class RequestBatcher<T, R> {
  private queue: BatchedRequest<T, R>[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private batchFn: (items: T[]) => Promise<R[]>,
    private batchDelay = 50
  ) {}

  add(item: T): Promise<R> {
    return new Promise<R>((resolve, reject) => {
      this.queue.push({ item, resolve, reject });

      if (!this.timer) {
        this.timer = setTimeout(() => this.flush(), this.batchDelay);
      }
    });
  }

  private async flush(): Promise<void> {
    const batch = this.queue.splice(0);
    this.timer = null;

    if (batch.length === 0) return;

    try {
      const items = batch.map((b) => b.item);
      const results = await this.batchFn(items);

      batch.forEach((request, index) => {
        request.resolve(results[index]);
      });
    } catch (error) {
      batch.forEach((request) => {
        request.reject(error);
      });
    }
  }
}
*/

// Example: Batch product fetches
// const productBatcher = new RequestBatcher(
//   async (ids: number[]) => {
//     return productsApi.getByIds(ids);
//   }
// );

// ==================== PERFORMANCE MONITORING ====================

interface PerformanceMetrics {
  endpoint: string;
  method: string;
  duration: number;
  status: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics = 1000;

  track(metric: PerformanceMetrics): void {
    this.metrics.push(metric);

    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Log slow requests in development
    if (process.env.NODE_ENV === 'development' && metric.duration > 1000) {
      logger.warn(`[Slow Request] ${metric.method} ${metric.endpoint} took ${metric.duration}ms`);
    }
  }

  getStats(endpoint?: string): {
    count: number;
    avgDuration: number;
    minDuration: number;
    maxDuration: number;
    p95Duration: number;
  } {
    const filtered = endpoint
      ? this.metrics.filter((m) => m.endpoint === endpoint)
      : this.metrics;

    if (filtered.length === 0) {
      return {
        count: 0,
        avgDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        p95Duration: 0,
      };
    }

    const durations = filtered.map((m) => m.duration).sort((a, b) => a - b);
    const sum = durations.reduce((a, b) => a + b, 0);
    const p95Index = Math.floor(durations.length * 0.95);

    return {
      count: filtered.length,
      avgDuration: sum / filtered.length,
      minDuration: durations[0],
      maxDuration: durations[durations.length - 1],
      p95Duration: durations[p95Index],
    };
  }

  clear(): void {
    this.metrics = [];
  }
}

export const perfMonitor = new PerformanceMonitor();

/**
 * Wraps an API call with performance monitoring.
 */
export async function withPerformanceTracking<T>(
  endpoint: string,
  method: string,
  requestFn: () => Promise<T>
): Promise<T> {
  const startTime = performance.now();
  let status = 200;

  try {
    const result = await requestFn();
    return result;
  } catch (error: unknown) {
    status = (error as { response?: { status?: number } } )?.response?.status ?? 500;
    throw error;
  } finally {
    const duration = performance.now() - startTime;

    perfMonitor.track({
      endpoint,
      method,
      duration,
      status,
      timestamp: Date.now(),
    });
  }
}

// ==================== GRACEFUL DEGRADATION ====================

/**
 * Executes a request with a fallback value if it fails.
 * Useful for non-critical features (e.g., recommendations, reviews).
 */
export async function withFallback<T>(
  requestFn: () => Promise<T>,
  fallbackValue: T,
  options: { logError?: boolean } = {}
): Promise<T> {
  try {
    return await requestFn();
  } catch (error) {
    if (options.logError !== false) {
      logger.error('[Graceful Degradation] Request failed, using fallback:', { error });
    }
    return fallbackValue;
  }
}

// ==================== OPTIMISTIC UPDATES ====================

/**
 * Performs an optimistic update with rollback on error.
 * 
 * @param updateFn - Function that performs the update
 * @param optimisticValue - Value to return immediately
 * @param rollbackFn - Function to call if update fails
 */
export async function withOptimisticUpdate<T>(
  updateFn: () => Promise<T>,
  optimisticValue: T,
  rollbackFn?: () => void
): Promise<T> {
  try {
    const result = await updateFn();
    return result;
  } catch (error) {
    if (rollbackFn) {
      rollbackFn();
    }
    throw error;
  }
}

// ==================== PAGINATION HELPERS ====================

export interface PaginationParams {
  page: number;
  size: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

/**
 * Generates a cache key for paginated requests.
 */
export function getPaginationCacheKey(
  endpoint: string,
  params: PaginationParams & Record<string, unknown>
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  
  return `${endpoint}?${sortedParams}`;
}

// ==================== RETRY WITH BACKOFF ====================

/**
 * Retries a function with exponential backoff.
 * Useful for non-critical operations that can tolerate delays.
 * 
 * @param fn - Function to retry
 * @param maxRetries - Maximum number of retries
 * @param baseDelay - Base delay in milliseconds
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        logger.warn(`[Retry] Attempt ${attempt + 1}/${maxRetries} failed, waiting ${delay}ms`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

// ==================== PREFETCH HELPERS ====================

/**
 * Prefetches data and stores in cache for instant access later.
 * Useful for predictive loading (e.g., hovering over a link).
 */
export function prefetch<T>(
  key: string,
  requestFn: () => Promise<T>,
  ttl?: number
): void {
  // Don't prefetch if already in cache
  if (apiCache.get(key) !== null) {
    return;
  }

  // Prefetch in background
  withCache(key, requestFn, ttl).catch((error) => {
    logger.error('[Prefetch Failed]', { key, error });
  });
}

// ==================== EXPORTS ====================

// Individual functions and types are exported where they are declared above.
// No additional re-export block to avoid duplicate export errors under TS settings.
