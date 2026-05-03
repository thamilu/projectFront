/**
 * Centralized API client wrapper (versioned)
 * - Adds API version prefix `/api/v1`
 * - Normalizes response envelope `ApiResponse<T>`
 * - Delegates transport to the axios instance
 */

import axiosInstance from '../axios';
import CircuitBreaker, { CircuitOpenError } from './circuit-breaker';
import type { ApiResponse } from '@/types';

const API_VERSION = '/api/v1';

const breaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeout: 30_000,
  halfOpenMaxSuccesses: 2,
});

// Simple error normalizer
function normalizeError(err: unknown): Error {
  if (err instanceof Error) return err;
  if (typeof err === 'object' && err !== null) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const message = (err as any).message || JSON.stringify(err);
    const error = new Error(message);
    Object.assign(error, err);
    return error;
  }
  return new Error(String(err));
}

export async function request<T = unknown>(
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  path: string,
  options?: { params?: Record<string, unknown>; data?: unknown }
): Promise<ApiResponse<T>> {
  const url = `${API_VERSION}${path}`;

  try {
    const resp = await breaker.execute(url, () =>
      axiosInstance.request<ApiResponse<T>>({
        url,
        method,
        params: options?.params,
        data: options?.data,
      })
    );

    return resp.data as ApiResponse<T>;
  } catch (err: unknown) {
    // If circuit is open, normalize to a clear error
    if (err instanceof CircuitOpenError) {
      throw normalizeError({
        message: 'Service temporarily unavailable',
        code: 'CIRCUIT_OPEN',
        status: 503,
      });
    }

    // Pass through unknown error to normalizer
    throw normalizeError(err);
  }
}

export const api = {
  get: <T = unknown>(path: string, params?: Record<string, unknown>) =>
    request<T>('get', path, { params }),
  post: <T = unknown>(path: string, data?: unknown) => request<T>('post', path, { data }),
  put: <T = unknown>(path: string, data?: unknown) => request<T>('put', path, { data }),
  patch: <T = unknown>(path: string, data?: unknown) => request<T>('patch', path, { data }),
  delete: <T = unknown>(path: string) => request<T>('delete', path),
};

export type { ApiResponse };
