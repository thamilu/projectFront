/**
 * SECURE COUPON VALIDATION API
 * 
 * This route validates discount coupons with secret business rules
 * that should NEVER be exposed to the client.
 * 
 * Time Complexity: O(1)
 * Space Complexity: O(1)
 */

import { NextRequest, NextResponse } from 'next/server';

// ✅ SAFE: Secret coupon codes and rules hidden from client
interface CouponRule {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchase: number;
  maxDiscount?: number;
  expiryDate: Date;
  usageLimit: number;
  usedCount: number;
}

// ✅ SAFE: This database would be in your actual database
// Client can NEVER see these coupon codes or rules
const SECRET_COUPONS: Record<string, CouponRule> = {
  'SAVE20': {
    code: 'SAVE20',
    discountType: 'percentage',
    discountValue: 20,
    minPurchase: 500,
    maxDiscount: 200,
    expiryDate: new Date('2025-12-31'),
    usageLimit: 1000,
    usedCount: 234,
  },
  'FIRST100': {
    code: 'FIRST100',
    discountType: 'fixed',
    discountValue: 100,
    minPurchase: 1000,
    expiryDate: new Date('2025-12-31'),
    usageLimit: 500,
    usedCount: 89,
  },
  'PREMIUM50': {
    code: 'PREMIUM50',
    discountType: 'percentage',
    discountValue: 50,
    minPurchase: 2000,
    maxDiscount: 500,
    expiryDate: new Date('2025-12-31'),
    usageLimit: 100,
    usedCount: 45,
  },
};

/**
 * POST /api/secure/validate-coupon
 * 
 * Request body:
 * {
 *   "couponCode": string,
 *   "cartTotal": number,
 *   "userId": string (optional)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { couponCode, cartTotal, userId } = body;

    // Validate input
    if (!couponCode || !cartTotal || cartTotal < 0) {
      return NextResponse.json(
        { error: 'Invalid coupon code or cart total' },
        { status: 400 }
      );
    }

    // ✅ SAFE: Look up coupon in secret database
    const coupon = SECRET_COUPONS[couponCode.toUpperCase()];

    if (!coupon) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid coupon code',
        },
        { status: 404 }
      );
    }

    // ✅ SAFE: Validate coupon rules (hidden from client)
    const validation = validateCouponRules(coupon, cartTotal, userId);

    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.reason,
        },
        { status: 400 }
      );
    }

    // ✅ SAFE: Calculate discount using secret algorithm
    const discount = calculateDiscount(coupon, cartTotal);

    // Return only necessary information to client
    return NextResponse.json({
      success: true,
      data: {
        couponCode: coupon.code,
        discountAmount: discount,
        finalTotal: Math.max(0, cartTotal - discount),
        message: `Coupon applied! You saved ₹${discount}`,
      },
    });
  } catch (error) {
    console.error('Coupon validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate coupon' },
      { status: 500 }
    );
  }
}

// ✅ SAFE: Server-only validation logic
function validateCouponRules(
  coupon: CouponRule,
  cartTotal: number,
  userId?: string
): { isValid: boolean; reason?: string } {
  // Check expiry
  if (new Date() > coupon.expiryDate) {
    return { isValid: false, reason: 'Coupon has expired' };
  }

  // Check usage limit
  if (coupon.usedCount >= coupon.usageLimit) {
    return { isValid: false, reason: 'Coupon usage limit reached' };
  }

  // Check minimum purchase
  if (cartTotal < coupon.minPurchase) {
    return {
      isValid: false,
      reason: `Minimum purchase of ₹${coupon.minPurchase} required`,
    };
  }

  // Additional user-specific checks can be added here
  // Example: Check if user already used this coupon
  if (userId) {
    // Query database to check user's coupon usage
    // const hasUsed = await db.couponUsage.find({ userId, couponCode });
    // if (hasUsed) return { isValid: false, reason: 'Already used' };
  }

  return { isValid: true };
}

// ✅ SAFE: Calculate discount with secret business logic
function calculateDiscount(coupon: CouponRule, cartTotal: number): number {
  let discount = 0;

  if (coupon.discountType === 'percentage') {
    discount = (cartTotal * coupon.discountValue) / 100;
    
    // Apply max discount cap if exists
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
  } else {
    // Fixed amount discount
    discount = Math.min(coupon.discountValue, cartTotal);
  }

  return Math.round(discount * 100) / 100;
}
