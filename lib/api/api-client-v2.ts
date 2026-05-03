/**
 * Enterprise API Client
 * 
 * Features:
 * - Standardized error handling
 * - Automatic retry with exponential backoff
 * - Request/response logging with correlation IDs
 * - Circuit breaker pattern
 * - Response validation with Zod
 * - Type-safe API calls
 * 
 * @module lib/api/api-client-v2
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError, AxiosResponse } from 'axios';
import axiosRetry, { exponentialDelay } from 'axios-retry';
import { z } from 'zod';
import {
  ApiSuccessResponse,
  ApiErrorResponseSchema,
  createApiError,
  NetworkError,
  TimeoutError,
  ApiError,
} from './api-types';
import { logger } from '@/lib/observability/logger';

// ============================================================================
// Configuration
// ============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8082';
const API_VERSION = '/api/v1';
const API_TIMEOUT = Number(process.env.NEXT_PUBLIC_API_TIMEOUT) || 30000;
const MAX_RETRIES = 3;

interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

const circuitBreaker: CircuitBreakerState = {
  failures: 0,
  lastFailureTime: 0,
  state: 'CLOSED',
};

const CIRCUIT_BREAKER_THRESHOLD = 5;
const CIRCUIT_BREAKER_TIMEOUT = 60000; // 60s

// ============================================================================
// Axios Instance Configuration
// ============================================================================

const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}${API_VERSION}`,
  timeout: API_TIMEOUT,
  withCredentials: true, // Send httpOnly cookies
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Extend AxiosRequestConfig to carry internal correlationId
interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
  correlationId?: string;
}

// ============================================================================
// Retry Configuration
// ============================================================================

axiosRetry(apiClient, {
  retries: MAX_RETRIES,
  retryDelay: exponentialDelay,
  retryCondition: (error: AxiosError) => {
    // Retry on network errors
    if (!error.response) return true;
    
    const status = error.response.status;
    
    // Retry on 5xx server errors (except 501 Not Implemented)
    if (status >= 500 && status !== 501) return true;
    
    // Retry on 429 Rate Limit (with backoff)
    if (status === 429) return true;
    
    // Retry on 408 Request Timeout
    if (status === 408) return true;
    
    // Don't retry on 4xx client errors
    return false;
  },
  onRetry: (retryCount, error, requestConfig) => {
    const url = requestConfig.url || 'unknown';
    logger.warn(`[API] Retry ${retryCount}/${MAX_RETRIES} for ${url}`, {
      status: error.response?.status,
      message: error.message,
    });
  },
});

// ============================================================================
// Request Interceptor
// ============================================================================

apiClient.interceptors.request.use(
  (config) => {
    // Check circuit breaker
    if (circuitBreaker.state === 'OPEN') {
      const now = Date.now();
      if (now - circuitBreaker.lastFailureTime < CIRCUIT_BREAKER_TIMEOUT) {
        throw new Error('Circuit breaker is OPEN - service unavailable');
      } else {
        // Transition to HALF_OPEN
        circuitBreaker.state = 'HALF_OPEN';
        circuitBreaker.failures = 0;
      }
    }
    
    // Generate correlation ID
    const correlationId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `req-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    
    config.headers['X-Request-ID'] = correlationId;
    config.headers['X-Correlation-ID'] = correlationId;
    
    // Store correlation ID for response logging
    (config as ExtendedAxiosRequestConfig).correlationId = correlationId;
    
    // Log request (excluding sensitive data)
    // Log request (excluding sensitive data)
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
        correlationId,
        params: config.params,
        // Don't log request body (may contain sensitive data)
      });
    }
    
    return config;
  },
  (error) => {
    logger.error('[API] Request interceptor error:', { error });
    return Promise.reject(error);
  },
);

// ============================================================================
// Response Interceptor
// ============================================================================

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Reset circuit breaker on success
    if (circuitBreaker.state === 'HALF_OPEN') {
      circuitBreaker.state = 'CLOSED';
      circuitBreaker.failures = 0;
    }
    
    const correlationId = (response.config as ExtendedAxiosRequestConfig).correlationId;
    
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`[API Response] ${response.status} ${response.config.url}`, {
        correlationId,
        // Don't log response data (may be large)
      });
    }
    
    return response;
  },
  async (error: AxiosError) => {
    // Update circuit breaker
    circuitBreaker.failures++;
    circuitBreaker.lastFailureTime = Date.now();
    
    if (circuitBreaker.failures >= CIRCUIT_BREAKER_THRESHOLD) {
      circuitBreaker.state = 'OPEN';
      logger.error('[API] Circuit breaker OPENED due to repeated failures');
    }
    
    const correlationId = (error.config as ExtendedAxiosRequestConfig)?.correlationId;
    
    // Handle different error types
    if (error.code === 'ECONNABORTED') {
      throw new TimeoutError(`Request timeout after ${API_TIMEOUT}ms`);
    }
    
    if (!error.response) {
      // Network error (no response from server)
      throw new NetworkError('Network request failed - server unreachable');
    }
    
    const { status, data } = error.response;
    
    // Parse error response
    let errorMessage = 'An error occurred';
    let errorCode: string | undefined;
    let validationErrors: Array<{ field: string; message: string; code?: string }> | undefined;
    
    try {
      // Validate error response structure
      const parsed = ApiErrorResponseSchema.safeParse(data);
      
      if (parsed.success) {
        errorMessage = parsed.data.message;
        validationErrors = parsed.data.errors;
      } else if (typeof data === 'object' && data !== null) {
        // Fallback: Try to extract message from various formats safely
        const asRecord = data as Record<string, unknown>;
        errorMessage = (asRecord.message as string) || (asRecord.error as string) || errorMessage;
        errorCode = asRecord.code as string | undefined;
        const maybeErrors = asRecord.errors;
        if (Array.isArray(maybeErrors)) {
          validationErrors = maybeErrors as Array<{ field: string; message: string; code?: string }>;
        }
      }
    } catch (parseError) {
      logger.error('[API] Failed to parse error response:', { error: parseError });
    }
    
    // Log error
    // Log error
    logger.error(`[API Error] ${status} ${error.config?.url}`, {
      correlationId,
      message: errorMessage,
      code: errorCode,
      errors: validationErrors,
    });
    
    // Create typed error
    const apiError = createApiError(
      status,
      errorMessage,
      errorCode,
      validationErrors,
      error.config?.url,
    );
    
    // Handle 401 - trigger re-authentication
    if (status === 401) {
      // Emit event for global auth handler
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('api:unauthorized'));
      }
    }
    
    throw apiError;
  },
);

// ============================================================================
// Type-Safe API Client
// ============================================================================

export class TypedApiClient {
  /**
   * Perform GET request with response validation
   */
  async get<T>(
    path: string,
    schema: z.ZodSchema<T>,
    params?: Record<string, unknown>,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await apiClient.get<ApiSuccessResponse<T>>(path, {
      params,
      ...config,
    });
    
    // Validate response structure
    if (!response.data.success) {
      throw new ApiError(500, 'Invalid response format: success=false');
    }
    
    // Validate data with Zod schema
    const parsed = schema.safeParse(response.data.data);
    
    if (!parsed.success) {
      console.error('[API] Response validation failed:', parsed.error);
      throw new ApiError(500, 'Response validation failed');
    }
    
    return parsed.data;
  }
  
  /**
   * Perform POST request with response validation
   */
  async post<T, D = unknown>(
    path: string,
    schema: z.ZodSchema<T>,
    data?: D,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await apiClient.post<ApiSuccessResponse<T>>(path, data, config);
    
    if (!response.data.success) {
      throw new ApiError(500, 'Invalid response format: success=false');
    }
    
    const parsed = schema.safeParse(response.data.data);
    
    if (!parsed.success) {
      console.error('[API] Response validation failed:', parsed.error);
      throw new ApiError(500, 'Response validation failed');
    }
    
    return parsed.data;
  }
  
  /**
   * Perform PUT request with response validation
   */
  async put<T, D = unknown>(
    path: string,
    schema: z.ZodSchema<T>,
    data?: D,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await apiClient.put<ApiSuccessResponse<T>>(path, data, config);
    
    if (!response.data.success) {
      throw new ApiError(500, 'Invalid response format: success=false');
    }
    
    const parsed = schema.safeParse(response.data.data);
    
    if (!parsed.success) {
      console.error('[API] Response validation failed:', parsed.error);
      throw new ApiError(500, 'Response validation failed');
    }
    
    return parsed.data;
  }
  
  /**
   * Perform PATCH request with response validation
   */
  async patch<T, D = unknown>(
    path: string,
    schema: z.ZodSchema<T>,
    data?: D,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await apiClient.patch<ApiSuccessResponse<T>>(path, data, config);
    
    if (!response.data.success) {
      throw new ApiError(500, 'Invalid response format: success=false');
    }
    
    const parsed = schema.safeParse(response.data.data);
    
    if (!parsed.success) {
      console.error('[API] Response validation failed:', parsed.error);
      throw new ApiError(500, 'Response validation failed');
    }
    
    return parsed.data;
  }
  
  /**
   * Perform DELETE request
   */
  async delete(path: string, config?: AxiosRequestConfig): Promise<void> {
    await apiClient.delete(path, config);
  }
}

/**
 * Singleton instance
 */
export const typedApiClient = new TypedApiClient();

/**
 * Raw axios instance (for non-standard use cases)
 */
export { apiClient };

/**
 * Circuit breaker status (for monitoring)
 */
export function getCircuitBreakerStatus(): CircuitBreakerState {
  return { ...circuitBreaker };
}
