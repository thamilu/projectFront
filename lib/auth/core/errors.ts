/**
 * Authentication Error Handling Utilities
 * 
 * Enterprise-grade error handling for authentication flows:
 * - Typed error classes
 * - Error code mapping
 * - Standardized error responses
 * - Logging integration
 * - User-friendly error messages
 * 
 * @module lib/auth/errors
 */

import { getRequestLogger } from '@/lib/observability/logger';

// ============================================================================
// AUTH ERROR CONSTANTS (NextAuth Integration)
// ============================================================================

/**
 * Standard auth error codes for NextAuth callbacks and token handling
 */
export const AUTH_ERRORS = {
  REFRESH_FAILED: 'RefreshAccessTokenError',
  TOKEN_EXPIRED: 'TokenExpired',
  NETWORK_ERROR: 'NetworkError',
  INVALID_SESSION: 'InvalidSession',
  INVALID_TOKEN_RESPONSE: 'InvalidTokenResponse',
} as const;

export type AuthErrorCode = (typeof AUTH_ERRORS)[keyof typeof AUTH_ERRORS];

/**
 * Check if a value is a valid auth error code
 */
export function isAuthErrorCode(value: unknown): value is AuthErrorCode {
  return Object.values(AUTH_ERRORS).includes(value as AuthErrorCode);
}

/**
 * User-friendly error messages for auth error codes
 */
export const AUTH_ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  [AUTH_ERRORS.REFRESH_FAILED]: 'Session refresh failed. Please sign in again.',
  [AUTH_ERRORS.TOKEN_EXPIRED]: 'Your session has expired. Please sign in again.',
  [AUTH_ERRORS.NETWORK_ERROR]: 'Network error. Please check your connection.',
  [AUTH_ERRORS.INVALID_SESSION]: 'Invalid session. Please sign in again.',
  [AUTH_ERRORS.INVALID_TOKEN_RESPONSE]: 'Authentication server error. Please try again.',
};

export function getAuthErrorMessage(error: AuthErrorCode | string): string {
  if (isAuthErrorCode(error)) {
    return AUTH_ERROR_MESSAGES[error];
  }
  return 'An authentication error occurred. Please try again.';
}

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Base authentication error class
 * 
 * Extends Error with additional metadata:
 * - code: Machine-readable error code
 * - statusCode: HTTP status code
 * - userMessage: User-friendly message
 * - details: Additional context (dev only)
 */
export class AuthError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 401,
    public readonly userMessage?: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AuthError';
    
    // Maintain proper stack trace (V8 engines)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AuthError);
    }
  }
}

/**
 * Configuration error - auth service not properly configured
 */
export class AuthConfigError extends AuthError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(
      'AUTH_CONFIG_ERROR',
      message,
      500,
      'Authentication service is not properly configured',
      details
    );
    this.name = 'AuthConfigError';
  }
}

/**
 * Invalid request error - malformed or missing parameters
 */
export class InvalidRequestError extends AuthError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(
      'INVALID_REQUEST',
      message,
      400,
      'Invalid authentication request',
      details
    );
    this.name = 'InvalidRequestError';
  }
}

/**
 * State mismatch error - CSRF protection triggered
 */
export class StateMismatchError extends AuthError {
  constructor(details?: Record<string, unknown>) {
    super(
      'STATE_MISMATCH',
      'OAuth state parameter mismatch',
      400,
      'Security validation failed. Please try again.',
      details
    );
    this.name = 'StateMismatchError';
  }
}

/**
 * Nonce mismatch error - replay protection triggered
 */
export class NonceMismatchError extends AuthError {
  constructor(details?: Record<string, unknown>) {
    super(
      'NONCE_MISMATCH',
      'ID token nonce mismatch',
      400,
      'Security validation failed. Please try again.',
      details
    );
    this.name = 'NonceMismatchError';
  }
}

/**
 * Token exchange error - failed to obtain tokens
 */
export class TokenExchangeError extends AuthError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(
      'TOKEN_EXCHANGE_FAILED',
      message,
      500,
      'Failed to complete authentication',
      details
    );
    this.name = 'TokenExchangeError';
  }
}

/**
 * Token validation error - invalid or expired token
 */
export class TokenValidationError extends AuthError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(
      'TOKEN_INVALID',
      message,
      401,
      'Authentication token is invalid or expired',
      details
    );
    this.name = 'TokenValidationError';
  }
}

/**
 * Session error - session missing, expired, or invalid
 */
export class SessionError extends AuthError {
  constructor(message: string, code: string = 'SESSION_INVALID', details?: Record<string, unknown>) {
    super(
      code,
      message,
      401,
      'Your session is invalid or has expired',
      details
    );
    this.name = 'SessionError';
  }
}

/**
 * Authorization error - insufficient permissions
 */
export class AuthorizationError extends AuthError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(
      'INSUFFICIENT_PERMISSIONS',
      message,
      403,
      'You do not have permission to access this resource',
      details
    );
    this.name = 'AuthorizationError';
  }
}

// ============================================================================
// ERROR CODE REGISTRY
// ============================================================================

/**
 * Standard error codes for authentication flows
 * 
 * Categorized by phase:
 * - Configuration errors
 * - OAuth flow errors
 * - Token errors
 * - Session errors
 * - Authorization errors
 */
export const AUTH_ERROR_CODES = {
  // Configuration
  CONFIG_MISSING: 'AUTH_CONFIG_MISSING',
  CONFIG_INVALID: 'AUTH_CONFIG_INVALID',
  
  // OAuth Flow
  INVALID_REQUEST: 'INVALID_REQUEST',
  STATE_MISSING: 'STATE_MISSING',
  STATE_MISMATCH: 'STATE_MISMATCH',
  NONCE_MISMATCH: 'NONCE_MISMATCH',
  CODE_MISSING: 'CODE_MISSING',
  CALLBACK_ERROR: 'CALLBACK_ERROR',
  
  // Tokens
  TOKEN_EXCHANGE_FAILED: 'TOKEN_EXCHANGE_FAILED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  INVALID_SIGNATURE: 'INVALID_SIGNATURE',
  INVALID_ISSUER: 'INVALID_ISSUER',
  INVALID_AUDIENCE: 'INVALID_AUDIENCE',
  REFRESH_FAILED: 'REFRESH_FAILED',
  REFRESH_TOKEN_MISSING: 'REFRESH_TOKEN_MISSING',
  
  // Session
  SESSION_REQUIRED: 'SESSION_REQUIRED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  SESSION_INVALID: 'SESSION_INVALID',
  
  // Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  
  // General
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

// ============================================================================
// ERROR RESPONSE BUILDERS
// ============================================================================

/**
 * Builds standardized error response object
 * 
 * Format:
 * ```json
 * {
 *   "error": "User-friendly message",
 *   "code": "MACHINE_READABLE_CODE",
 *   "timestamp": "2025-12-23T...",
 *   "requestId": "abc123",
 *   "details": { ... } // Dev only
 * }
 * ```
 * 
 * @param error - Error instance or message
 * @param requestId - Request correlation ID
 * @returns Error response object
 */
export function buildErrorResponse(
  error: AuthError | Error | string,
  requestId: string
): {
  error: string;
  code: string;
  timestamp: string;
  requestId: string;
  details?: Record<string, unknown>;
} {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Handle AuthError instances
  if (error instanceof AuthError) {
    const response: {
      error: string;
      code: string;
      timestamp: string;
      requestId: string;
      details?: Record<string, unknown>;
    } = {
      error: error.userMessage || error.message,
      code: error.code,
      timestamp: new Date().toISOString(),
      requestId,
    };
    
    // Include details in development
    if (!isProduction && error.details) {
      response.details = error.details;
    }
    
    return response;
  }
  
  // Handle generic Error instances
  if (error instanceof Error) {
    return {
      error: isProduction 
        ? 'An error occurred during authentication' 
        : error.message,
      code: AUTH_ERROR_CODES.INTERNAL_ERROR,
      timestamp: new Date().toISOString(),
      requestId,
      ...(isProduction ? {} : { details: { stack: error.stack } }),
    };
  }
  
  // Handle string errors
  return {
    error: String(error),
    code: AUTH_ERROR_CODES.INTERNAL_ERROR,
    timestamp: new Date().toISOString(),
    requestId,
  };
}

/**
 * Logs error with appropriate level and context
 * 
 * @param error - Error to log
 * @param context - Additional context
 */
export function logAuthError(
  error: AuthError | Error,
  context?: Record<string, unknown>
): void {
  const log = getRequestLogger('auth-error');
  
  if (error instanceof AuthError) {
    // Log as warning for client errors (4xx)
    if (error.statusCode >= 400 && error.statusCode < 500) {
      log.warn(error.message, {
        code: error.code,
        statusCode: error.statusCode,
        details: error.details,
        ...context,
      });
    } else {
      // Log as error for server errors (5xx)
      log.error(error.message, {
        code: error.code,
        statusCode: error.statusCode,
        details: error.details,
        stack: error.stack,
        ...context,
      });
    }
  } else {
    log.error(error.message, {
      name: error.name,
      stack: error.stack,
      ...context,
    });
  }
}

// ============================================================================
// ERROR FACTORIES
// ============================================================================

/**
 * Creates error from OAuth error response
 * 
 * @param errorCode - OAuth error code
 * @param description - Error description
 * @returns AuthError instance
 */
export function fromOAuthError(
  errorCode: string,
  description?: string
): AuthError {
  const message = description || `OAuth error: ${errorCode}`;
  
  // Map OAuth error codes to our error types
  switch (errorCode) {
    case 'access_denied':
      return new AuthorizationError(message);
    
    case 'invalid_request':
    case 'unauthorized_client':
    case 'unsupported_response_type':
      return new InvalidRequestError(message);
    
    case 'server_error':
    case 'temporarily_unavailable':
      return new AuthError(errorCode.toUpperCase(), message, 503);
    
    default:
      return new AuthError(errorCode.toUpperCase(), message, 400);
  }
}

/**
 * Checks if error is retryable
 * 
 * Retryable errors:
 * - Network timeouts
 * - 503 Service Unavailable
 * - Temporary failures
 * 
 * Non-retryable errors:
 * - Invalid credentials
 * - Authorization failures
 * - Configuration errors
 * 
 * @param error - Error to check
 * @returns True if retry may succeed
 */
export function isRetryableError(error: AuthError | Error): boolean {
  if (error instanceof AuthError) {
    // Retryable status codes
    const retryableStatuses = [408, 429, 500, 502, 503, 504];
    return retryableStatuses.includes(error.statusCode);
  }
  
  // Network errors are often retryable
  if (error.message.includes('timeout') || error.message.includes('network')) {
    return true;
  }
  
  return false;
}
