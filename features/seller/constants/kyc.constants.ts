/**
 * kyc.constants.ts
 *
 * Centralized business rules and validation patterns for KYC onboarding.
 */

export const KYC_PATTERNS = {
  // 5 uppercase alphabets, 4 digits, 1 alphabet
  PAN: /^[A-Z]{5}[0-9]{4}[A-Z]$/,
  // 2 digits, 5 alphabets, 4 digits, 1 alphabet, 1 alphanumeric, 'Z', 1 alphanumeric
  GSTIN: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/,
  // 12 digits
  AADHAR: /^\d{12}$/,
} as const;

export const KYC_FIELD_LENGTHS = {
  PAN: 10,
  GSTIN: 15,
  AADHAR: 12,
  BUSINESS_NAME_MAX: 200,
} as const;
