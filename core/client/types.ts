/**
 * [HARDEN] Standardized API Error Response
 * Matches Spring Boot ApiError shape used across the enterprise backend.
 */
export interface ApiErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  errorCode?: string;
  code?: string; // Legacy/Fallback
  message: string;
  path: string;
  correlationId?: string;
  fieldErrors?: Record<string, string>;
}

/**
 * Base configuration for API requests
 */
export interface RequestOptions {
  signal?: AbortSignal;
  correlationId?: string;
  headers?: Record<string, string>;
}
