import type { SellerOnboardingValues } from '@/domains/seller/contracts/seller.schema';

/**
 * Field names for permanent address validation.
 *
 * Used by useEditableStepValidation to trigger validation
 * when user clicks "Done Editing" or "Lock & Save".
 */
export const PERMANENT_ADDRESS_FIELDS = [
  'addressLine1',
  'addressLine2',
  'city',
  'district',
  'taluk',
  'state',
  'pincode',
  'country',
] as const satisfies ReadonlyArray<keyof SellerOnboardingValues>;

export type PermanentAddressField = (typeof PERMANENT_ADDRESS_FIELDS)[number];
