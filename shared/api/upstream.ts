/**
 * Translation of backend (Spring Boot) failures into the route error taxonomy.
 *
 * `serverBackendFetch` rejects with a plain `{ status, message }` object rather
 * than an `Error` instance, so every route that calls it needs the same triage:
 * a 4xx upstream is usually a real business answer the user must read verbatim
 * ("this handle is taken", "minimum purchase not met"), whereas a 5xx or a
 * network failure is an operational problem that must not leak its detail.
 *
 * Centralised here because four routes had independently grown near-identical
 * copies of this logic, each with slightly different rules about what was safe
 * to forward.
 *
 * @module shared/api/upstream
 */

import { ApiError } from './errors';

/** The rejection shape `serverBackendFetch` throws. */
export interface UpstreamFailure {
  status?: number;
  message?: string;
}

/**
 * Longest upstream message forwarded to a caller. Anything longer is almost
 * certainly a stack trace or an HTML error page rather than guidance.
 */
const MAX_FORWARDED_MESSAGE_CHARS = 200;

/**
 * Decide whether an upstream message is safe to show a user.
 *
 * Rejects anything containing markup or template delimiters: a reverse proxy's
 * HTML error page, or a serialised object, must never be rendered as advice.
 * Falls back to the caller's own message when the upstream text does not pass.
 */
export function sanitiseUpstreamMessage(message: string | undefined): string | undefined {
  const trimmed = message?.trim();
  if (!trimmed) return undefined;
  if (trimmed.length > MAX_FORWARDED_MESSAGE_CHARS) return undefined;
  if (/[<>{}]/.test(trimmed)) return undefined;
  return trimmed;
}

/**
 * Map a backend rejection onto an {@link ApiError}.
 *
 * Status handling:
 * - **401** → re-authentication is required; the caller's own token was rejected.
 * - **403 / 404** → collapsed to 404 when `hideNotFound` is set, so a resource
 *   the caller does not own is indistinguishable from one that does not exist.
 *   This is what stops an id space being enumerated by response code.
 * - **409** → conflict, preserving the upstream explanation.
 * - **other 4xx** → validation failure, preserving the upstream explanation.
 * - **5xx / network** → 502, with the raw cause logged but never returned.
 *
 * @param error           The rejection from `serverBackendFetch`.
 * @param fallbackMessage Shown when the upstream message is absent or unsafe.
 * @param options.hideNotFound Collapse 403 into 404. Set this on any route
 *   whose path contains a resource id the caller might not own.
 */
export function mapUpstreamError(
  error: unknown,
  fallbackMessage: string,
  options?: { hideNotFound?: boolean }
): ApiError {
  // An ApiError thrown by a guard inside the try block passes through intact.
  if (ApiError.is(error)) return error;

  const upstream = error as UpstreamFailure | undefined;
  const status = upstream?.status;
  const safeMessage = sanitiseUpstreamMessage(upstream?.message) ?? fallbackMessage;

  if (status === 401) {
    return ApiError.unauthenticated('Your session has expired. Please sign in again.');
  }

  if (status === 404 || (status === 403 && options?.hideNotFound)) {
    return ApiError.notFound();
  }

  if (status === 403) {
    return ApiError.forbidden(safeMessage);
  }

  if (status === 409) {
    return ApiError.conflict(safeMessage);
  }

  if (typeof status === 'number' && status >= 400 && status < 500) {
    return ApiError.validation(safeMessage);
  }

  return ApiError.upstream(fallbackMessage, error);
}
