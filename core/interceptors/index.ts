import axios, { AxiosError, AxiosInstance } from 'axios';
import { AppError } from '@/core/http/errors';
import { ApiErrorResponse } from '../client/types';

/**
 * [HARDEN] Register Interceptors
 * 
 * Centralizes request/response logic including auth, tracing, and error handling.
 */
function getBreakerNameForUrl(url?: string): string {
  if (!url) return 'default';
  if (url.includes('/products') || url.includes('/catalog')) return 'catalog';
  if (url.includes('/seller')) return 'seller';
  if (url.includes('/auth')) return 'auth';
  if (url.includes('/orders') || url.includes('/checkout')) return 'order';
  return 'default';
}

export function registerInterceptors(instance: AxiosInstance) {
  // Request Interceptor: Inject Correlation ID, Tracing, and Server-side Auth
  instance.interceptors.request.use(async (config) => {
    // 1. Inject Correlation ID & Distributed Observability Tracing Headers
    const correlationId = 
      config.headers['X-Correlation-ID'] || 
      (typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).substring(7));
    
    config.headers['X-Correlation-ID'] = correlationId;

    // Generate W3C Trace Context spec compliant traceparent header
    const generateHex = (len: number) => {
      const chars = '0123456789abcdef';
      let result = '';
      for (let i = 0; i < len; i++) {
        result += chars[Math.floor(Math.random() * 16)];
      }
      return result;
    };
    const traceId = generateHex(32);
    const spanId = generateHex(16);
    config.headers['traceparent'] = `00-${traceId}-${spanId}-01`;
    config.headers['X-Trace-ID'] = traceId;
    config.headers['X-Span-ID'] = spanId;

    // 2. Circuit Breaker Fast-Fail Check
    const url = config.url || 'unknown';
    const breakerName = getBreakerNameForUrl(url);
    if (breakerName !== 'auth') {
      try {
        const { getOrCreateBreaker } = await import('@/platform/resilience');
        const breaker = getOrCreateBreaker(breakerName);
        if (breaker.getState() === 'OPEN') {
          throw new axios.Cancel(`🔌 [CircuitBreaker:${breakerName}] Circuit is OPEN. Fast-failing HTTP request.`);
        }
      } catch (err) {
        if (axios.isCancel(err)) throw err;
      }
    }

    // 3. Auth Injection
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

    // 4. Timing metadata for observability [HARDEN]
    (config as any).metadata = { startTime: Date.now() };

    return config;
  });

  // Response Interceptor: Standardize Error Handling & Observability Tracking
  instance.interceptors.response.use(
    (response) => {
      const startTime = (response.config as any).metadata?.startTime;
      if (startTime) {
        const duration = Date.now() - startTime;
        const correlationId = response.config.headers['X-Correlation-ID'] as string | undefined;
        import('@/platform/observability').then(({ observability }) => {
          observability.trackApiCall(response.config.url || 'unknown', duration, correlationId);
        }).catch(() => {});
      }

      // Record success in Circuit Breaker
      const url = response.config.url;
      const breakerName = getBreakerNameForUrl(url);
      import('@/platform/resilience').then(({ getOrCreateBreaker }) => {
        getOrCreateBreaker(breakerName).recordSuccess();
      }).catch(() => {});

      return response;
    },
    (error: AxiosError<ApiErrorResponse>) => {
      const startTime = (error.config as any)?.metadata?.startTime;
      if (startTime) {
        const duration = Date.now() - startTime;
        const correlationId = error.config?.headers?.['X-Correlation-ID'] as string | undefined;
        import('@/platform/observability').then(({ observability }) => {
          observability.trackApiCall(error.config?.url || 'unknown', duration, correlationId);
        }).catch(() => {});
      }

      // 1. Ignore Cancelled Requests [HARDEN]
      if (axios.isCancel(error)) {
        return Promise.reject(error);
      }

      const apiError = error.response?.data;
      const status = error.response?.status ?? 500;

      // Record failure in Circuit Breaker on transient / server-side failures (>= 500 or Network error)
      const url = error.config?.url;
      const breakerName = getBreakerNameForUrl(url);
      if (status >= 500 || !error.response) {
        import('@/platform/resilience').then(({ getOrCreateBreaker }) => {
          getOrCreateBreaker(breakerName).recordFailure();
        }).catch(() => {});
      }

      // Client-side Toast Notifications
      const bypassToast = error.config?.headers?.['X-Bypass-Toast'] === 'true' || error.config?.headers?.['x-bypass-toast'] === 'true';
      if (typeof window !== 'undefined' && !bypassToast) {
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
