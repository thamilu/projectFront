/**
 * Coupon validation client.
 *
 * Calls this app's own Next.js route (`app/api/secure/validate-coupon`), which
 * authenticates the caller, throttles attempts, and forwards to the backend
 * coupon service. Coupon rules — expiry, usage limits, minimum purchase,
 * discount caps — are never evaluated client-side.
 *
 * [IMPORTANT] Validation is advisory. It tells the shopper what a code *would*
 * be worth so the cart can show a provisional total; it does not reserve or
 * redeem anything. The authoritative redemption happens backend-side, atomically
 * with order placement — which is why {@link CouponValidationResult} carries no
 * redemption token and why the checkout flow re-sends the raw code rather than
 * the discount figure computed here.
 *
 * @module features/cart/api/coupon-api
 */

import type { ApiErrorBody } from '@/shared/api/response';

/** Provisional discount the backend says this code is worth for this cart. */
export interface CouponValidationResult {
  couponCode: string;
  discountAmount: number;
  finalTotal: number;
  message: string;
}

/**
 * Error carrying the route's stable `errorCode` alongside its display message.
 *
 * The cart UI needs to distinguish "the code is wrong" (show it inline, let the
 * shopper retype) from "the service is down" (show a retry affordance, keep any
 * previously applied code). Branching on a message string would break the first
 * time that copy was edited, so the machine-readable code is carried through.
 */
export class CouponValidationError extends Error {
  readonly errorCode: string;
  readonly status: number;

  constructor(message: string, errorCode: string, status: number) {
    super(message);
    this.name = 'CouponValidationError';
    this.errorCode = errorCode;
    this.status = status;
  }

  /** True when the shopper can fix this by entering a different code. */
  get isUserCorrectable(): boolean {
    return this.status >= 400 && this.status < 500;
  }
}

/**
 * Validate a promo code against the current cart total.
 *
 * @param couponCode Raw code as typed; normalised server-side.
 * @param cartTotal  Current cart subtotal, used for minimum-purchase rules.
 * @param signal     Optional abort signal so a superseded request (the shopper
 *                   edited the code and resubmitted) does not resolve after a
 *                   later one and overwrite fresher state.
 *
 * @throws {CouponValidationError} On any non-success response.
 */
export async function validateCoupon(
  couponCode: string,
  cartTotal: number,
  signal?: AbortSignal
): Promise<CouponValidationResult> {
  const res = await fetch('/api/secure/validate-coupon', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ couponCode, cartTotal }),
    // Same-origin only: this route reads the session cookie.
    credentials: 'same-origin',
    signal,
  });

  // A non-JSON body is possible (a proxy error page, an empty 502), so parsing
  // is guarded and the status is used as the source of truth for success.
  const body: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const error = body as Partial<ApiErrorBody> | null;
    throw new CouponValidationError(
      error?.message ?? `Could not validate this promo code (${res.status}).`,
      error?.errorCode ?? 'UnknownError',
      res.status
    );
  }

  const payload = body as { success?: boolean; data?: CouponValidationResult } | null;

  if (!payload?.success || !payload.data) {
    throw new CouponValidationError(
      'Could not validate this promo code.',
      'MalformedResponse',
      res.status
    );
  }

  return payload.data;
}
