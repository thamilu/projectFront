import { ApiError } from '@/types/api';
import { authenticatedFetch, safeFetch, retryFetch } from '@/lib/utils/fetch-utils';
import { tokenStorage } from '@/lib/axios';

interface RequestConfig extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

interface ApiClientConfig {
  baseUrl: string;
  defaultHeaders?: HeadersInit;
  timeout?: number;
  onUnauthorized?: () => void;
  onError?: (error: ApiError) => void;
}

const DEFAULT_TIMEOUT = 30000;
const DEFAULT_RETRIES = 3;
const DEFAULT_RETRY_DELAY = 1000;

const RETRY_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

class ApiClient {
  private readonly baseUrl: string;
  private readonly defaultHeaders: HeadersInit;
  private readonly timeout: number;
  private readonly onUnauthorized?: () => void;
  private readonly onError?: (error: ApiError) => void;
  private abortControllers: Map<string, AbortController> = new Map();

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...config.defaultHeaders,
    };
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT;
    this.onUnauthorized = config.onUnauthorized;
    this.onError = config.onError;
  }

  private buildUrl(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined>
  ): string {
    const url = new URL(`${this.baseUrl}${endpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  private async executeWithTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    controller: AbortController
  ): Promise<T> {
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await promise;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async executeWithRetry(
    fn: () => Promise<Response>,
    retries: number,
    retryDelay: number
  ): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fn();

        if (response.ok || !RETRY_STATUS_CODES.has(response.status)) {
          return response;
        }

        if (attempt < retries) {
          const delay = retryDelay * Math.pow(2, attempt);
          await this.delay(delay);
        }

        lastError = new Error(`Request failed with status ${response.status}`);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw error;
        }

        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < retries) {
          const delay = retryDelay * Math.pow(2, attempt);
          await this.delay(delay);
        }
      }
    }

    throw lastError ?? new Error('Request failed after retries');
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    if (!response.ok) {
      let errorData: Record<string, unknown> = {};

      if (isJson) {
        try {
          errorData = await response.json();
        } catch {
          // Response body is not valid JSON
        }
      }

      const apiError = new ApiError(
        (errorData.message as string) ??
          (errorData.error as string) ??
          `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData.errors as Record<string, string[]> | undefined,
        errorData.code as string | undefined
      );

      if (response.status === 401 && this.onUnauthorized) {
        this.onUnauthorized();
      }

      if (this.onError) {
        this.onError(apiError);
      }

      throw apiError;
    }

    if (response.status === 204 || !isJson) {
      return {} as T;
    }

    return response.json();
  }

  private getRequestKey(method: string, url: string): string {
    return `${method}:${url}`;
  }

  public cancelRequest(method: string, endpoint: string): void {
    const key = this.getRequestKey(method, endpoint);
    const controller = this.abortControllers.get(key);

    if (controller) {
      controller.abort();
      this.abortControllers.delete(key);
    }
  }

  public cancelAllRequests(): void {
    this.abortControllers.forEach((controller) => controller.abort());
    this.abortControllers.clear();
  }

  private async request<T>(
    method: string,
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<T> {
    const {
      params,
      timeout = this.timeout,
      retries = DEFAULT_RETRIES,
      retryDelay = DEFAULT_RETRY_DELAY,
      headers,
      body,
      ...restConfig
    } = config;

    const url = this.buildUrl(endpoint, params);
    const requestKey = this.getRequestKey(method, url);

    // Build headers object
    const requestHeaders = Object.fromEntries(new Headers(this.defaultHeaders).entries());

    if (headers) {
      const headerEntries =
        headers instanceof Headers ? Array.from(headers.entries()) : Object.entries(headers);
      headerEntries.forEach(([key, value]) => {
        if (value) requestHeaders[key] = value as string;
      });
    }

    // Get auth token using shared tokenStorage
    const token = this.getAuthToken();

    // Use centralized fetch utilities (authenticatedFetch / retryFetch)
    try {
      const fetchOptions: any = {
        headers: requestHeaders,
        timeout,
      };

      if (token) {
        // Use authenticatedFetch with retry logic
        const payload = await retryFetch<T>(url, {
          retries,
          retryDelay,
          ...fetchOptions,
          accessToken: token,
        });
        return payload;
      }

      // Unauthenticated request
      const payload = await retryFetch<T>(url, { retries, retryDelay, ...fetchOptions });
      return payload;
    } finally {
      // best-effort cleanup for abort controllers (legacy API kept)
      this.abortControllers.delete(requestKey);
    }
  }

  private getAuthToken(): string | null {
    // Prefer tokenStorage (shared axios token helpers)
    try {
      const access = typeof window === 'undefined' ? null : tokenStorage.getAccessToken();
      return access ?? null;
    } catch {
      return null;
    }
  }

  public get<T>(endpoint: string, config?: Omit<RequestConfig, 'body'>): Promise<T> {
    return this.request<T>('GET', endpoint, config);
  }

  public post<T, D = unknown>(
    endpoint: string,
    data?: D,
    config?: Omit<RequestConfig, 'body'>
  ): Promise<T> {
    return this.request<T>('POST', endpoint, { ...config, body: data as unknown as BodyInit });
  }

  public put<T, D = unknown>(
    endpoint: string,
    data?: D,
    config?: Omit<RequestConfig, 'body'>
  ): Promise<T> {
    return this.request<T>('PUT', endpoint, { ...config, body: data as unknown as BodyInit });
  }

  public patch<T, D = unknown>(
    endpoint: string,
    data?: D,
    config?: Omit<RequestConfig, 'body'>
  ): Promise<T> {
    return this.request<T>('PATCH', endpoint, { ...config, body: data as unknown as BodyInit });
  }

  public delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>('DELETE', endpoint, config);
  }
}

// Singleton instance
const apiClient = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8082',
  onUnauthorized: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      // Don't redirect - middleware handles auth redirects
    }
  },
});

export { apiClient, ApiClient };
export type { RequestConfig, ApiClientConfig };
