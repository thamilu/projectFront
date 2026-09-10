/**
 * Normalised error readers.
 *
 * These exist because feature code guessed at the error shape and guessed
 * wrong. The response interceptor rethrows every HTTP failure as `AppError`,
 * which has `statusCode`/`code` and no `response` — so a `'response' in error`
 * check matched nothing and a real status, code and backend message were
 * discarded in favour of a hardcoded placeholder.
 *
 * The `AppError` cases below are therefore the load-bearing ones: they are the
 * shape that actually reaches a `catch` block in this app.
 */

import { AppError } from '@/core/http/errors';
import {
  getErrorCode,
  getErrorMessage,
  getHttpStatus,
  isAbortError,
  isApiError,
  isNetworkError,
} from '@/shared/utils/error-utils';

/** The shape Axios produces, for the rare path that bypasses the interceptor. */
function axiosLikeError(status: number, data: Record<string, unknown>) {
  return Object.assign(new Error('Request failed with status code ' + status), {
    response: { status, data },
    isAxiosError: true,
  });
}

describe('getHttpStatus', () => {
  it('reads AppError, the shape the interceptor actually throws', () => {
    expect(getHttpStatus(new AppError(409, 'CONFLICT', 'Handle already registered'))).toBe(409);
  });

  it('still reads a raw Axios error', () => {
    expect(getHttpStatus(axiosLikeError(503, { message: 'upstream down' }))).toBe(503);
  });

  it('reads a bare { status, message } object', () => {
    expect(getHttpStatus({ status: 404, message: 'nope' })).toBe(404);
  });

  it('returns null rather than a misleading 0 or 500 when there is no status', () => {
    expect(getHttpStatus(new Error('boom'))).toBeNull();
    expect(getHttpStatus('boom')).toBeNull();
    expect(getHttpStatus(null)).toBeNull();
    expect(getHttpStatus(undefined)).toBeNull();
  });
});

describe('isApiError', () => {
  it('accepts a status-bearing object and rejects everything else', () => {
    expect(isApiError({ status: 500, message: 'x' })).toBe(true);
    expect(isApiError({ status: '500' })).toBe(false);
    expect(isApiError(new Error('x'))).toBe(false);
    expect(isApiError(null)).toBe(false);
  });
});

describe('getErrorMessage', () => {
  it('recovers the backend message the old placeholder threw away', () => {
    // This is the exact regression: AppError carries the backend text on
    // `.message`, and the caller reported "Handle verification failed" instead.
    const error = new AppError(409, 'HANDLE_TAKEN', 'Shop handle already registered');

    expect(getErrorMessage(error, 'Handle verification failed')).toBe(
      'Shop handle already registered'
    );
  });

  it('falls back to response.data.message for a raw Axios error', () => {
    // A plain AxiosError's own `.message` is the generic "Request failed with
    // status code 422" — the useful text is one level down.
    const error = axiosLikeError(422, { message: 'Handle contains reserved word' });
    error.message = '';

    expect(getErrorMessage(error)).toBe('Handle contains reserved word');
  });

  it('accepts response.data.detail, which some endpoints use instead', () => {
    const error = axiosLikeError(400, { detail: 'malformed handle' });
    error.message = '';

    expect(getErrorMessage(error)).toBe('malformed handle');
  });

  it('returns a thrown string as-is', () => {
    expect(getErrorMessage('something broke')).toBe('something broke');
  });

  it('uses the fallback for anything unreadable, and never throws', () => {
    expect(getErrorMessage(null, 'fallback')).toBe('fallback');
    expect(getErrorMessage(undefined, 'fallback')).toBe('fallback');
    expect(getErrorMessage({}, 'fallback')).toBe('fallback');
    expect(getErrorMessage({ message: '   ' }, 'fallback')).toBe('fallback');
  });
});

describe('getErrorCode', () => {
  it('reads the domain code off AppError', () => {
    expect(getErrorCode(new AppError(403, 'SELLER_NOT_APPROVED', 'no'))).toBe(
      'SELLER_NOT_APPROVED'
    );
  });

  it('reads errorCode from an Axios payload', () => {
    expect(getErrorCode(axiosLikeError(401, { errorCode: 'AUTHENTICATION_FAILED' }))).toBe(
      'AUTHENTICATION_FAILED'
    );
  });

  it('returns null when no code is present', () => {
    expect(getErrorCode(new Error('x'))).toBeNull();
    expect(getErrorCode('x')).toBeNull();
  });
});

describe('isNetworkError', () => {
  it('recognises the interceptor tag and Axios own codes', () => {
    expect(isNetworkError(new AppError(500, 'NETWORK_ERROR', 'Connection to backend failed'))).toBe(
      true
    );
    expect(isNetworkError(Object.assign(new Error('x'), { code: 'ERR_NETWORK' }))).toBe(true);
    expect(isNetworkError(Object.assign(new Error('x'), { code: 'ECONNABORTED' }))).toBe(true);
  });

  it('does not misclassify an ordinary server error', () => {
    expect(isNetworkError(new AppError(500, 'INTERNAL_SERVER_ERROR', 'boom'))).toBe(false);
  });
});

describe('isAbortError', () => {
  it('recognises all three abort shapes this stack produces', () => {
    // An abort must never be logged or shown — it means "superseded", not
    // "failed". Axios, AbortController and axios.Cancel each report it
    // differently, so all three are matched.
    const canceledError = Object.assign(new Error('canceled'), { name: 'CanceledError' });
    const domAbort = Object.assign(new Error('aborted'), { name: 'AbortError' });
    const axiosCancel = { __CANCEL__: true, message: 'circuit open' };

    expect(isAbortError(canceledError)).toBe(true);
    expect(isAbortError(domAbort)).toBe(true);
    expect(isAbortError(axiosCancel)).toBe(true);
    expect(isAbortError(Object.assign(new Error('x'), { code: 'ERR_CANCELED' }))).toBe(true);
  });

  it('does not swallow a real failure', () => {
    expect(isAbortError(new AppError(500, 'INTERNAL_SERVER_ERROR', 'boom'))).toBe(false);
    expect(isAbortError(new Error('boom'))).toBe(false);
    expect(isAbortError(null)).toBe(false);
  });
});
