/**
 * Feature Flags Definitions
 * 
 * Declares all active feature flags and their default states.
 * Allows remote override and A/B test splits.
 */
export const featureFlags = {
  // Payment methods
  STRIPE_ENABLED: true,
  RAZORPAY_ENABLED: true,
  UPI_ENABLED: true,
  COD_ENABLED: true,

  // Features
  WISHLIST_ENABLED: true,
  REVIEWS_ENABLED: true,
  COUPONS_ENABLED: true,
  SUBSCRIPTIONS_ENABLED: false,
  TAX_DISPLAY: true,

  // Seller
  SELLER_REGISTRATION_OPEN: true,
  SELLER_PAYOUTS_ENABLED: true,
  BULK_PRODUCT_UPLOAD: false,

  // Delivery
  DELIVERY_AGENT_APP: true,
  LIVE_TRACKING: true,

  // Admin (only for admin app)
  ADMIN_ANALYTICS: true,
  ADMIN_APPROVAL_FLOW: true,

  // Performance
  IMAGE_OPTIMIZATION: true,
  LAZY_LOADING: true,

  // i18n
  HINDI_ENABLED: true,
  MULTI_CURRENCY: false,
} as const;

export type FeatureFlagKey = keyof typeof featureFlags;
