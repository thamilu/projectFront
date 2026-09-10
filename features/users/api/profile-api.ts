/**
 * @module profile-api
 * @description API communication layer for user and seller profile retrieval.
 */

import axios from 'axios';
import { apiClient } from '@/core/client';
import { API_ENDPOINTS } from '@/shared/constants/api/endpoints';
import { globalTelemetry } from '../utils/profile-telemetry';
import {
  getProfileCache,
  getInflightRequests,
  sanitizeUserId,
  invalidateCache,
  buildProfileCacheKey,
  type CacheEntry,
  type InflightRequest,
} from '../utils/profile-cache';

export interface FetchProfileResult {
  readonly data: Record<string, unknown>;
  readonly sellerFound: boolean;
}

export interface ProfileApiResponse {
  readonly data: {
    readonly data: Record<string, unknown>;
  };
}

export interface ApiError {
  readonly statusCode?: number;
  readonly status?: number;
  readonly name?: string;
  readonly message?: string;
}

export const RETRY_CONFIG = {
  MAX_RETRIES: 2,
  BASE_DELAY_MS: 500,
} as const;

export function isApiError(err: unknown): err is ApiError {
  return typeof err === 'object' && err !== null;
}

export function getStatusCode(err: unknown): number | undefined {
  if (!isApiError(err)) return undefined;
  return (
    err.statusCode ?? err.status ?? (err as { response?: { status?: number } }).response?.status
  );
}

/** Substrings identifying a circuit-breaker rejection, centralized so callers never duplicate the match. */
const CIRCUIT_BREAKER_MARKERS = ['CircuitBreaker', 'Circuit is OPEN'] as const;

export function isCircuitBreakerMessage(message: string | null | undefined): boolean {
  if (!message) return false;
  return CIRCUIT_BREAKER_MARKERS.some((marker) => message.includes(marker));
}

/** True when `err` represents a circuit-breaker rejection rather than a real network/user cancellation. */
export function isCircuitBreakerError(err: unknown): boolean {
  if (axios.isCancel(err)) return isCircuitBreakerMessage(err.message);
  if (err instanceof Error) return isCircuitBreakerMessage(err.message);
  return false;
}

export function isAbortError(err: unknown): boolean {
  if (axios.isCancel(err)) {
    if (isCircuitBreakerMessage(err.message)) return false;
    return true;
  }
  if (!(err instanceof Error)) return false;
  return (
    err.name === 'AbortError' ||
    err.name === 'CanceledError' ||
    err.message === 'canceled' ||
    (err as { code?: string }).code === 'ERR_CANCELED'
  );
}

export function toError(err: unknown, fallbackMessage: string): Error {
  if (err instanceof Error) return err;
  if (typeof err === 'string') return new Error(err);
  return new Error(fallbackMessage);
}

export function isRetryableError(err: unknown): boolean {
  if (
    err instanceof TypeError ||
    err instanceof ReferenceError ||
    err instanceof SyntaxError ||
    err instanceof RangeError
  ) {
    return false;
  }

  if (axios.isCancel(err) && isCircuitBreakerMessage(err.message)) {
    return false;
  }

  if (!isApiError(err)) return true;
  const statusCode = getStatusCode(err);
  if (statusCode === undefined) return true;
  if (statusCode === 429) return true;
  if (statusCode >= 500) return true;
  return false;
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    };

    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);

    signal.addEventListener('abort', onAbort, { once: true });
  });
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  signal: AbortSignal,
  userId: string
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= RETRY_CONFIG.MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      if (signal.aborted || isAbortError(err)) throw err;
      lastError = err;
      if (!isRetryableError(err) || attempt >= RETRY_CONFIG.MAX_RETRIES) {
        const finalError = toError(err, 'Request failed after retries') as Error & {
          _retryAttempt?: number;
        };
        finalError._retryAttempt = attempt;
        throw finalError;
      }
      const delay = RETRY_CONFIG.BASE_DELAY_MS * 2 ** attempt;
      globalTelemetry.onRetry?.(userId, attempt + 1, delay);
      await sleep(delay, signal);
    }
  }

  throw lastError;
}

export function extractProfileData(response: ProfileApiResponse): Record<string, unknown> {
  const data = response?.data?.data;

  if (data === null || data === undefined) {
    throw new Error(`Profile API response missing data: received ${String(data)}`);
  }
  if (typeof data !== 'object') {
    throw new Error(`Profile API response wrong type: expected object, received ${typeof data}`);
  }
  if (Array.isArray(data)) {
    throw new Error(`Profile API response wrong type: expected object, received array`);
  }

  return data;
}

export async function fetchSellerProfile(
  signal: AbortSignal,
  userId: string
): Promise<FetchProfileResult> {
  try {
    const response = await withRetry(
      () =>
        apiClient.get<ProfileApiResponse>(API_ENDPOINTS.SELLER.PROFILE, {
          signal,
          headers: { 'X-Bypass-Toast': 'true' },
        }),
      signal,
      userId
    );
    return { data: extractProfileData(response), sellerFound: true };
  } catch (err: unknown) {
    if (signal.aborted || isAbortError(err)) throw err;

    const statusCode = getStatusCode(err);
    if (statusCode !== 404) {
      throw toError(err, 'Seller profile fetch failed');
    }

    const userResponse = await withRetry(
      () => apiClient.get<ProfileApiResponse>(API_ENDPOINTS.USERS.PROFILE, { signal }),
      signal,
      userId
    );
    return { data: extractProfileData(userResponse), sellerFound: false };
  }
}

export async function fetchUserProfile(
  signal: AbortSignal,
  userId: string
): Promise<FetchProfileResult> {
  const response = await withRetry(
    () => apiClient.get<ProfileApiResponse>(API_ENDPOINTS.USERS.PROFILE, { signal }),
    signal,
    userId
  );
  return { data: extractProfileData(response), sellerFound: false };
}

export async function fetchProfileData(
  isSellerRole: boolean,
  signal: AbortSignal,
  userId: string
): Promise<FetchProfileResult> {
  const startTime = performance.now();
  globalTelemetry.onFetchStart?.(userId, isSellerRole);
  try {
    const result = isSellerRole
      ? await fetchSellerProfile(signal, userId)
      : await fetchUserProfile(signal, userId);
    globalTelemetry.onFetchSuccess?.(userId, performance.now() - startTime);
    return result;
  } catch (err) {
    const attempt = (err as { _retryAttempt?: number })._retryAttempt ?? 0;
    globalTelemetry.onFetchError?.(userId, toError(err, 'Fetch failed'), attempt);
    throw err;
  }
}

export async function fetchProfileDataDeduped(
  userId: string,
  isSellerRole: boolean,
  signal: AbortSignal
): Promise<FetchProfileResult> {
  const requests = getInflightRequests();
  const cleanUserId = sanitizeUserId(userId) ?? userId;
  const key = `profile:${encodeURIComponent(cleanUserId)}:${String(isSellerRole)}`;

  if (!requests) {
    const controller = new AbortController();
    return fetchProfileData(isSellerRole, controller.signal, cleanUserId);
  }

  const existing = requests.get(key);
  if (existing && !existing.networkController.signal.aborted) {
    if (signal.aborted) {
      return Promise.reject(new DOMException('Aborted', 'AbortError'));
    }

    const onAbort = () => {
      existing.signals.delete(signal);
      existing.listeners.delete(signal);
      if (existing.signals.size === 0) {
        existing.networkController.abort();
      }
    };

    signal.addEventListener('abort', onAbort);
    existing.signals.add(signal);
    existing.listeners.set(signal, onAbort);

    return existing.promise;
  }

  const networkController = new AbortController();
  const signals = new Set<AbortSignal>();
  const listeners = new Map<AbortSignal, () => void>();

  const onAbort = () => {
    signals.delete(signal);
    listeners.delete(signal);
    if (signals.size === 0) {
      networkController.abort();
    }
  };

  if (!signal.aborted) {
    signal.addEventListener('abort', onAbort);
    signals.add(signal);
    listeners.set(signal, onAbort);
  } else {
    return Promise.reject(new DOMException('Aborted', 'AbortError'));
  }

  const promise = fetchProfileData(isSellerRole, networkController.signal, cleanUserId).finally(
    () => {
      for (const [sig, listener] of listeners.entries()) {
        sig.removeEventListener('abort', listener);
      }
      requests.delete(key);
    }
  );

  const requestRecord: InflightRequest = {
    promise,
    signals,
    listeners,
    networkController,
  };

  requests.set(key, requestRecord);
  return promise;
}

export const profileCacheService = {
  invalidate: invalidateCache,
  warmUp: (userId: string, isSellerRole: boolean): (() => void) => {
    const controller = new AbortController();
    const cleanUserId = sanitizeUserId(userId);

    if (!cleanUserId) return () => controller.abort();

    (async () => {
      const cache = getProfileCache();
      if (!cache) return;

      const cacheKey = buildProfileCacheKey(cleanUserId, isSellerRole);
      const cached = cache.get(cacheKey);
      if (cached !== null) {
        globalTelemetry.onCacheHit?.(cleanUserId);
        return;
      }

      globalTelemetry.onCacheMiss?.(cleanUserId);
      const startTime = performance.now();
      globalTelemetry.onFetchStart?.(cleanUserId, isSellerRole);

      try {
        const result = await fetchProfileDataDeduped(cleanUserId, isSellerRole, controller.signal);
        cache.set(cacheKey, {
          data: result.data,
          hasSellerProfile: result.sellerFound,
          timestamp: Date.now(),
        } satisfies CacheEntry);
        globalTelemetry.onFetchSuccess?.(cleanUserId, performance.now() - startTime);
      } catch (err: unknown) {
        if (controller.signal.aborted || isAbortError(err)) return;
        const attempt = (err as { _retryAttempt?: number })._retryAttempt ?? 0;
        globalTelemetry.onFetchError?.(cleanUserId, toError(err, 'Warmup fetch failed'), attempt);
      }
    })();

    return () => controller.abort();
  },
};
