'use client';

/**
 * CTA Click Tracking Hook
 *
 * Encapsulates analytics tracking for CTA click events with:
 * - SSR-safe GDPR consent checking (useEffect + useState, never reads localStorage during SSR)
 * - Double-click prevention via useRef (no re-render on click)
 * - Async fire-and-forget tracking with try/catch error isolation
 * - navigator.sendBeacon for guaranteed delivery on page unload
 * - No client-side timestamps in payload (server assigns timestamps)
 *
 * @module features/seller/hooks/useCtaTracking
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { trackEvent } from '@/core/providers/analytics-provider';

/** Duration in ms before the double-click gate resets. */
const DOUBLE_CLICK_GATE_MS = 2000;

/** localStorage key matching the cookie-consent component contract. */
const CONSENT_STORAGE_KEY = 'cookie_consent';

/**
 * Params required by the CTA tracking hook.
 */
export interface UseCtaTrackingParams {
  /** CTA position on the page (e.g., 'top', 'bottom', 'pricing'). */
  position: 'top' | 'bottom' | 'pricing';
  /** Subscription plan name, if applicable. Defaults to 'unknown' in the payload. */
  planName?: string;
}

/**
 * Reads GDPR analytics consent from localStorage.
 * Returns `false` if consent is not granted, not parseable, or unavailable.
 *
 * This function is only called inside useEffect (client-side) — never during SSR.
 */
function readAnalyticsConsent(): boolean {
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return false;

    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'preferences' in parsed
    ) {
      const prefs = (parsed as { preferences: Record<string, unknown> }).preferences;
      return prefs.analytics === true;
    }
    return false;
  } catch {
    // Fail-safe: no tracking without confirmed consent
    return false;
  }
}

/**
 * Hook that returns a click handler for CTA analytics tracking.
 *
 * The returned callback:
 * 1. Checks GDPR analytics consent — skips tracking if denied.
 * 2. Prevents duplicate tracking on rapid double-clicks.
 * 3. Fires tracking asynchronously so it never blocks navigation.
 * 4. Prefers `navigator.sendBeacon` for guaranteed delivery on page unload.
 * 5. Falls back to `trackEvent` (via Promise microtask) when sendBeacon is unavailable.
 * 6. Catches and silences all analytics errors — navigation is never disrupted.
 *
 * @param params - Position and optional plan name for the tracking payload.
 * @returns A stable click handler function.
 *
 * @example
 * ```tsx
 * const handleCtaClick = useCtaTracking({ position: 'top', planName: 'Growth' });
 * return <a onClick={handleCtaClick}>Start Selling</a>;
 * ```
 */
export function useCtaTracking({ position, planName }: UseCtaTrackingParams): () => void {
  // ── SSR-safe consent state ──────────────────────────────────────────────
  const [hasAnalyticsConsent, setHasAnalyticsConsent] = useState(false);

  useEffect(() => {
    setHasAnalyticsConsent(readAnalyticsConsent());
  }, []);

  // ── Double-click gating via ref (no re-render) ─────────────────────────
  const isNavigatingRef = useRef(false);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup reset timer on unmount
  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  // ── Stable click handler ───────────────────────────────────────────────
  return useCallback(() => {
    // Gate: skip if already navigating (double-click prevention)
    if (isNavigatingRef.current) return;

    // Gate: skip if GDPR analytics consent not granted
    if (!hasAnalyticsConsent) return;

    // Lock the gate
    isNavigatingRef.current = true;

    // Build payload — no client-side timestamp
    const payload = {
      position,
      planName: planName ?? 'unknown',
    };

    // Fire analytics — prefer sendBeacon for page unload guarantee
    try {
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        const body = JSON.stringify({
          event: 'seller_onboarding_cta_clicked',
          ...payload,
        });
        navigator.sendBeacon('/api/analytics/event', body);
      } else {
        // Fallback: async fire-and-forget via microtask
        void Promise.resolve().then(async () => {
          try {
            trackEvent('seller_onboarding_cta_clicked', payload);
          } catch {
            // Silently swallow — analytics failure must never disrupt UX
          }
        });
      }
    } catch {
      // Outer catch — swallow any unexpected error (e.g., SecurityError on sendBeacon)
    }

    // Reset the double-click gate after timeout
    resetTimerRef.current = setTimeout(() => {
      isNavigatingRef.current = false;
    }, DOUBLE_CLICK_GATE_MS);
  }, [position, planName, hasAnalyticsConsent]);
}
