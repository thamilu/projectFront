/**
 * Standardized API Response Types
 * 
 * Matches Spring Boot backend response patterns:
 * - Success: { success: true, data: T, message?: string }
 * - Error: { success: false, message: string, errors?: ValidationError[] }
 * 
 * @module lib/api/api-types
 */

import { z } from 'zod';

// ============================================================================
// Response Schemas
// ============================================================================

/**
 * Standard API success response
 */
export const ApiSuccessResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    message: z.string().optional(),
    timestamp: z.string().datetime().optional(),
  });

/**
 * Standard API error response
 */
export const ApiErrorResponseSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  errors: z.array(z.object({
    field: z.string(),
    message: z.string(),
    code: z.string().optional(),
  })).optional(),
  timestamp: z.string().datetime().optional(),
  path: z.string().optional(),
  status: z.number().optional(),
});

/**
 * Paginated response schema
 */
export const PageResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    content: z.array(itemSchema),
    totalElements: z.number(),
    totalPages: z.number(),
    pageNumber: z.number(),
    pageSize: z.number(),
    first: z.boolean(),
    last: z.boolean(),
    empty: z.boolean(),
  });

// ============================================================================
// TypeScript Types (derived from schemas)
// ============================================================================

export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
  message?: string;
  timestamp?: string;
};

export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;

export type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  first: boolean;
  last: boolean;
  empty: boolean;
};

// ============================================================================
// Error Classes
// ============================================================================

/**
 * Base API error class
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly message: string,
    public readonly code?: string,
    public readonly errors?: Array<{ field: string; message: string; code?: string }>,
    public readonly path?: string,
  ) {
    super(message);
    this.name = 'ApiError';
    Object.setPrototypeOf(this, ApiError.prototype);
  }
  
  /**
   * Check if error is client error (4xx)
   */
  isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }
  
  /**
   * Check if error is server error (5xx)
   */
  isServerError(): boolean {
    return this.status >= 500;
  }
  
  /**
   * Check if error is retryable
   */
  isRetryable(): boolean {
    // Retry on 5xx (except 501 Not Implemented)
    // Retry on 429 (Rate Limited) after delay
    // Retry on 408 (Request Timeout)
    return (
      (this.status >= 500 && this.status !== 501) ||
      this.status === 429 ||
      this.status === 408
    );
  }
}

/**
 * Validation error (400)
 */
export class ValidationError extends ApiError {
  constructor(
    message: string,
    errors?: Array<{ field: string; message: string; code?: string }>,
  ) {
    super(400, message, 'VALIDATION_ERROR', errors);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Authentication error (401)
 */
export class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication required') {
    super(401, message, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Authorization error (403)
 */
export class AuthorizationError extends ApiError {
  constructor(message: string = 'Access denied') {
    super(403, message, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

/**
 * Not found error (404)
 */
export class NotFoundError extends ApiError {
  constructor(resource: string = 'Resource') {
    super(404, `${resource} not found`, 'NOT_FOUND_ERROR');
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Conflict error (409)
 */
export class ConflictError extends ApiError {
  constructor(message: string = 'Resource conflict') {
    super(409, message, 'CONFLICT_ERROR');
    this.name = 'ConflictError';
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * Rate limit error (429)
 */
export class RateLimitError extends ApiError {
  constructor(
    public readonly retryAfter: number = 60,
    message: string = 'Rate limit exceeded',
  ) {
    super(429, message, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

/**
 * Server error (5xx)
 */
export class ServerError extends ApiError {
  constructor(status: number = 500, message: string = 'Internal server error') {
    super(status, message, 'SERVER_ERROR');
    this.name = 'ServerError';
    Object.setPrototypeOf(this, ServerError.prototype);
  }
}

/**
 * Network error (no response from server)
 */
export class NetworkError extends Error {
  constructor(message: string = 'Network request failed') {
    super(message);
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * Timeout error
 */
export class TimeoutError extends Error {
  constructor(message: string = 'Request timeout') {
    super(message);
    this.name = 'TimeoutError';
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

// ============================================================================
// Error Factory
// ============================================================================

/**
 * Create appropriate error instance from API response
 */
export function createApiError(
  status: number,
  message: string,
  code?: string,
  errors?: Array<{ field: string; message: string; code?: string }>,
  path?: string,
): ApiError {
  switch (status) {
    case 400:
      return new ValidationError(message, errors);
    case 401:
      return new AuthenticationError(message);
    case 403:
      return new AuthorizationError(message);
    case 404:
      return new NotFoundError(message);
    case 409:
      return new ConflictError(message);
    case 429:
      return new RateLimitError(60, message);
    default:
      if (status >= 500) {
        return new ServerError(status, message);
      }
      return new ApiError(status, message, code, errors, path);
  }
}
