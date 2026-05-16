import axios, { AxiosError, AxiosInstance } from 'axios';
import { AppError } from '@/lib/errors/AppError';
import { ApiErrorResponse } from './types';

/**
 * [HARDEN] Register Interceptors
 * 
 * Centralizes request/response logic including auth, tracing, and error handling.
 */
export function registerInterceptors(instance: AxiosInstance) {
  // Request Interceptor: Inject Correlation ID and Server-side Auth
  instance.interceptors.request.use(async (config) => {
    // 1. Inject Correlation ID
    const correlationId = 
      config.headers['X-Correlation-ID'] || 
      (typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).substring(7));
    
    config.headers['X-Correlation-ID'] = correlationId;

    // 2. Auth Injection
    if (typeof window === 'undefined') {
      try {
        const { auth } = await import('@/auth');
        const session = await auth();
        if (session?.accessToken) {
          config.headers.Authorization = `Bearer ${session.accessToken}`;
        }
      } catch (error) {
        console.warn('[interceptors] Failed to inject server-side auth:', error);
      }
    } else {
      try {
        const { getSession } = await import('next-auth/react');
        const session = await getSession();
        if (session?.accessToken) {
          config.headers.Authorization = `Bearer ${session.accessToken}`;
        }
      } catch (error) {
        console.warn('[interceptors] Failed to inject client-side auth:', error);
      }
    }

    return config;
  });

  // Response Interceptor: Standardize Error Handling
  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ApiErrorResponse>) => {
      // 1. Ignore Cancelled Requests [HARDEN]
      if (axios.isCancel(error)) {
        return Promise.reject(error);
      }

      const apiError = error.response?.data;
      const status = error.response?.status ?? 500;

      // Client-side Toast Notifications
      if (typeof window !== 'undefined') {
        import('sonner').then(({ toast }) => {
          const message = apiError?.message || (apiError as any)?.detail || error.message || 'An unexpected error occurred';
          
          switch (status) {
            case 403:
              toast.error('Access Denied', { description: 'You do not have permission to perform this action.' });
              break;
            case 404:
              toast.error('Not Found', { description: 'The requested resource was not found.' });
              break;
            case 422:
              toast.error('Validation Error', { description: message });
              break;
            case 429:
              toast.error('Rate Limit Exceeded', { description: 'Too many requests. Please try again later.' });
              break;
            default:
              if (status >= 500) {
                toast.error('Server Error', { description: message || 'Something went wrong on our end.' });
              }
          }
        }).catch(() => {});
      }

      if (apiError) {
        throw new AppError(
          status,
          apiError.errorCode ?? apiError.code ?? 'UNKNOWN_ERROR',
          apiError.message || 'An unexpected error occurred',
          apiError.fieldErrors
        );
      }

      throw new AppError(
        status,
        'NETWORK_ERROR',
        error.message || 'Connection to backend failed'
      );
    }
  );
}
