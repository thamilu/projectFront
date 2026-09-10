/**
 * Uniform response envelopes for this application's own API routes.
 *
 * Every route in `app/api/**` returns one of these two shapes. Before this
 * module existed, three routes hand-rolled near-identical `errorResponse()`
 * helpers while the rest returned bare `{ error: string }` — so a client
 * could not branch on failures generically, and half the routes forgot
 * `Cache-Control: no-store` on responses derived from a user session.
 *
 * @module shared/api/response
 */

import { NextResponse } from 'next/server';
import { ApiError, ApiErrorCode } from './errors';

// ============================================================
// 1. SHARED HEADERS
// ============================================================

/**
 * Applied to every API response.
 *
 * `no-store` is the correct default for routes whose output depends on the
 * caller's session: a shared cache (CDN, corporate proxy, browser bfcache)
 * must never serve one user's payload to another. Routes that are genuinely
 * public and cacheable — search, suggestions — opt out explicitly via the
 * `headers` argument, which is merged last and therefore wins.
 */
const BASE_HEADERS: Readonly<Record<string, string>> = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
};

// ============================================================
// 2. RESPONSE SHAPES
// ============================================================

/** Error body returned by every failing API route. */
export interface ApiErrorBody {
  /** ISO 8601, server clock. */
  readonly timestamp: string;
  readonly status: number;
  /** Stable machine-readable classification — branch on this, not `message`. */
  readonly errorCode: string;
  /** Human-readable and always safe to display. */
  readonly message: string;
  readonly path: string;
  /** Correlates this response with the exact server log line that produced it. */
  readonly requestId: string;
  /** Optional structured context, e.g. per-field validation issues. */
  readonly details?: Record<string, unknown>;
}

// ============================================================
// 3. BUILDERS
// ============================================================

/**
 * Build a success response with the shared security headers applied.
 *
 * @param data    Body to serialise.
 * @param options `status` defaults to 200; `headers` are merged last so a
 *                caller can deliberately override `Cache-Control` for a
 *                genuinely public, cacheable route.
 */
export function apiSuccess<T>(
  data: T,
  options?: { status?: number; requestId?: string; headers?: Record<string, string> }
): NextResponse {
  return NextResponse.json(data, {
    status: options?.status ?? 200,
    headers: {
      ...BASE_HEADERS,
      ...(options?.requestId ? { 'X-Request-ID': options.requestId } : {}),
      ...options?.headers,
    },
  });
}

/**
 * Build an error response in the canonical envelope.
 *
 * Prefer throwing an {@link ApiError} from inside a handler wrapped by
 * `withRoute()` — that path logs the cause automatically. Call this directly
 * only where a wrapper is not in play.
 */
export function apiError(
  error: ApiError,
  context: { requestId: string; path: string }
): NextResponse {
  const body: ApiErrorBody = {
    timestamp: new Date().toISOString(),
    status: error.status,
    errorCode: error.errorCode,
    message: error.publicMessage,
    path: context.path,
    requestId: context.requestId,
    ...(error.details ? { details: error.details } : {}),
  };

  return NextResponse.json(body, {
    status: error.status,
    headers: {
      ...BASE_HEADERS,
      'X-Request-ID': context.requestId,
      // Advertise the retry contract for throttled callers so a client can
      // back off deterministically instead of hammering with a blind retry.
      ...(error.errorCode === ApiErrorCode.RATE_LIMIT_EXCEEDED ? { 'Retry-After': '60' } : {}),
    },
  });
}
