/**
 * onboarding-steps.ts
 *
 * Centralized keys for the seller onboarding steps
 * to avoid fragile hardcoded magic strings.
 */

export const ONBOARDING_STEP_KEYS = {
  IDENTITY: 'step-identity',
  PROFILE: 'step-profile',
  KYC: 'step-kyc',
  REVIEW: 'step-review',
  VERIFICATION: 'step-verification',
} as const;
