/**
 * Normalised reads over caught errors.
 *
 * ## Why this exists
 *
 * Nothing in this app throws a raw Axios error at feature code. The response
 * interceptor in `core/interceptors/index.ts` catches every failure and rethrows
 * it as an {@link AppError}:
 *
 * ```ts
 * throw new AppError(status, apiError.errorCode, apiError.message, apiError.fieldErrors);
 * ```
 *
 * `AppError` carries `statusCode` and `code`. It has **no `response` property**.
 * Feature code that inspected `error.response.status` — the shape you get from
 * Axios directly — therefore matched nothing and silently fell back to a
 * hardcoded placeholder. The seller-onboarding handle check logged
 * `Handle check failed [undefined]: "Handle verification failed"` on every
 * failure: a real status, a real error code and a real backend message were all
 * present on the error and all three were thrown away.
 *
 * These helpers read whichever shape actually arrives, so a call site cannot get
 * this wrong again by guessing at one of them.
 *
 * @module shared/utils/error-utils
 */

/** Minimal `{ status, message }` shape some legacy call sites still throw. */
interface ApiError {
  status: number;
  message: string;
}

/** Axios' error shape, for the rare path that bypasses the interceptor. */
interface AxiosLikeError {
  response?: {
    status?: number;
    data?: { message?: string; detail?: string; errorCode?: string; code?: string };
  };
  code?: string;
  message?: string;
}

/** Narrow to a non-null object without asserting any particular shape. */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Type guard for ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  // Status alone, exactly as before: some legacy throws carry a status with no
  // message, and narrowing harder here would silently drop their status from
  // `getHttpStatus`.
  return isObject(error) && typeof error.status === 'number';
}

/**
 * Extracts HTTP status code from any caught error object (Axios, AppError, ApiError, etc.)
 */
export function getHttpStatus(error: unknown): number | null {
  if (isApiError(error)) return error.status;

  // Handle AppError / custom errors with statusCode
  if (isObject(error) && typeof (error as { statusCode?: number }).statusCode === 'number') {
    return (error as { statusCode: number }).statusCode;
  }

  // Handle Axios errors
  if (isObject(error) && typeof (error as AxiosLikeError).response?.status === 'number') {
    return (error as { response: { status: number } }).response.status;
  }

  return null;
}

/**
 * Best available human-readable description of a failure.
 *
 * Resolution order — most specific source first:
 *  1. `AppError.message` / `Error.message` (already carries the backend's text,
 *     because the interceptor copies `apiError.message` into it)
 *  2. Axios `response.data.message`, then `response.data.detail`
 *  3. A plain thrown string
 *  4. `fallback`
 *
 * Intended for **logs and diagnostics**. For copy shown to a user, prefer a
 * message the UI owns: a backend string may be technical (`"Network Error"`) or
 * phrased for an operator rather than a customer.
 *
 * @param error    The caught value. Anything at all — this never throws.
 * @param fallback Returned when no message can be recovered.
 */
export function getErrorMessage(error: unknown, fallback = 'An unexpected error occurred'): string {
  if (typeof error === 'string' && error.trim()) return error;

  if (isObject(error)) {
    const data = (error as AxiosLikeError).response?.data;
    const candidates = [
      typeof (error as { message?: unknown }).message === 'string'
        ? (error as { message: string }).message
        : undefined,
      data?.message,
      data?.detail,
    ];

    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim()) return candidate;
    }
  }

  return fallback;
}

/**
 * Machine-readable error code, when the backend supplied one.
 *
 * Prefers the domain code (`SELLER_NOT_APPROVED`) over a transport code
 * (`ERR_NETWORK`), because the former is what a caller branches on.
 *
 * @returns The code, or `null` when the error carries none.
 */
export function getErrorCode(error: unknown): string | null {
  if (!isObject(error)) return null;

  const candidates = [
    (error as { code?: unknown }).code,
    (error as AxiosLikeError).response?.data?.errorCode,
    (error as AxiosLikeError).response?.data?.code,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) return candidate;
  }

  return null;
}

/**
 * True when the request never reached the backend.
 *
 * The interceptor tags these `NETWORK_ERROR`; Axios itself uses `ERR_NETWORK`.
 * Worth distinguishing because it is the one failure class that is definitely
 * not the user's fault and is usually worth retrying.
 */
export function isNetworkError(error: unknown): boolean {
  const code = getErrorCode(error);
  return code === 'NETWORK_ERROR' || code === 'ERR_NETWORK' || code === 'ECONNABORTED';
}

/**
 * True when the request was deliberately aborted (unmount, debounce supersede,
 * or an open circuit breaker fast-failing).
 *
 * An abort is a **non-event**: it must never be logged as a failure or shown to
 * a user. Axios reports it as `CanceledError`, `AbortController` as
 * `AbortError`, and `axios.Cancel` — which the request interceptor throws when a
 * circuit is open — as neither reliably, so all three are matched here.
 */
export function isAbortError(error: unknown): boolean {
  if (!isObject(error)) return false;

  const name = (error as { name?: unknown }).name;
  if (name === 'CanceledError' || name === 'AbortError') return true;

  const code = (error as { code?: unknown }).code;
  if (code === 'ERR_CANCELED') return true;

  // axios.Cancel instances expose only `__CANCEL__` and a message.
  return (error as { __CANCEL__?: unknown }).__CANCEL__ === true;
}
