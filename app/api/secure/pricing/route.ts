/**
 * SECURE SERVER-SIDE API ROUTE
 * 
 * This code runs ONLY on the server and is never exposed to the browser.
 * Perfect for sensitive business logic like pricing calculations, discounts, etc.
 * 
 * Time Complexity: O(n) where n is number of items
 * Space Complexity: O(1)
 */

import { NextRequest, NextResponse } from 'next/server';

// ✅ SAFE: This interface is only used on server-side
interface PricingCalculation {
  basePrice: number;
  discount: number;
  tax: number;
  shippingCost: number;
  finalPrice: number;
}

// ✅ SAFE: Secret discount logic hidden from client
const PREMIUM_DISCOUNT_RATE = 0.25; // 25% off for premium users
const TAX_RATE = 0.18; // 18% tax
const FREE_SHIPPING_THRESHOLD = 1000;

/**
 * Calculate final price with hidden business logic
 * This function is NEVER sent to the browser
 */
function calculateSecurePrice(
  basePrice: number,
  isPremium: boolean,
  quantity: number
): PricingCalculation {
  // Secret business logic hidden from public
  const subtotal = basePrice * quantity;
  const discount = isPremium ? subtotal * PREMIUM_DISCOUNT_RATE : 0;
  const afterDiscount = subtotal - discount;
  const tax = afterDiscount * TAX_RATE;
  const shippingCost = afterDiscount >= FREE_SHIPPING_THRESHOLD ? 0 : 50;
  const finalPrice = afterDiscount + tax + shippingCost;

  return {
    basePrice: subtotal,
    discount,
    tax,
    shippingCost,
    finalPrice: Math.round(finalPrice * 100) / 100,
  };
}

/**
 * POST /api/secure/pricing
 * 
 * Request body:
 * {
 *   "productId": string,
 *   "quantity": number,
 *   "userId": string (optional)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, quantity = 1, userId } = body;

    // Validate input
    if (!productId || quantity < 1) {
      return NextResponse.json(
        { error: 'Invalid product ID or quantity' },
        { status: 400 }
      );
    }

    // ✅ SAFE: Fetch user data from database (server-side only)
    // In real app, you'd check database for premium status
    const isPremium = userId ? await checkPremiumStatus(userId) : false;

    // ✅ SAFE: Get base price from database (hidden from client)
    const basePrice = await getProductBasePrice(productId);

    if (!basePrice) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // ✅ SAFE: Calculate with secret business logic
    const pricing = calculateSecurePrice(basePrice, isPremium, quantity);

    // Return only necessary data to client
    return NextResponse.json({
      success: true,
      data: {
        finalPrice: pricing.finalPrice,
        breakdown: {
          subtotal: pricing.basePrice,
          discount: pricing.discount,
          tax: pricing.tax,
          shipping: pricing.shippingCost,
        },
      },
    });
  } catch (error) {
    console.error('Pricing calculation error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate price' },
      { status: 500 }
    );
  }
}

// ✅ SAFE: Helper functions run only on server
async function checkPremiumStatus(userId: string): Promise<boolean> {
  // In production, query your database
  // Example: const user = await db.users.findById(userId);
  // return user?.membershipType === 'PREMIUM';
  
  // Mock implementation
  return userId.includes('premium');
}

async function getProductBasePrice(productId: string): Promise<number | null> {
  // In production, query your database
  // Example: const product = await db.products.findById(productId);
  // return product?.price;
  
  // Mock implementation
  const mockPrices: Record<string, number> = {
    'prod-1': 999,
    'prod-2': 1499,
    'prod-3': 599,
  };
  
  return mockPrices[productId] || null;
}
