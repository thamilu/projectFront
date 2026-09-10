import { sellerOnboardingSchema } from '@/domains/seller/contracts/seller.schema';
import { SellerIdentityType, SellerBusinessType } from '@/domains/seller/contracts/seller.types';

function baseValues(overrides: Record<string, unknown> = {}) {
  return {
    identityType: SellerIdentityType.INDIVIDUAL,
    businessTypes: [SellerBusinessType.RETAILER],
    addressLine1: '123 Main Street',
    city: 'Chennai',
    district: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600001',
    country: 'India',
    shopName: 'My Shop',
    shopHandle: 'my-shop',
    storeAddressLine1: '123 Store Street',
    storeCity: 'Chennai',
    storeDistrict: 'Chennai',
    storeState: 'Tamil Nadu',
    storePincode: '600001',
    storeCountry: 'India',
    acceptedTerms: true,
    panNumber: '',
    aadhar: '',
    gstin: '',
    businessPan: '',
    // Required as of the bank-details wiring — irrelevant to the KYC
    // assertions in this file, so a valid fixed value keeps them isolated.
    bankAccountNumber: '123456789012',
    bankAccountNumberConfirm: '123456789012',
    bankIfsc: 'SBIN0123456',
    ...overrides,
  };
}

describe('sellerOnboardingSchema — KYC identity requirement', () => {
  // Regression: every KYC field (panNumber/aadhar/gstin/businessPan) was
  // independently optional-or-empty-string with no rule requiring ANY of
  // them — a seller could submit the entire onboarding wizard with the
  // whole "Legal / KYC Verification" step left blank.

  it('rejects an INDIVIDUAL seller with no PAN or Aadhaar', () => {
    const result = sellerOnboardingSchema.safeParse(baseValues());

    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('panNumber');
      expect(paths).toContain('aadhar');
    }
  });

  it('accepts an INDIVIDUAL seller with a valid PAN and Aadhaar', () => {
    const result = sellerOnboardingSchema.safeParse(
      baseValues({ panNumber: 'ABCDE1234F', aadhar: '123456789012' })
    );

    expect(result.success).toBe(true);
  });

  it('rejects a BUSINESS seller with no Business PAN or GSTIN', () => {
    const result = sellerOnboardingSchema.safeParse(
      baseValues({ identityType: SellerIdentityType.BUSINESS })
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('businessPan');
      expect(paths).toContain('gstin');
    }
  });

  it('accepts a BUSINESS seller with a valid Business PAN and GSTIN', () => {
    const result = sellerOnboardingSchema.safeParse(
      baseValues({
        identityType: SellerIdentityType.BUSINESS,
        businessPan: 'XYZAB5678C',
        gstin: '22AAAAA0000A1Z5',
      })
    );

    expect(result.success).toBe(true);
  });

  it('rejects a malformed Business PAN (regression: businessPan previously had no format validation at all)', () => {
    const result = sellerOnboardingSchema.safeParse(
      baseValues({
        identityType: SellerIdentityType.BUSINESS,
        businessPan: 'not-a-pan',
        gstin: '22AAAAA0000A1Z5',
      })
    );

    expect(result.success).toBe(false);
  });
});
