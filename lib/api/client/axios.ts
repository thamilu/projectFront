// Enterprise-grade Axios configuration with resilience patterns
// Features: Auto-retry, circuit breaker ready, request correlation, error normalization

import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import axiosRetry from 'axios-retry';
import { logger } from '@/lib/observability/logger';

// ==================== CONFIGURATION ====================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8082';
const API_TIMEOUT = Number(process.env.NEXT_PUBLIC_API_TIMEOUT) || 30000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // Base delay for exponential backoff

// ==================== AXIOS INSTANCE ====================

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  withCredentials: true, // Important: send cookies with requests
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// ==================== REQUEST INTERCEPTOR ====================

apiClient.interceptors.request.use(
  (config) => {
    // Tokens are now in httpOnly cookies and sent automatically by the browser
    // No need to manually inject Authorization header for client-side requests
    
    // For server-side requests (SSR), cookies are forwarded by Next.js API routes

    // Add correlation ID for distributed tracing
    const correlationId = typeof crypto !== 'undefined' 
      ? crypto.randomUUID() 
      : `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    config.headers['X-Request-ID'] = correlationId;
    config.headers['X-Correlation-ID'] = correlationId;

    // Log request in development
    // Log request in development
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
        correlationId,
        params: config.params,
        data: config.data,
      });
    }

    return config;
  },
  (error) => {
    logger.error('[API Request Error]', { error });
    return Promise.reject(error);
  }
);

// ==================== RESPONSE INTERCEPTOR ====================

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log response in development
    // Log response in development
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data,
      });
    }

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Log error
    // Log error
    logger.error('[API Error]', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });

    // ==================== 401 UNAUTHORIZED: Token Expired ====================
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (typeof window !== 'undefined') {
        try {
          // Attempt to refresh token via Next.js API route
          // The API route will read refreshToken from httpOnly cookie and update it
          const refreshResponse = await fetch('/api/auth/refresh', {
            method: 'POST',
            credentials: 'include', // Important: include cookies
          });

          if (!refreshResponse.ok) {
            throw new Error('Token refresh failed');
          }

          // Tokens are now updated in httpOnly cookies
          // Retry the original request - cookies will be sent automatically
          return apiClient(originalRequest);
        } catch (refreshError) {
          // Refresh failed: Logout user
          logger.error('[Token Refresh Failed]', { error: refreshError });
          
          // Call logout API to clear cookies
          await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
              'X-Requested-With': 'XMLHttpRequest',
            },
            credentials: 'include',
          });

          // Don't redirect - middleware handles auth redirects
          return Promise.reject(refreshError);
        }
      }
    }

    // ==================== ERROR NOTIFICATION ====================
    
    // Only show toast notifications in browser environment
    if (typeof window !== 'undefined') {
      const { toast } = await import('sonner');

      // 403 Forbidden
      if (error.response?.status === 403) {
        toast.error('Access Denied', {
          description: 'You do not have permission to perform this action.',
        });
      }

      // 404 Not Found
      if (error.response?.status === 404) {
        toast.error('Not Found', {
          description: 'The requested resource was not found.',
        });
      }

      // 409 Conflict (e.g., duplicate resource)
      if (error.response?.status === 409) {
        const errorData = error.response?.data as unknown;
        let detail: string | undefined;
        if (errorData && typeof errorData === 'object' && 'detail' in errorData) {
          const d = (errorData as Record<string, unknown>)['detail'];
          if (typeof d === 'string') detail = d;
        }
        toast.error('Conflict', {
          description: detail || 'A resource with this information already exists.',
        });
      }

      // 422 Unprocessable Entity (validation errors)
      if (error.response?.status === 422) {
        const errorData = error.response?.data as unknown;
        let detail: string | undefined;
        if (errorData && typeof errorData === 'object' && 'detail' in errorData) {
          const d = (errorData as Record<string, unknown>)['detail'];
          if (typeof d === 'string') detail = d;
        }
        toast.error('Validation Error', {
          description: detail || 'Please check your input and try again.',
        });
      }

      // 429 Too Many Requests (rate limit)
      if (error.response?.status === 429) {
        toast.error('Rate Limit Exceeded', {
          description: 'Too many requests. Please wait a moment and try again.',
        });
      }

      // 500+ Server Errors
      if (error.response?.status && error.response.status >= 500) {
        toast.error('Server Error', {
          description: 'An unexpected error occurred. Our team has been notified.',
        });

          // Send to error tracking service (e.g., Sentry)
          if (typeof window !== 'undefined') {
            type SentryWindow = { Sentry?: { captureException: (e: unknown) => void } };
            const win = window as unknown as SentryWindow;
            if (win.Sentry && typeof win.Sentry.captureException === 'function') {
              win.Sentry.captureException(error);
            }
          }
      }

      // Network errors (no response)
      if (!error.response) {
        toast.error('Network Error', {
          description: 'Unable to connect to server. Please check your internet connection.',
        });
      }
    }

    return Promise.reject(error);
  }
);

// ==================== RETRY CONFIGURATION ====================

axiosRetry(apiClient, {
  retries: MAX_RETRIES,
  retryDelay: (retryCount) => {
    // Exponential backoff: 1s, 2s, 4s
    // Exponential backoff: 1s, 2s, 4s
    const delay = RETRY_DELAY * Math.pow(2, retryCount - 1);
    logger.info(`[Retry] Attempt ${retryCount}, waiting ${delay}ms`);
    return delay;
  },
  retryCondition: (error: AxiosError) => {
    // Retry on:
    // 1. Network errors (no response)
    // 2. 5xx server errors
    // 3. Specific idempotent 4xx errors (408 Request Timeout, 429 Too Many Requests)
    
    const isNetworkError = !error.response;
    const isServerError = error.response?.status ? error.response.status >= 500 : false;
    const isRetriable4xx = [408, 429].includes(error.response?.status || 0);
    
    // Never retry authentication errors or client validation errors
    const isAuthError = error.response?.status === 401;
    const isForbidden = error.response?.status === 403;
    const isValidationError = error.response?.status === 422;
    
    if (isAuthError || isForbidden || isValidationError) {
      return false;
    }

    // Only retry idempotent methods (GET, HEAD, OPTIONS, PUT, DELETE)
    const isIdempotentMethod = ['get', 'head', 'options', 'put', 'delete'].includes(
      error.config?.method?.toLowerCase() || ''
    );

    return (isNetworkError || isServerError || isRetriable4xx) && isIdempotentMethod;
  },
  onRetry: (retryCount, error, requestConfig) => {
    logger.info(`[Retry] ${retryCount}/${MAX_RETRIES} - ${requestConfig.method?.toUpperCase()} ${requestConfig.url}`);
  },
});

// ==================== ERROR NORMALIZATION ====================

export interface NormalizedError {
  message: string;
  status: number | null;
  code: string | null;
  details: Record<string, string[]> | null;
  originalError: unknown;
}

export function normalizeError(error: unknown): NormalizedError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<unknown>;

    const data = axiosError.response?.data as unknown;

    let messageStr: string | undefined;
    let codeStr: string | null = null;
    let detailsObj: Record<string, string[]> | null = null;

    if (data && typeof data === 'object') {
      const d = data as Record<string, unknown>;
      const maybeMessage = d.detail ?? d.message;
      if (typeof maybeMessage === 'string') messageStr = maybeMessage;
      if (typeof d.type === 'string') codeStr = d.type;
      if (d.errors && typeof d.errors === 'object') detailsObj = d.errors as Record<string, string[]>;
    }

    return {
      message: messageStr || axiosError.message || 'An unexpected error occurred',
      status: axiosError.response?.status || null,
      code: codeStr || axiosError.code || null,
      details: detailsObj || null,
      originalError: error,
    };
  }

  const maybeError = error as { message?: string } | undefined;
  return {
    message: maybeError?.message || 'An unexpected error occurred',
    status: null,
    code: null,
    details: null,
    originalError: error,
  };
}

// ==================== CIRCUIT BREAKER (Future Enhancement) ====================

/**
 * Circuit breaker pattern for critical services.
 * Can be implemented using libraries like 'opossum'.
 * 
 * Usage:
 * ```typescript
 * import CircuitBreaker from 'opossum';
 * 
 * const cartBreaker = new CircuitBreaker(cartApi.getCart, {
 *   timeout: 5000,
 *   errorThresholdPercentage: 50,
 *   resetTimeout: 30000,
 * });
 * 
 * cartBreaker.fallback(() => {
 *   // Return cached data or empty state
 *   return { items: [], total: 0 };
 * });
 * ```
 */

// ==================== HEALTH CHECK ====================

export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/health`, {
      timeout: 5000,
    });
    return response.status === 200;
  } catch (error) {
    logger.error('[Health Check Failed]', { error });
    return false;
  }
}

// ==================== REQUEST CANCELLATION ====================

/**
 * Create a cancellable request using AbortController.
 * 
 * Usage:
 * ```typescript
 * const controller = new AbortController();
 * 
 * apiClient.get('/api/v1/products', {
 *   signal: controller.signal,
 * });
 * 
 * // Cancel the request
 * controller.abort();
 * ```
 */

export function createCancellableRequest<T>(
  request: (signal: AbortSignal) => Promise<T>
): { promise: Promise<T>; cancel: () => void } {
  const controller = new AbortController();
  
  return {
    promise: request(controller.signal),
    cancel: () => controller.abort(),
  };
}

// ==================== EXPORTS ====================

export default apiClient;
