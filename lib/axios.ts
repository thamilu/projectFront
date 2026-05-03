import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import axiosRetry from 'axios-retry';
import { ApiError } from '@/types';
import { env } from '@/config/env.config';
import { logger } from '@/lib/observability/logger';
import { APP_ROUTES } from '@/constants/routes/app-routes';

// ===========================================================================
// SECURITY NOTE: Pure Session-Based Authentication
// ===========================================================================
// This application uses NextAuth httpOnly cookies for all authentication.
// ❌ NO tokens are stored in localStorage/sessionStorage.
// This effectively mitigates XSS-based token theft risks.
// ===========================================================================

// Environment validation
const API_URL = env.apiBaseUrl;
if (!API_URL) {
  throw new Error('NEXT_PUBLIC_API_BASE_URL is not defined');
}

// Call backend directly to ensure Authorization header is forwarded
const isServer = typeof window === 'undefined';
const baseURL = isServer
  ? env.backendApiUrl || (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace('/api/v1', '') : '')
  : API_URL;

/**
 * Singleton API Client
 * 
 * Both share the same configuration and interceptors. 
 * Note: getSession() calls are cached within the request interceptor to prevent redundant overhead.
 */
export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
  withCredentials: true,
});

/**
 * Legacy instance (default export) - now an alias of apiClient
 * We maintain this to avoid breaking changes in older services.
 */
export const axiosInstance = apiClient;

// Shared request interceptor to attach access token from NextAuth session
const authRequestInterceptor = async (config: InternalAxiosRequestConfig) => {
  // If no-auth flag is present, skip session attachment
  if (config.headers?.['X-No-Auth']) {
    delete config.headers['X-No-Auth'];
    return config;
  }

  if (typeof window !== 'undefined') {
    // Client-side: use session from SessionProvider
    const { getSession } = await import('next-auth/react');
    const session = await getSession();
    if (session?.accessToken && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${session.accessToken}`;
    }
  } else {
    // Server-side: attach token from NextAuth session
    try {
      const { getServerSession } = await import('next-auth');
      const { authOptions } = await import('@/lib/auth-config');
      const session = await getServerSession(authOptions);
      const accessToken = (session as any)?.accessToken as string | undefined;
      if (accessToken && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    } catch {
      // Proceed unauthenticated if NextAuth isn't configured
    }
  }

  return config;
};

const authRequestErrorHandler = (error: unknown) => {
  return Promise.reject(error);
};

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/**
 * Normalizes an Axios error into a typed ApiError and throws it.
 */
export function transformApiError(error: AxiosError): never {
  const status = error.response?.status || 0;

  if (!error.response) {
    const apiError: ApiError = {
      message: error.message || 'Network error: Unable to reach the server',
      status: 0,
    };
    throw apiError;
  }

  const apiError: ApiError = {
    message: `Request failed (${status})`,
    status,
  };

  if (error.response?.data) {
    const data = error.response.data as any;
    apiError.message = data.detail || data.message || data.error || data.title || apiError.message;
    apiError.errors = data.errors;
  }

  throw apiError;
}

/**
 * Handles 401 responses: redirects to login if session is expired.
 */
function handle401Redirect(error: AxiosError): Promise<never> {
  if (error.response?.status === 401) {
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith(APP_ROUTES.AUTH_LOGIN) && !currentPath.startsWith('/api/auth')) {
        window.location.href = `${APP_ROUTES.AUTH_LOGIN}?session_expired=true&callbackUrl=${encodeURIComponent(currentPath)}`;
      }
    }
  }
  return Promise.reject(error);
}

/**
 * Configures exponential-backoff retry.
 */
function configureRetry(instance: typeof apiClient): void {
  axiosRetry(instance, {
    retries: 3,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: (error: AxiosError) =>
      axiosRetry.isNetworkOrIdempotentRequestError(error) || (error.response?.status ?? 0) >= 500,
    shouldResetTimeout: true,
  });
}

// ---------------------------------------------------------------------------
// Register interceptors
// ---------------------------------------------------------------------------

// 1. Auth & 401 guard
apiClient.interceptors.request.use(authRequestInterceptor, authRequestErrorHandler);
apiClient.interceptors.response.use((r) => r, handle401Redirect);

// 2. Dev logging + error transform
const loggedErrors = new Set<string>();

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    if (process.env.NODE_ENV === 'development') {
      logger.debug('✅ API Response:', { status: response.status, url: response.config.url });
    }
    return response;
  },
  (error: AxiosError) => {
    const url = error.config?.url || 'unknown';
    const status = error.response?.status || 0;

    if (process.env.NODE_ENV === 'development') {
      const message = error.message || 'Unknown error';
      const errorKey = `${status}-${url}-${message}`;
      if (!loggedErrors.has(errorKey)) {
        loggedErrors.add(errorKey);
        logger.error(`❌ API Error [${status || 'network'}] ${url}:`, { message });
      }
    }

    return Promise.reject(transformApiError(error));
  }
);

// 3. Retry
configureRetry(apiClient);

export default axiosInstance;
