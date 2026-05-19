import { useState, useCallback } from 'react';
import { apiClient } from '@/core/client';
import { AppError } from '@/core/http/errors';

/**
 * Legacy Authenticated Fetch Hook
 * 
 * @deprecated Use `apiClient` directly from `@/core/client` for better 
 * enterprise-grade observability and consistency.
 */
export function useAuthenticatedFetch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  const fetchAuthenticated = useCallback(async <T>(url: string, options: any = {}): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      // Use the hardened apiClient which automatically handles tokens and sessions
      const response = await apiClient.get<T>(url, options);
      return response.data;
    } catch (err: unknown) {
      const appError = err instanceof AppError 
        ? err 
        : new AppError(500, 'FETCH_ERROR', err instanceof Error ? err.message : 'Unknown error');
      
      setError(appError);
      console.error('[LegacyFetch] Error:', appError);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { fetchAuthenticated, loading, error };
}
