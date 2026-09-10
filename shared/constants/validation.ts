/**
 * Validation Rules Constants
 * Aligned with backend validations (e.g. max string lengths, review lengths, password length requirements)
 */
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 12,
  MAX_PASSWORD_LENGTH: 128,
  MIN_PRODUCT_PRICE: 0.01,
  MAX_PRODUCT_NAME_LENGTH: 200,
  MAX_DESCRIPTION_LENGTH: 5000,
  MAX_REVIEW_LENGTH: 1000,
} as const;

export type ValidationConfig = typeof VALIDATION;
