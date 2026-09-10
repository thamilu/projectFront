import { calculateCartTotals, DEFAULT_CART_PRICING_POLICY } from '@/features/cart/utils/pricing-policy';

describe('calculateCartTotals', () => {
  const items = [{ price: 30, quantity: 2 }]; // subtotal = 60

  it('computes subtotal, shipping, tax and total with no discount', () => {
    const totals = calculateCartTotals(items);
    expect(totals.subtotal).toBe(60);
    expect(totals.discount).toBe(0);
    // 60 > freeShippingThreshold (50) => free shipping
    expect(totals.shipping).toBe(0);
    expect(totals.tax).toBeCloseTo(60 * DEFAULT_CART_PRICING_POLICY.taxRate);
    expect(totals.total).toBeCloseTo(totals.taxable + totals.shipping + totals.tax);
  });

  it('charges standard shipping below the free-shipping threshold', () => {
    const totals = calculateCartTotals([{ price: 10, quantity: 1 }]);
    expect(totals.shipping).toBe(DEFAULT_CART_PRICING_POLICY.standardShippingCharge);
  });

  // Regression: this parameter used to be the applied promo *code* itself,
  // matched against a single hardcoded string client-side. It is now a
  // real, server-validated discount amount (see useValidateCoupon).
  it('applies a real server-validated discount amount', () => {
    const totals = calculateCartTotals(items, 15);
    expect(totals.discount).toBe(15);
    expect(totals.taxable).toBe(45);
  });

  it('never lets a discount amount exceed the subtotal', () => {
    const totals = calculateCartTotals(items, 9999);
    expect(totals.discount).toBe(60);
    expect(totals.taxable).toBe(0);
  });

  it('treats a negative discount as zero rather than inflating the total', () => {
    const totals = calculateCartTotals(items, -50);
    expect(totals.discount).toBe(0);
  });

  it('reports free-shipping progress relative to the threshold', () => {
    const totals = calculateCartTotals([{ price: 25, quantity: 1 }]);
    expect(totals.freeShipProgress).toBe(50);
    expect(totals.freeShipRemaining).toBe(25);
  });
});
