import type { Path, FieldErrors } from 'react-hook-form';
import type { SellerOnboardingValues } from '@/domains/seller/contracts/seller.schema';

export function getFieldsForStep(step: number): Path<SellerOnboardingValues>[] {
  switch (step) {
    case 0:
      return [
        'firstName',
        'lastName',
        'email',
        'phone',
        'gender',
        'dateOfBirth',
        'preferredLanguage',
        'alternatePhone',
      ];
    case 1:
      return [
        'addressLine1',
        'addressLine2',
        'city',
        'district',
        'taluk',
        'state',
        'pincode',
        'country',
      ];
    case 2:
      return ['identityType', 'businessTypes'];
    case 3:
      return ['panNumber', 'aadhar', 'gstin', 'businessPan'];
    case 4:
      return [
        'shopName',
        'shopHandle',
        'shopLogoUrl',
        'description',
        'businessPhone',
        'storeAddressLine1',
        'storeAddressLine2',
        'storeCity',
        'storeDistrict',
        'storeTaluk',
        'storeState',
        'storePincode',
        'storeCountry',
        'googleMapsUrl',
        // Bank/payout details — rendered by BankDetailsFields within
        // StoreStep (see StoreStep.tsx); validated as part of the same step.
        'bankAccountNumber',
        'bankAccountNumberConfirm',
        'bankIfsc',
      ];
    case 5:
      return ['acceptedTerms'];
    default:
      return [];
  }
}

export function findFirstErrorStep(errors: FieldErrors<SellerOnboardingValues>): number {
  const steps = [0, 1, 2, 3, 4, 5];

  return steps.findIndex((step) => {
    const fields = getFieldsForStep(step);
    return fields.some((field) => field in errors);
  });
}
