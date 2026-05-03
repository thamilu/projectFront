/**
 * Authenticated Fetch Hook
 *
 * Provides fetch wrapper with automatic Bearer token injection
 * and session expiry handling.
 *
 * @module hooks/use-authenticated-fetch
 */

'use client';

import { useAuth } from './use-auth-nextauth';
import { useCallback } from 'react';
import { authenticatedFetch as authFetchUtil } from '@/lib/utils/fetch-utils';
import { AuthenticationError } from '@/lib/utils/error-utils';

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8082';

interface FetchOptions extends Omit<RequestInit, 'headers'> {
  headers?: Record<string, string>;
}

export interface UseAuthenticatedFetchReturn {
  authFetch: <T = unknown>(endpoint: string, options?: FetchOptions) => Promise<T>;
}

/**
 * Hook for making authenticated API calls
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { authFetch } = useAuthenticatedFetch();
 *
 *   const loadData = async () => {
 *     try {
 *       const data = await authFetch<Product[]>('/api/v1/products');
 *       setProducts(data);
 *     } catch (error) {
 *       console.error('Failed to load products:', error);
 *     }
 *   };
 *
 *   return <button onClick={loadData}>Load</button>;
 * }
 * ```
 */
export function useAuthenticatedFetch(): UseAuthenticatedFetchReturn {
  const { accessToken, isAuthenticated, login } = useAuth();

  const authFetch = useCallback(
    async <T = unknown>(endpoint: string, options: FetchOptions = {}): Promise<T> => {
      if (!isAuthenticated || !accessToken) {
        await login();
        throw new AuthenticationError('Authentication required');
      }

      try {
        return await authFetchUtil<T>(`${API_URL}${endpoint}`, {
          ...options,
          accessToken,
        });
      } catch (error) {
        // Handle 401 by triggering re-login
        if (error instanceof AuthenticationError) {
          await login();
        }
        throw error;
      }
    },
    [accessToken, isAuthenticated, login]
  );

  return { authFetch };
}
