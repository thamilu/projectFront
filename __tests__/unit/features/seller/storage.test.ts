import { sanitizeOnboardingDraftForStorage } from '@/features/seller/utils/storage';

describe('sanitizeOnboardingDraftForStorage', () => {
  // Regression: the onboarding autosave (SellerRoleUpgradeForm.tsx) used to
  // JSON.stringify the ENTIRE form state straight into localStorage every
  // second — including PAN, Aadhaar, GSTIN, and bank account details — in
  // plaintext, with no encryption. This function is the single choke point
  // that must strip those fields before anything reaches localStorage.
  it('strips PAN, Aadhaar, GSTIN, and bank fields', () => {
    const formValues = {
      firstName: 'Jane',
      lastName: 'Doe',
      shopName: 'Jane\'s Shop',
      panNumber: 'ABCDE1234F',
      businessPan: 'XYZAB5678C',
      aadhar: '123456789012',
      gstin: '22AAAAA0000A1Z5',
      bankAccountNumber: '000123456789',
      bankAccountNumberConfirm: '000123456789',
      bankIfsc: 'HDFC0001234',
    };

    const sanitized = sanitizeOnboardingDraftForStorage(formValues);

    expect(sanitized).not.toHaveProperty('panNumber');
    expect(sanitized).not.toHaveProperty('businessPan');
    expect(sanitized).not.toHaveProperty('aadhar');
    expect(sanitized).not.toHaveProperty('gstin');
    expect(sanitized).not.toHaveProperty('bankAccountNumber');
    expect(sanitized).not.toHaveProperty('bankAccountNumberConfirm');
    expect(sanitized).not.toHaveProperty('bankIfsc');
  });

  it('preserves non-sensitive step-progress fields', () => {
    const formValues = {
      firstName: 'Jane',
      lastName: 'Doe',
      shopName: "Jane's Shop",
      city: 'Chennai',
      panNumber: 'ABCDE1234F',
    };

    const sanitized = sanitizeOnboardingDraftForStorage(formValues);

    expect(sanitized).toMatchObject({
      firstName: 'Jane',
      lastName: 'Doe',
      shopName: "Jane's Shop",
      city: 'Chennai',
    });
  });

  it('does not mutate the original object', () => {
    const formValues = { panNumber: 'ABCDE1234F', firstName: 'Jane' };
    sanitizeOnboardingDraftForStorage(formValues);
    expect(formValues).toHaveProperty('panNumber', 'ABCDE1234F');
  });
});
