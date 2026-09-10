/**
 * Feature Flags Definitions
 *
 * Declares all active feature flags and their default states.
 * Allows remote override and A/B test splits.
 */
export const featureFlags = {
  // Personalized features
  CUSTOMER_DASHBOARD: true,

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

  // Homepage marketing section that ships with placeholder content and must
  // stay off until real content backs it (see home-sections.config.tsx):
  // three fabricated named "customers" with stock avatars — presenting
  // invented endorsements as genuine is a real trust/compliance risk, not
  // just an empty state. (The other homepage placeholder finding from the
  // same audit — a fake "Best Sellers" slider with hardcoded mock items —
  // was removed outright rather than flagged off, since it was a redundant
  // duplicate of the real, data-backed FeaturedProductsSection already on
  // the same page.)
  HOME_TESTIMONIALS: false,
} as const;

export type FeatureFlagKey = keyof typeof featureFlags;

/**
 * Checks if a feature flag is enabled.
 */
export function isFeatureEnabled(flag: FeatureFlagKey): boolean {
  return featureFlags[flag] ?? false;
}
