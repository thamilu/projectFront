'use client';

import { useEffect, useState, useCallback } from 'react';

export interface UseSessionExpiredAlertOptions {
  /**
   * Auto-dismiss duration in ms. Defaults to `null` (no auto-dismiss).
   *
   * A session-expiry notice is security-relevant: the user needs to
   * register that their session ended and act on it (re-authenticate).
   * Auto-hiding it on a fixed timer with no way to pause/extend is a real
   * WCAG 2.2 SC 2.2.1 (Timing Adjustable) gap, and — verified against
   * this hook's actual consumer, app/(auth)/login/page.tsx — a genuine
   * live bug, not just a theoretical one: that page's OTHER status alert
   * only renders for `isAuthError && !sessionExpired`, so once this
   * message auto-dismissed while `sessionExpired` was still true, nothing
   * took its place — the user was left with no visible explanation for
   * why they landed on the login page at all. Only pass a non-null value
   * here for a genuinely non-critical, purely-informational message.
   */
  autoDismissMs?: number | null;
}

/**
 * Manages session-expired alert visibility state and (optional) automatic
 * dismissal. Presentation-only: does not itself clear tokens, redirect, or
 * otherwise react to the session actually being invalid — the caller is
 * solely responsible for that; this hook only tracks whether the notice
 * about it should currently be shown.
 *
 * Contract for consumers: render the alert in a `role="alert"` (or
 * `aria-live="assertive"`) region — this hook has no way to enforce that
 * itself, only to document it. (app/(auth)/login/page.tsx's AuthAlert
 * component already satisfies this.)
 */
export function useSessionExpiredAlert(
  sessionExpired: boolean,
  { autoDismissMs = null }: UseSessionExpiredAlertOptions = {}
) {
  const [showMessage, setShowMessage] = useState(sessionExpired);

  // Synchronize alert visibility state if URL/params changes. Deliberately
  // keyed only on the boolean value, not a re-render: if the caller
  // re-renders with the same `sessionExpired` value after the user
  // dismissed it, the alert correctly stays dismissed rather than
  // reappearing — only an actual true→false→true transition re-shows it.
  useEffect(() => {
    setShowMessage(sessionExpired);
  }, [sessionExpired]);

  // Optional auto-dismiss — off by default, see autoDismissMs's docs above.
  useEffect(() => {
    if (!showMessage || autoDismissMs == null) return;

    const timer = setTimeout(() => {
      setShowMessage(false);
    }, autoDismissMs);

    return () => clearTimeout(timer);
  }, [showMessage, autoDismissMs]);

  /** Manual dismissal — the only way this closes under the default (no auto-dismiss) configuration. */
  const dismiss = useCallback(() => {
    setShowMessage(false);
  }, []);

  return { showMessage, dismiss };
}
