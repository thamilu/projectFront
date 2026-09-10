import axios, { AxiosInstance } from 'axios';
import { AppError } from '@/core/http/errors';

/**
 * [HARDEN] Register Interceptors
 *
 * Centralizes request/response logic including auth, tracing, and error handling.
 */
export function getBreakerNameForUrl(url?: string): string {
  if (!url) return 'default';
  if (url.includes('/products') || url.includes('/catalog')) return 'catalog';
  if (url.includes('/seller')) return 'seller';
  if (url.includes('/auth')) return 'auth';
  if (url.includes('/orders') || url.includes('/checkout')) return 'order';
  return 'default';
}

/** Public catalog reads do not require session lookup during SSR. */
function isPublicCatalogRead(method: string | undefined, url: string | undefined): boolean {
  if ((method ?? 'get').toLowerCase() !== 'get' || !url) return false;
  return (
    url.includes('/products') ||
    url.includes('/categories') ||
    url.includes('/brands') ||
    url.includes('/tags') ||
    url.includes('/stores')
  );
}

export function registerInterceptors(instance: AxiosInstance) {
  // Request Interceptor: Inject Correlation ID, Tracing, and Server-side Auth
  instance.interceptors.request.use(async (config) => {
    // 0. Normalize request URL to prevent double prepending of /api/v1
    const reqUrl = config.url || '';
    const baseURL = config.baseURL || '';
    if (baseURL.replace(/\/+$/, '').endsWith('/api/v1') && reqUrl.startsWith('/api/v1')) {
      config.url = reqUrl.substring('/api/v1'.length);
    }

    // 1. Inject Correlation ID & Distributed Observability Tracing Headers
    const correlationId =
      config.headers['X-Correlation-ID'] ||
      (typeof crypto !== 'undefined'
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(7));

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
        const breaker = getOrCreateBreaker(breakerName, {
          failureThreshold: typeof window === 'undefined' ? 2 : 5,
          recoveryTimeoutMs: 10_000,
        });
        if (breaker.getState() === 'OPEN') {
          throw new axios.Cancel(
            `🔌 [CircuitBreaker:${breakerName}] Circuit is OPEN. Fast-failing HTTP request.`
          );
        }
      } catch (err) {
        if (axios.isCancel(err)) throw err;
      }
    }

    // 3. Auth Injection (server-side only)
    //
    // Client-side requests intentionally do NOT fetch/attach a token here.
    // apiClient's client-side baseURL is '' (relative, same-origin — see
    // core/client/axios.ts), and those requests are rewritten to the real
    // backend by next.config.ts's rewrites(). proxy.ts (this app's
    // middleware) already attaches the Authorization header server-side to
    // every /api/* request before that rewrite happens, for any
    // authenticated session — so by the time this interceptor would run
    // client-side, the header is already set on the outgoing request.
    // A previous version of this branch redundantly fetched the raw token
    // to the browser via /api/get-token and attached it here too — that
    // provided no additional functionality (the middleware's header wins
    // regardless) while needlessly putting the raw access token in reach of
    // any client-side JavaScript, including an XSS payload. Removed rather
    // than kept as defense-in-depth: it wasn't defending anything the
    // middleware doesn't already handle, only widening the token's exposure
    // surface for no benefit.
    if (typeof window === 'undefined') {
      const skipAuth = isPublicCatalogRead(config.method, config.url);

      if (!skipAuth) {
        try {
          const { getServerAccessToken } = await import('@/core/auth/server-session');
          const accessToken = await getServerAccessToken();
          if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
          }
        } catch (error) {
          const { logger } = await import('@/core/telemetry/logger');
          logger.warn('[interceptors] Failed to inject server-side auth', {
            error: error instanceof Error ? error.message : String(error),
          });
        }
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
        import('@/platform/observability')
          .then(({ observability }) => {
            observability.trackApiCall(response.config.url || 'unknown', duration, correlationId);
          })
          .catch(() => {});
      }

      // Record success in Circuit Breaker
      const url = response.config.url;
      const breakerName = getBreakerNameForUrl(url);
      import('@/platform/resilience')
        .then(({ getOrCreateBreaker }) => {
          getOrCreateBreaker(breakerName).recordSuccess();
        })
        .catch(() => {});

      return response;
    },
    (error: any) => {
      const startTime = (error.config as any)?.metadata?.startTime;
      if (startTime) {
        const duration = Date.now() - startTime;
        const correlationId = error.config?.headers?.['X-Correlation-ID'] as string | undefined;
        import('@/platform/observability')
          .then(({ observability }) => {
            observability.trackApiCall(error.config?.url || 'unknown', duration, correlationId);
          })
          .catch(() => {});
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
        import('@/platform/resilience')
          .then(({ getOrCreateBreaker }) => {
            getOrCreateBreaker(breakerName).recordFailure();
          })
          .catch(() => {});
      }

      // Client-side Toast Notifications
      const bypassToast =
        error.config?.headers?.['X-Bypass-Toast'] === 'true' ||
        error.config?.headers?.['x-bypass-toast'] === 'true';
      if (typeof window !== 'undefined' && !bypassToast) {
        import('sonner')
          .then(({ toast }) => {
            const message =
              apiError?.message ||
              (apiError as any)?.detail ||
              error.message ||
              'An unexpected error occurred';

            switch (status) {
              case 403:
                toast.error('Access Denied', {
                  description: 'You do not have permission to perform this action.',
                });
                break;
              case 404:
                toast.error('Not Found', { description: 'The requested resource was not found.' });
                break;
              case 422:
                toast.error('Validation Error', { description: message });
                break;
              case 429:
                toast.error('Rate Limit Exceeded', {
                  description: 'Too many requests. Please try again later.',
                });
                break;
              default:
                if (status >= 500) {
                  toast.error('Server Error', {
                    description: message || 'Something went wrong on our end.',
                  });
                }
            }
          })
          .catch(() => {});
      }

      if (apiError) {
        throw new AppError(
          status,
          apiError.errorCode ?? apiError.code ?? 'UNKNOWN_ERROR',
          apiError.message || 'An unexpected error occurred',
          apiError.fieldErrors
        );
      }

      throw new AppError(status, 'NETWORK_ERROR', error.message || 'Connection to backend failed');
    }
  );
}
