'use client';

/**
 * The promo code applied to the current basket, shared across the cart and
 * checkout screens.
 *
 * [REVENUE] Previously `appliedCoupon` was local state on the cart page and was
 * never passed into `createOrder`. A shopper could enter a valid code, watch
 * the discount appear, click through to checkout — and be charged full price
 * with no explanation. The two screens also computed their totals differently,
 * so they displayed two different figures for the same basket.
 *
 * [SECURITY] Only the **code** is persisted, never the discount amount. A
 * stored figure would be attacker-writable (browser console, extension) and,
 * more mundanely, would go stale as the basket changed. The discount is always
 * re-derived by asking the server to validate the code against the current
 * total, so the number shown is one the server has just agreed to.
 *
 * Storage is `sessionStorage`, not `localStorage`: a promo belongs to the
 * shopping session in progress. Persisting it for weeks would resurrect a code
 * against an unrelated basket long after the shopper forgot applying it.
 *
 * @module features/cart/hooks/use-applied-coupon
 */

import { useCallback, useEffect, useState } from 'react';
import { createPersistentStore } from '@/shared/utils/persistent-state';

/** The only thing worth persisting — see the security note above. */
interface StoredCoupon {
  code: string;
}

const appliedCouponStore = createPersistentStore<StoredCoupon | null>({
  key: 'eshop:cart:applied-coupon',
  version: 1,
  fallback: null,
  kind: 'session',
  validate: (value): value is StoredCoupon | null =>
    value === null ||
    (typeof value === 'object' &&
      value !== null &&
      typeof (value as StoredCoupon).code === 'string' &&
      (value as StoredCoupon).code.length > 0 &&
      (value as StoredCoupon).code.length <= 32),
});

export interface UseAppliedCouponResult {
  /** The code the shopper applied, or null. Uppercased for display. */
  code: string | null;
  /** False until storage has been read, so consumers can defer validating. */
  isReady: boolean;
  apply: (code: string) => void;
  clear: () => void;
}

/**
 * Read and write the session's applied promo code.
 *
 * Consumers are expected to validate the code server-side and render the
 * discount the server returns — this hook intentionally exposes no amount.
 */
export function useAppliedCoupon(): UseAppliedCouponResult {
  const [code, setCode] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Hydrated after mount: reading storage during render would desynchronise
  // server and client markup.
  useEffect(() => {
    setCode(appliedCouponStore.read()?.code ?? null);
    setIsReady(true);
  }, []);

  const apply = useCallback((raw: string) => {
    const normalised = raw.trim().toUpperCase();
    if (!normalised) return;
    appliedCouponStore.write({ code: normalised });
    setCode(normalised);
  }, []);

  const clear = useCallback(() => {
    appliedCouponStore.clear();
    setCode(null);
  }, []);

  return { code, isReady, apply, clear };
}
