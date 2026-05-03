/**
 * API Error Types and Response Helpers
 * Standardized error handling for API route handlers
 */

import { NextResponse } from 'next/server';

/**
 * Machine-readable error codes for frontend error handling
 */
export const API_ERROR_CODES = {
  INVALID_CONTENT_TYPE: 'INVALID_CONTENT_TYPE',
  INVALID_REQUEST_BODY: 'INVALID_REQUEST_BODY',
  AUTH_NOT_CONFIGURED: 'AUTH_NOT_CONFIGURED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  INVALID_TOKEN_RESPONSE: 'INVALID_TOKEN_RESPONSE',
  ID_TOKEN_VALIDATION_FAILED: 'ID_TOKEN_VALIDATION_FAILED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  CSRF_VALIDATION_FAILED: 'CSRF_VALIDATION_FAILED',
  INVALID_REDIRECT: 'INVALID_REDIRECT',
  IDP_TIMEOUT: 'IDP_TIMEOUT',
  RATE_LIMITED: 'RATE_LIMITED',
} as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];

/**
 * Standardized API error response shape
 */
export interface ApiErrorResponse {
  error: string;
  code: ApiErrorCode;
  requestId: string;
  retryAfter?: number;
}

/**
 * Standardized API success response shape
 */
export interface ApiSuccessResponse<T = Record<string, unknown>> {
  ok: true;
  requestId: string;
  data?: T;
  [key: string]: unknown;
}

/**
 * Create a standardized error response
 */
export function apiError(
  error: string,
  code: ApiErrorCode,
  status: number,
  requestId: string,
  options?: {
    retryAfter?: number;
    headers?: HeadersInit;
  }
): NextResponse<ApiErrorResponse> {
  const headers = new Headers(options?.headers);
  headers.set('Cache-Control', 'no-store, max-age=0');
  headers.set('X-Request-ID', requestId);

  if (options?.retryAfter) {
    headers.set('Retry-After', String(options.retryAfter));
  }

  return NextResponse.json<ApiErrorResponse>(
    {
      error,
      code,
      requestId,
      retryAfter: options?.retryAfter,
    },
    { status, headers }
  );
}

/**
 * Create a standardized success response
 */
export function apiSuccess<T extends Record<string, unknown>>(
  data: T,
  requestId: string,
  options?: {
    headers?: HeadersInit;
    timing?: { total: number; [key: string]: number };
  }
): NextResponse<ApiSuccessResponse<T>> {
  const headers = new Headers(options?.headers);
  headers.set('Cache-Control', 'no-store, max-age=0');
  headers.set('X-Request-ID', requestId);

  // Add Server-Timing header for performance tracking
  if (options?.timing) {
    const timings = Object.entries(options.timing)
      .map(([name, dur]) => `${name};dur=${dur.toFixed(0)}`)
      .join(', ');
    headers.set('Server-Timing', timings);
  }

  return NextResponse.json<ApiSuccessResponse<T>>(
    {
      ok: true,
      requestId,
      ...data,
    },
    { headers }
  );
}

/**
 * Validate CSRF protection via Origin header
 */
export function validateOrigin(origin: string | null): boolean {
  if (!origin) return false;

  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    'http://localhost:3000',
    'https://localhost:3000',
  ].filter(Boolean);

  return allowedOrigins.some((allowed) => origin === allowed || origin.startsWith(allowed!));
}

/**
 * Validate redirect path is safe
 */
export function isValidRedirectPath(path: string): boolean {
  const ALLOWED_REDIRECT_PREFIXES = [
    '/',
    '/dashboard',
    '/products',
    '/account',
    '/customer',
    '/admin',
    '/orders',
    '/cart',
  ];

  try {
    // Parse as URL to validate structure
    const url = new URL(path, 'http://localhost');
    
    // Check if path starts with allowed prefix
    const isAllowed = ALLOWED_REDIRECT_PREFIXES.some((prefix) =>
      url.pathname.startsWith(prefix)
    );

    // Reject paths that might be sensitive
    const isSensitive = ['/api/', '/auth/signout', '/auth/error'].some((sensitive) =>
      url.pathname.startsWith(sensitive)
    );

    return isAllowed && !isSensitive;
  } catch {
    return false;
  }
}

/**
 * Create AbortController with timeout for fetch requests
 */
export function createTimeoutController(timeoutMs: number): {
  controller: AbortController;
  cleanup: () => void;
} {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  return {
    controller,
    cleanup: () => clearTimeout(timeout),
  };
}

/**
 * Simple in-memory rate limiter (sliding window)
 * 
 * NOTE: In-memory storage means rate limits are per-instance.
 * For distributed systems, use Redis or similar.
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  // Clean up expired entries
  if (record && now > record.resetAt) {
    rateLimitStore.delete(key);
    return false;
  }

  if (!record) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  record.count++;
  return record.count > limit;
}

/**
 * Get rate limit info for response headers
 */
export function getRateLimitInfo(key: string, limit: number): {
  remaining: number;
  resetAt: number;
} | null {
  const record = rateLimitStore.get(key);
  if (!record) return null;

  return {
    remaining: Math.max(0, limit - record.count),
    resetAt: record.resetAt,
  };
}
