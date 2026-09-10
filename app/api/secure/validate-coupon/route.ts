/**
 * POST /api/secure/validate-coupon
 *
 * Validates a discount code against the backend coupon service and returns
 * the discount it would apply to the supplied cart total.
 *
 * [SECURITY] This route is a thin, authenticated pass-through. It deliberately
 * holds no coupon rules of its own. A previous version kept a module-level
 * `SECRET_COUPONS` map with three hardcoded codes, which meant:
 *
 *   1. `usedCount` was a constant that never incremented, so the `usageLimit`
 *      check could never fire — every code was redeemable an unlimited number
 *      of times by every user;
 *   2. the per-user "already redeemed" check was a commented-out stub;
 *   3. the route was unauthenticated and unthrottled, so the code space was
 *      enumerable by brute force;
 *   4. every `expiryDate` was a literal in the past, so in practice the
 *      endpoint rejected all three codes as expired.
 *
 * Coupon state is inherently transactional (a redemption must be atomic with
 * order placement) and therefore cannot live in a stateless edge/serverless
 * route. Validation is advisory only — the authoritative redemption happens
 * backend-side at order creation. The client is told as much by the response
 * shape, which carries no redemption token.
 *
 * @see shared/api — request/response toolkit used by every route here
 */

import { z } from 'zod';
import {
  withRoute,
  requireSession,
  readValidatedBody,
  enforceRateLimit,
  apiSuccess,
  mapUpstreamError,
} from '@/shared/api';
import { serverBackendFetch } from '@/core/client/server-fetch';
import { API_ENDPOINTS } from '@/shared/constants/api/endpoints';

// ============================================================
// 1. CONTRACT
// ============================================================

/**
 * Coupon codes are constrained at the edge as defence in depth: a bounded
 * character set and length stop obviously-malicious values from reaching the
 * backend at all, and cap the cost of the lookup.
 */
const validateCouponSchema = z.object({
  couponCode: z
    .string()
    .trim()
    .min(3, 'Enter a valid promo code.')
    .max(32, 'Promo codes are at most 32 characters.')
    .regex(/^[A-Za-z0-9_-]+$/, 'Promo codes contain only letters, numbers, hyphens and underscores.')
    .transform((code) => code.toUpperCase()),
  /**
   * Advisory only — the backend recomputes the cart total from its own
   * records. Sent so the backend can evaluate a minimum-purchase rule
   * against the cart the shopper is currently looking at, and so the
   * response message can cite a shortfall.
   */
  cartTotal: z.number().nonnegative().finite().max(10_000_000),
});

/** Shape the cart UI consumes. Intentionally carries no redemption token. */
export interface CouponValidationResponse {
  couponCode: string;
  discountAmount: number;
  finalTotal: number;
  message: string;
}

/**
 * Backend contract. Fields are optional because a defensive route must not
 * assume an upstream response is well-formed — see `normalise()` below.
 */
interface BackendCouponResponse {
  couponCode?: string;
  code?: string;
  discountAmount?: number;
  finalTotal?: number;
  message?: string;
}

// ============================================================
// 2. LIMITS
// ============================================================

/**
 * Coupon validation is the classic brute-force target: a valid code is worth
 * money, and the code space is small enough to enumerate. Throttled per user
 * rather than per IP so a proxy pool does not defeat it.
 */
const RATE_LIMIT_MESSAGE =
  'Too many promo code attempts. Please wait a moment before trying again.';

// ============================================================
// 3. HANDLER
// ============================================================

export const POST = withRoute('secure/validate-coupon', async (req, { log }) => {
  const caller = await requireSession(req);

  await enforceRateLimit(`coupon:validate:${caller.userId}`, RATE_LIMIT_MESSAGE);

  const { couponCode, cartTotal } = await readValidatedBody(req, validateCouponSchema);

  log.info('Validating coupon', {
    userId: caller.userId,
    // The code itself is logged: it is not a secret, and knowing which codes
    // are being attempted is exactly what makes abuse detectable.
    couponCode,
    cartTotal,
  });

  let backend: BackendCouponResponse;
  try {
    const result = await serverBackendFetch<BackendCouponResponse>(
      API_ENDPOINTS.COUPONS.VALIDATE,
      caller.accessToken,
      { method: 'POST', body: { couponCode, cartTotal } }
    );
    backend = result.data;
  } catch (error) {
    // A 4xx here is a legitimate business answer ("expired", "minimum not
    // met") that the shopper needs to read verbatim; surfacing it as a
    // blanket 500 would replace a useful explanation with "something went
    // wrong". `mapUpstreamError` preserves safe upstream text and discards
    // anything that looks like a stack trace or an HTML error page.
    log.info('Coupon rejected or unavailable', { userId: caller.userId, couponCode });
    throw mapUpstreamError(error, 'This promo code cannot be applied right now.');
  }

  const payload = normalise(backend, couponCode, cartTotal);

  log.info('Coupon validated', {
    userId: caller.userId,
    couponCode,
    discountAmount: payload.discountAmount,
  });

  return apiSuccess<{ success: true; data: CouponValidationResponse }>({
    success: true,
    data: payload,
  });
});

// ============================================================
// 4. HELPERS
// ============================================================

/**
 * Project the backend response onto this route's public contract.
 *
 * Every numeric field is clamped rather than trusted: a negative discount
 * would *increase* the total, and a discount exceeding the cart total would
 * produce a negative payable amount. Neither should ever occur, but a
 * pricing-adjacent surface is the wrong place to assume an upstream is
 * well-behaved.
 */
function normalise(
  backend: BackendCouponResponse,
  requestedCode: string,
  cartTotal: number
): CouponValidationResponse {
  const rawDiscount = Number(backend.discountAmount ?? 0);
  const discountAmount = Number.isFinite(rawDiscount)
    ? Math.min(Math.max(rawDiscount, 0), cartTotal)
    : 0;

  const rawFinal = Number(backend.finalTotal);
  const finalTotal = Number.isFinite(rawFinal)
    ? Math.max(rawFinal, 0)
    : Math.max(cartTotal - discountAmount, 0);

  return {
    couponCode: backend.couponCode ?? backend.code ?? requestedCode,
    discountAmount,
    finalTotal,
    message: backend.message ?? 'Promo code applied.',
  };
}
