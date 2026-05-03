/**
 * Error Handling Utilities
 * Centralizes error handling patterns to follow DRY principle
 */

import { logger } from '@/lib/observability/logger';
import { FetchError } from './fetch-utils';

// ============================================================================
// Error Types
// ============================================================================

export interface ErrorResponse {
  message: string;
  code?: string;
  status?: number;
  details?: unknown;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_REQUIRED');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends ApiError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_FAILED');
    this.name = 'AuthorizationError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

// ============================================================================
// Error Handlers
// ============================================================================

/**
 * Handle fetch response errors with appropriate error types
 *
 * @example
 * ```ts
 * try {
 *   const response = await fetch('/api/data');
 *   if (!response.ok) {
 *     throw await handleFetchError(response);
 *   }
 * } catch (error) {
 *   handleError(error);
 * }
 * ```
 */
export async function handleFetchError(response: Response): Promise<ApiError> {
  const errorData = await response.json().catch(() => null);
  const message = errorData?.message || errorData?.error || `HTTP ${response.status}`;

  switch (response.status) {
    case 401:
      return new AuthenticationError(message);
    case 403:
      return new AuthorizationError(message);
    case 404:
      return new NotFoundError(message);
    case 400:
      return new ValidationError(message, errorData?.details);
    default:
      return new ApiError(message, response.status, errorData?.code, errorData?.details);
  }
}

/**
 * Generic error handler with logging
 *
 * @example
 * ```ts
 * try {
 *   await someOperation();
 * } catch (error) {
 *   handleError(error, 'Operation failed');
 * }
 * ```
 */
export function handleError(error: unknown, context?: string): ErrorResponse {
  const prefix = context ? `[${context}]` : '';

  if (error instanceof ApiError) {
    logger.error(`${prefix} API Error:`, {
      message: error.message,
      status: error.status,
      code: error.code,
    });

    return {
      message: error.message,
      code: error.code,
      status: error.status,
      details: error.details,
    };
  }

  if (error instanceof FetchError) {
    logger.error(`${prefix} Fetch Error:`, {
      message: error.message,
      status: error.status,
    });

    return {
      message: error.message,
      status: error.status,
      details: error.data,
    };
  }

  if (error instanceof Error) {
    logger.error(`${prefix} Error:`, { message: error.message });

    return {
      message: error.message,
      status: 500,
    };
  }

  logger.error(`${prefix} Unknown error:`, { error: String(error) });

  return {
    message: 'An unexpected error occurred',
    status: 500,
  };
}

/**
 * Create user-friendly error message
 *
 * @example
 * ```ts
 * const message = getUserFriendlyMessage(error);
 * toast.error(message);
 * ```
 */
export function getUserFriendlyMessage(error: unknown): string {
  if (error instanceof AuthenticationError) {
    return 'Please sign in to continue';
  }

  if (error instanceof AuthorizationError) {
    return 'You do not have permission to perform this action';
  }

  if (error instanceof NotFoundError) {
    return 'The requested resource was not found';
  }

  if (error instanceof ValidationError) {
    return error.message;
  }

  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof FetchError) {
    if (error.status === 0) {
      return 'Network error. Please check your connection';
    }
    if (error.status === 408) {
      return 'Request timeout. Please try again';
    }
    if (error.status >= 500) {
      return 'Server error. Please try again later';
    }
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
}

/**
 * Log and rethrow error (useful in promise chains)
 */
export function logAndRethrow(context: string) {
  return (error: unknown): never => {
    handleError(error, context);
    throw error;
  };
}

/**
 * Try-catch wrapper with error handling
 *
 * @example
 * ```ts
 * const result = await tryCatch(
 *   async () => await fetchData(),
 *   'Failed to fetch data'
 * );
 * ```
 */
export async function tryCatch<T>(fn: () => Promise<T>, errorMessage?: string): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    handleError(error, errorMessage);
    return null;
  }
}

/**
 * Retry with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    retries?: number;
    baseDelay?: number;
    maxDelay?: number;
    shouldRetry?: (error: unknown) => boolean;
  } = {}
): Promise<T> {
  const { retries = 3, baseDelay = 1000, maxDelay = 10000, shouldRetry = () => true } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (!shouldRetry(error) || attempt === retries) {
        throw error;
      }

      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
