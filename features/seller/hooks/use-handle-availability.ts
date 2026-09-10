'use client';

import { useEffect, useRef, useState } from 'react';
import { apiClient } from '@/core/client';
import { logger } from '@/core/telemetry/logger';
import { API_ENDPOINTS } from '@/shared/constants/api/endpoints';
import { describeShopHandleViolation } from '@/domains/seller/contracts/shop-handle';
import {
  getErrorCode,
  getErrorMessage,
  getHttpStatus,
  isAbortError,
} from '@/shared/utils/error-utils';

/**
 * Debounced "is this shop handle free?" check.
 *
 * Extracted from `StoreDetailsFields`, where it lived as a 55-line `useEffect`
 * that mixed debouncing, aborting, HTTP, error translation and React Hook Form
 * mutation into one block — and carried five defects as a result. Each is called
 * out at the code that fixes it.
 *
 * The hook is deliberately **free of form coupling**: it reports a state and
 * says nothing about validation errors or focus. The component decides how to
 * surface it. That keeps this unit testable without a form provider, and lets
 * any other surface (store settings, an admin tool) reuse it.
 *
 * @module features/seller/hooks/use-handle-availability
 */

/**
 * Outcome of the most recent evaluation.
 *
 * `ERROR` is distinct from `IDLE` on purpose: the check genuinely failed rather
 * than never having run, and a seller who sees "nothing to report" would have no
 * way to know their handle was never actually verified.
 *
 * `INVALID` is distinct from `ERROR` for the same reason in the other direction
 * — a malformed handle is something the seller can fix, and telling them
 * "verification failed" hides that.
 */
export type HandleAvailabilityStatus = 'IDLE' | 'INVALID' | 'AVAILABLE' | 'TAKEN' | 'ERROR';

export interface HandleAvailabilityState {
  /** Result of the last completed evaluation. */
  status: HandleAvailabilityStatus;
  /** True while a request is in flight (drives the spinner). */
  isChecking: boolean;
  /**
   * User-facing explanation for `INVALID` and `TAKEN`, else `null`.
   *
   * `ERROR` deliberately carries no message: the underlying text is often
   * transport-level (`"Network Error"`) and unhelpful to a seller. The component
   * owns that copy.
   */
  message: string | null;
}

export interface HandleAvailabilityOptions {
  /**
   * Skip checking entirely — e.g. while the form is submitting. The status is
   * reset to `IDLE` so a stale verdict cannot linger on screen.
   */
  enabled?: boolean;
  /** Quiet period after the last keystroke before a request is sent. */
  debounceMs?: number;
  /**
   * Minimum time the spinner stays visible once shown.
   *
   * Without it, a 20ms response makes the spinner flash — read as a glitch
   * rather than as feedback.
   */
  spinnerMinMs?: number;
}

const DEFAULT_DEBOUNCE_MS = 500;
const DEFAULT_SPINNER_MIN_MS = 300;

/**
 * The check is ambient: the seller never asked for it, so a failure must not
 * raise the global error toast the response interceptor otherwise shows for
 * 4xx/5xx responses. Same convention as `useProductDuplicateCheck`.
 */
const AMBIENT_REQUEST_HEADERS = { 'X-Bypass-Toast': 'true' } as const;

/**
 * @param handle  Current field value, exactly as typed.
 * @param options See {@link HandleAvailabilityOptions}.
 */
export function useHandleAvailability(
  handle: string | undefined,
  options: HandleAvailabilityOptions = {}
): HandleAvailabilityState {
  const {
    enabled = true,
    debounceMs = DEFAULT_DEBOUNCE_MS,
    spinnerMinMs = DEFAULT_SPINNER_MIN_MS,
  } = options;

  const [status, setStatus] = useState<HandleAvailabilityStatus>('IDLE');
  const [message, setMessage] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  /**
   * Monotonic request id.
   *
   * [FIX 1 — stale writes] Aborting cancels the HTTP request but not the
   * continuations already queued around it (notably the spinner timer below).
   * Every state write is gated on still being the newest request, so a response
   * that loses the race can never overwrite a newer verdict.
   */
  const requestIdRef = useRef(0);

  const trimmed = (handle ?? '').trim();

  useEffect(() => {
    const requestId = ++requestIdRef.current;

    if (!enabled) {
      setStatus('IDLE');
      setMessage(null);
      setIsChecking(false);
      return;
    }

    // Nothing typed yet is not a validation failure — it is the initial state.
    if (trimmed.length === 0) {
      setStatus('IDLE');
      setMessage(null);
      setIsChecking(false);
      return;
    }

    /**
     * [FIX 2 — the reported crash] Validate the format *before* building the URL.
     *
     * `API_ENDPOINTS.SELLER.CHECK_HANDLE()` runs the value through
     * `validateHandle`, which **throws** `PathSegmentError` on anything outside
     * `[a-zA-Z0-9_-]{3,50}`. That throw landed in the catch below, which assumed
     * every error was an HTTP failure — so a seller mid-word on `my.shop`, or
     * with a store name long enough to generate a 60-character handle, was told
     * "Handle verification failed" and shown an amber "we could not check this"
     * warning. The handle was simply not allowed, and saying so is both true and
     * actionable.
     *
     * Because the shop-handle rules are strictly narrower than `validateHandle`
     * accepts, passing this gate guarantees the URL builder cannot throw.
     */
    const violation = describeShopHandleViolation(trimmed);
    if (violation) {
      setStatus('INVALID');
      setMessage(violation);
      setIsChecking(false);
      return;
    }

    const controller = new AbortController();
    let spinnerTimer: ReturnType<typeof setTimeout> | undefined;

    const debounceTimer = setTimeout(async () => {
      setIsChecking(true);

      try {
        const response = await apiClient.get(API_ENDPOINTS.SELLER.CHECK_HANDLE(trimmed), {
          signal: controller.signal,
          headers: AMBIENT_REQUEST_HEADERS,
        });

        if (requestId !== requestIdRef.current) return;

        /**
         * [FIX 3 — false accusations] Require an actual boolean.
         *
         * The previous `response.data?.data === true` treated *any* unexpected
         * payload — a changed envelope, an HTML error page, a proxy interstitial
         * — as `false`, i.e. "This handle is already taken". That told the
         * seller their chosen name was gone when the truth was that the check
         * never produced an answer, and blocked them behind a validation error
         * they could do nothing about.
         */
        const available = response.data?.data;
        if (typeof available !== 'boolean') {
          throw new Error(
            `Unexpected check-handle payload: expected boolean, received ${typeof available}`
          );
        }

        setStatus(available ? 'AVAILABLE' : 'TAKEN');
        setMessage(available ? null : 'This handle is already taken');
      } catch (error: unknown) {
        // An abort is a non-event — a newer keystroke superseded this request,
        // or the component unmounted.
        if (isAbortError(error)) return;
        if (requestId !== requestIdRef.current) return;

        /**
         * [FIX 4 — the reported console error] Read the error's real shape.
         *
         * The response interceptor rethrows every HTTP failure as `AppError`,
         * which has `statusCode`/`code` and **no** `response` property. The old
         * code tested `'response' in error`, matched nothing, and logged the
         * placeholder `Handle check failed [undefined]: "Handle verification
         * failed"` — discarding a status, an error code and the backend's own
         * message that were all sitting on the error object.
         *
         * `logger.warn`, not `console.error`: a background availability probe
         * failing is a degraded-service warning, not an application error. The
         * `console.error` also drove Next.js' dev error overlay, presenting a
         * non-blocking check as a crash.
         */
        logger.warn('[seller] Shop handle availability check failed', {
          status: getHttpStatus(error),
          code: getErrorCode(error),
          error: getErrorMessage(error, 'Handle verification failed'),
        });

        // Non-blocking: an unavailable check is not the seller's fault, and
        // uniqueness is re-validated server-side on submit regardless.
        setStatus('ERROR');
        setMessage(null);
      } finally {
        /**
         * [FIX 5 — timer leak] The spinner's trailing delay used to be a bare
         * `setTimeout` with no handle kept, so it fired after unmount and could
         * not be cancelled when a newer keystroke arrived.
         */
        spinnerTimer = setTimeout(() => {
          if (requestId === requestIdRef.current) setIsChecking(false);
        }, spinnerMinMs);
      }
    }, debounceMs);

    return () => {
      clearTimeout(debounceTimer);
      if (spinnerTimer) clearTimeout(spinnerTimer);
      controller.abort();
    };
  }, [trimmed, enabled, debounceMs, spinnerMinMs]);

  return { status, isChecking, message };
}
