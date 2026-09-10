export interface PricingPolicy {
  freeShippingThreshold: number;
  standardShippingCharge: number;
  taxRate: number;
}

/**
 * Placeholder shipping/tax policy. These specific figures (as well as this
 * function's shipping/tax computation entirely) are NOT sourced from the
 * backend — API_ENDPOINTS.SHIPPING.CALCULATE and API_ENDPOINTS.TAX.CALCULATE
 * already exist as real, versioned backend endpoints but have zero callers
 * anywhere in the frontend. Wiring this cart preview to them (rather than
 * this static policy) is tracked as a follow-up requiring the backend
 * team's request/response contract, since guessing at an unverified
 * external contract for a checkout-adjacent computation is a correctness
 * risk this file deliberately avoids taking on unilaterally.
 */
export const DEFAULT_CART_PRICING_POLICY: PricingPolicy = {
  freeShippingThreshold: 50,
  standardShippingCharge: 9.99,
  taxRate: 0.08,
};

export function calculateCartTotals(
  items: Array<{ price: number; quantity: number }>,
  // Real, server-validated discount amount (see useValidateCoupon /
  // app/api/secure/validate-coupon) — previously this parameter was the
  // applied promo *code* itself, checked against a single hardcoded string
  // ('SAVE10') and converted to a flat percentage entirely client-side,
  // with no server involvement at all.
  discountAmount = 0,
  policy: PricingPolicy = DEFAULT_CART_PRICING_POLICY
) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  // Never let a discount exceed the subtotal it's applied to, regardless of
  // what the server returned — a defensive floor, not a trust boundary
  // (the server has already validated the discount; this just protects the
  // arithmetic below from going negative if it somehow did not).
  const discount = Math.max(0, Math.min(discountAmount, subtotal));
  const shipping =
    subtotal > policy.freeShippingThreshold || subtotal === 0 ? 0 : policy.standardShippingCharge;
  const taxable = Math.max(0, subtotal - discount);
  const tax = taxable * policy.taxRate;
  const total = taxable + shipping + tax;
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const freeShipProgress = Math.min(100, (subtotal / policy.freeShippingThreshold) * 100);
  const freeShipRemaining = Math.max(0, policy.freeShippingThreshold - subtotal);

  return {
    subtotal,
    discount,
    shipping,
    taxable,
    tax,
    total,
    totalItems,
    freeShipProgress,
    freeShipRemaining,
    policy,
  };
}
