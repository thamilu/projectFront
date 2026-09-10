/**
 * Canonical error taxonomy for this application's own Next.js API routes.
 *
 * Route handlers must never invent ad-hoc error strings: a stable, machine
 * readable `errorCode` is what lets a client branch on a failure reason, an
 * operator grep a log aggregator, and an alert rule fire on a specific class
 * of failure. Human-readable `message` text may change freely (copy edits,
 * future localisation) — `errorCode` must not.
 *
 * @module shared/api/errors
 */

// ============================================================
// 1. ERROR CODES
// ============================================================

/**
 * Stable, machine-readable failure classifications.
 *
 * Grouped by the HTTP status they conventionally map to. Adding a code is
 * always safe; renaming or removing one is a breaking change for any client
 * branching on it.
 */
export const ApiErrorCode = {
  // 400 — the request itself is malformed or fails schema validation
  VALIDATION_FAILED: 'ValidationFailed',
  MALFORMED_BODY: 'MalformedBody',

  // 401 — no usable credential was presented
  NOT_AUTHENTICATED: 'NotAuthenticated',

  // 403 — authenticated, but not permitted to act on this resource
  FORBIDDEN: 'Forbidden',

  // 404 — resource does not exist, or the caller may not know that it does
  NOT_FOUND: 'NotFound',

  // 409 — the request conflicts with current server state
  CONFLICT: 'Conflict',
  TOKEN_STALE: 'TokenStale',

  // 413 — request body exceeded the route's declared cap
  PAYLOAD_TOO_LARGE: 'PayloadTooLarge',

  // 429 — rate limit exhausted
  RATE_LIMIT_EXCEEDED: 'RateLimitExceeded',

  // 500 / 502 — server-side or upstream failure
  INTERNAL_SERVER_ERROR: 'InternalServerError',
  UPSTREAM_FAILURE: 'UpstreamFailure',

  // 503 — a dependency required by this route is not configured
  NOT_CONFIGURED: 'NotConfigured',
} as const;

export type ApiErrorCode = (typeof ApiErrorCode)[keyof typeof ApiErrorCode];

// ============================================================
// 2. ERROR TYPE
// ============================================================

/**
 * A failure a route handler intends to surface to the caller.
 *
 * Thrown from anywhere inside a handler and translated to a response by
 * `withRoute()` (see ./handler). This lets guards and business logic fail
 * fast with `throw new ApiError(...)` instead of threading early-return
 * `NextResponse` objects back up through every call site.
 *
 * `publicMessage` is always safe to send to a browser. Raw exception text —
 * which can leak provider config, database errors or internal paths
 * (OWASP A05:2021) — belongs in `cause`, which is logged and never
 * serialised into a response.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly errorCode: ApiErrorCode;
  readonly publicMessage: string;
  /** Extra structured fields merged into the response body (e.g. Zod issues). */
  readonly details?: Readonly<Record<string, unknown>>;

  constructor(
    status: number,
    errorCode: ApiErrorCode,
    publicMessage: string,
    options?: { cause?: unknown; details?: Record<string, unknown> }
  ) {
    super(publicMessage, options?.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = 'ApiError';
    this.status = status;
    this.errorCode = errorCode;
    this.publicMessage = publicMessage;
    this.details = options?.details;
  }

  /** Narrowing helper — `instanceof` alone breaks across bundler realms. */
  static is(value: unknown): value is ApiError {
    return value instanceof ApiError || (value as ApiError)?.name === 'ApiError';
  }

  // ---------- Conventional constructors ----------
  // Named factories keep status/code pairings consistent across every route,
  // so a 403 always carries FORBIDDEN and never a hand-typed variant.

  static unauthenticated(message = 'Authentication is required.'): ApiError {
    return new ApiError(401, ApiErrorCode.NOT_AUTHENTICATED, message);
  }

  static forbidden(message = 'You do not have access to this resource.'): ApiError {
    return new ApiError(403, ApiErrorCode.FORBIDDEN, message);
  }

  /**
   * Deliberately identical in shape to a genuine 404. Ownership checks return
   * this rather than 403 so an attacker enumerating IDs cannot distinguish
   * "exists but is not yours" from "does not exist".
   */
  static notFound(message = 'The requested resource was not found.'): ApiError {
    return new ApiError(404, ApiErrorCode.NOT_FOUND, message);
  }

  static validation(message: string, details?: Record<string, unknown>): ApiError {
    return new ApiError(400, ApiErrorCode.VALIDATION_FAILED, message, { details });
  }

  static conflict(message: string): ApiError {
    return new ApiError(409, ApiErrorCode.CONFLICT, message);
  }

  static rateLimited(message = 'Too many requests. Please try again shortly.'): ApiError {
    return new ApiError(429, ApiErrorCode.RATE_LIMIT_EXCEEDED, message);
  }

  static payloadTooLarge(maxBytes: number): ApiError {
    return new ApiError(
      413,
      ApiErrorCode.PAYLOAD_TOO_LARGE,
      `Request body exceeds the maximum of ${maxBytes} bytes.`
    );
  }

  static notConfigured(what: string): ApiError {
    return new ApiError(
      503,
      ApiErrorCode.NOT_CONFIGURED,
      'This feature is not available right now.',
      { cause: new Error(`${what} is not configured on this server`) }
    );
  }

  static upstream(message = 'An upstream service failed. Please try again.', cause?: unknown) {
    return new ApiError(502, ApiErrorCode.UPSTREAM_FAILURE, message, { cause });
  }
}
