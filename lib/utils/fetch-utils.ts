/**
 * Fetch Utilities - DRY utility functions for API calls
 * Centralizes common fetch patterns to avoid code duplication
 */

import { logger } from '@/lib/observability/logger';

// ============================================================================
// Types
// ============================================================================

export interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
  timeout?: number;
  validateStatus?: (status: number) => boolean;
}

export interface AuthenticatedFetchOptions extends FetchOptions {
  accessToken?: string;
}

export class FetchError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'FetchError';
  }
}

// ============================================================================
// Core Fetch Utilities
// ============================================================================

/**
 * Enhanced fetch with automatic error handling and timeout
 *
 * @example
 * ```ts
 * const data = await safeFetch('/api/users', { timeout: 5000 });
 * ```
 */
export async function safeFetch<T = unknown>(url: string, options: FetchOptions = {}): Promise<T> {
  const {
    timeout = 10000,
    validateStatus = (status) => status >= 200 && status < 300,
    headers = {},
    ...fetchOptions
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!validateStatus(response.status)) {
      const errorData = await response.json().catch(() => null);
      throw new FetchError(
        errorData?.message || errorData?.error || `HTTP ${response.status}`,
        response.status,
        errorData
      );
    }

    return response.json() as Promise<T>;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof FetchError) {
      throw error;
    }

    if ((error as Error).name === 'AbortError') {
      throw new FetchError('Request timeout', 408);
    }

    throw new FetchError(error instanceof Error ? error.message : 'Network error', 0);
  }
}

/**
 * Fetch and return the raw Response while applying timeout handling.
 * Useful when callers need access to response headers in addition to body.
 */
export async function fetchRaw(url: string, options: FetchOptions = {}): Promise<Response> {
  const { timeout = 10000, headers = {}, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if ((error as Error).name === 'AbortError') {
      throw new FetchError('Request timeout', 408);
    }
    throw new FetchError(error instanceof Error ? error.message : 'Network error', 0);
  }
}

/**
 * Authenticated fetch with Bearer token
 *
 * @example
 * ```ts
 * const data = await authenticatedFetch('/api/profile', { accessToken: token });
 * ```
 */
export async function authenticatedFetch<T = unknown>(
  url: string,
  options: AuthenticatedFetchOptions
): Promise<T> {
  const { accessToken, headers = {}, ...restOptions } = options;

  if (!accessToken) {
    throw new FetchError('No access token provided', 401);
  }

  return safeFetch<T>(url, {
    ...restOptions,
    headers: {
      ...headers,
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

/**
 * Fetch with automatic retry on failure
 *
 * @example
 * ```ts
 * const data = await retryFetch('/api/data', { retries: 3, retryDelay: 1000 });
 * ```
 */
export async function retryFetch<T = unknown>(
  url: string,
  options: FetchOptions & { retries?: number; retryDelay?: number } = {}
): Promise<T> {
  const { retries = 3, retryDelay = 1000, ...fetchOptions } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await safeFetch<T>(url, fetchOptions);
    } catch (error) {
      lastError = error as Error;

      // Don't retry on client errors (4xx) except 408, 429
      if (error instanceof FetchError) {
        const shouldRetry =
          error.status === 0 || // Network error
          error.status === 408 || // Timeout
          error.status === 429 || // Rate limit
          error.status >= 500; // Server error

        if (!shouldRetry || attempt === retries) {
          throw error;
        }
      }

      // Wait before retrying
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay * (attempt + 1)));
      }
    }
  }

  throw lastError;
}

// ============================================================================
// Response Handlers
// ============================================================================

/**
 * Handle API response with standardized error extraction
 *
 * @example
 * ```ts
 * const response = await fetch('/api/data');
 * const data = await handleResponse(response);
 * ```
 */
export async function handleResponse<T = unknown>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const message = errorData?.message || errorData?.error || `HTTP ${response.status}`;

    logger.error(`[Fetch] Response error: ${message}`, {
      status: response.status,
      url: response.url,
    });

    throw new FetchError(message, response.status, errorData);
  }

  return response.json() as Promise<T>;
}

/**
 * Create fetch error from response
 */
export async function createFetchError(response: Response): Promise<FetchError> {
  const errorData = await response.json().catch(() => null);
  const message = errorData?.message || errorData?.error || `HTTP ${response.status}`;
  return new FetchError(message, response.status, errorData);
}

// ============================================================================
// URL Helpers
// ============================================================================

/**
 * Build URL with query parameters
 *
 * @example
 * ```ts
 * const url = buildUrl('/api/users', { page: 1, limit: 10 });
 * // '/api/users?page=1&limit=10'
 * ```
 */
export function buildUrl(
  path: string,
  params?: Record<string, string | number | boolean | undefined | null>
): string {
  if (!params) return path;

  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `${path}?${queryString}` : path;
}

/**
 * Ensure URL has protocol and domain
 */
export function normalizeUrl(url: string, baseUrl?: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  if (baseUrl) {
    return `${baseUrl.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
  }

  return url;
}
