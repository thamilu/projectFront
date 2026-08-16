import { renderHook } from '@testing-library/react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useOnboardingChecklist, isFilled } from '@/features/seller/hooks/useOnboardingChecklist';

// Mock react-hook-form
jest.mock('react-hook-form', () => ({
  ...jest.requireActual('react-hook-form'),
  useFormContext: jest.fn(),
  useWatch: jest.fn(),
}));

describe('isFilled utility function', () => {
  it('returns false for boolean false', () => {
    expect(isFilled(false)).toBe(false);
  });

  it('returns true for boolean true', () => {
    expect(isFilled(true)).toBe(true);
  });

  it('returns false for empty object', () => {
    expect(isFilled({})).toBe(false);
  });

  it('returns false for empty array', () => {
    expect(isFilled([])).toBe(false);
  });

  it('returns true for non-empty array', () => {
    expect(isFilled(['a'])).toBe(true);
  });

  it('returns false for whitespace string', () => {
    expect(isFilled('   ')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isFilled(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isFilled(undefined)).toBe(false);
  });

  it('returns true for non-empty string', () => {
    expect(isFilled('hello')).toBe(true);
  });

  it('returns true for number 0', () => {
    expect(isFilled(0)).toBe(true);
  });
});

describe('useOnboardingChecklist custom hook', () => {
  const mockControl = {};
  const mockErrors = {};

  beforeEach(() => {
    jest.clearAllMocks();
    (useFormContext as jest.Mock).mockReturnValue({
      control: mockControl,
      formState: { errors: mockErrors },
    });
  });

  it('throws descriptive error in development when called outside of FormProvider', () => {
    (useFormContext as jest.Mock).mockReturnValue(null);
    // useWatch runs unconditionally before the FormProvider guard (see the
    // "production" test above) — configure it so the guard's own throw is
    // what surfaces here, not an unrelated destructuring error from the mock.
    (useWatch as jest.Mock).mockReturnValue(Array(25).fill(undefined));
    const originalEnv = process.env.NODE_ENV;
    (process.env as any).NODE_ENV = 'development';

    expect(() => {
      renderHook(() => useOnboardingChecklist());
    }).toThrow(/must be rendered inside a FormProvider/);

    (process.env as any).NODE_ENV = originalEnv;
  });

  it('returns safe default values in production when called outside of FormProvider', () => {
    (useFormContext as jest.Mock).mockReturnValue(null);
    // useWatch is still called unconditionally (Rules of Hooks) even without a
    // FormProvider — it falls back to an unbound local form's control, which
    // watches nothing, so every field comes back undefined. Configuring the
    // mock to match keeps this aligned with the hook's real (non-mocked)
    // behavior instead of relying on useWatch never being invoked.
    (useWatch as jest.Mock).mockReturnValue(Array(25).fill(undefined));
    const originalEnv = process.env.NODE_ENV;
    (process.env as any).NODE_ENV = 'production';

    const { result } = renderHook(() => useOnboardingChecklist());
    expect(result.current.percentComplete).toBe(0);
    expect(result.current.localKycStatus).toBe('INCOMPLETE');

    (process.env as any).NODE_ENV = originalEnv;
  });

  it('calculates 0% completeness for completely empty form values', () => {
    (useWatch as jest.Mock).mockReturnValue(Array(25).fill(undefined));

    const { result } = renderHook(() => useOnboardingChecklist());

    expect(result.current.percentComplete).toBe(0);
    expect(result.current.stepCompletenessMap['personal-info']).toBe(false);
    expect(result.current.localKycStatus).toBe('INCOMPLETE');
    expect(result.current.localGstStatus).toBe('INCOMPLETE');
  });

  it('calculates 100% completeness when all required fields are correctly filled', () => {
    // Mock the 25 fields for Individual identity type path
    const mockValues = [
      'John', // firstName
      'Doe', // lastName
      'john.doe@example.com', // email
      '+1234567890', // phone
      'male', // gender
      '1990-01-01', // dateOfBirth
      '123 Main St', // addressLine1
      'Mumbai', // city
      'Mumbai', // district
      'Maharashtra', // state
      '400001', // pincode
      'INDIVIDUAL', // identityType
      ['RETAIL'], // businessTypes
      'ABCDE1234F', // panNumber
      '123456789012', // aadhar
      '', // businessPan
      '', // businessName
      'My Shop', // shopName
      '456 Store Rd', // storeAddressLine1
      'Mumbai', // storeCity
      'Maharashtra', // storeState
      '400001', // storePincode
      'my-shop-handle', // shopHandle
      true, // acceptedTerms
      '27AAAAA1111A1Z1', // gstin
    ];

    (useWatch as jest.Mock).mockReturnValue(mockValues);

    const { result } = renderHook(() => useOnboardingChecklist());

    expect(result.current.percentComplete).toBe(100);
    expect(result.current.stepCompletenessMap['personal-info']).toBe(true);
    expect(result.current.stepCompletenessMap['kyc']).toBe(true);
    expect(result.current.localKycStatus).toBe('COMPLETE');
    expect(result.current.localGstStatus).toBe('COMPLETE');
  });

  it('correctly handles KYC INDIVIDUAL status transitions based on regex validation', () => {
    // Individual, only PAN filled, but invalid format
    let mockValues = Array(25).fill(undefined);
    mockValues[11] = 'INDIVIDUAL'; // identityType
    mockValues[13] = 'INVALIDPAN1'; // panNumber

    (useWatch as jest.Mock).mockReturnValue(mockValues);

    const { result, rerender } = renderHook(() => useOnboardingChecklist());
    expect(result.current.localKycStatus).toBe('INVALID');

    // Valid PAN, but missing Aadhaar
    mockValues[13] = 'ABCDE1234F'; // valid panNumber
    (useWatch as jest.Mock).mockReturnValue([...mockValues]);
    rerender();
    expect(result.current.localKycStatus).toBe('INCOMPLETE');

    // Both PAN and Aadhaar valid
    mockValues[14] = '123456789012'; // valid aadhar
    (useWatch as jest.Mock).mockReturnValue([...mockValues]);
    rerender();
    expect(result.current.localKycStatus).toBe('COMPLETE');
  });

  it('correctly handles KYC BUSINESS status transitions', () => {
    // Business, only business PAN filled but invalid format
    let mockValues = Array(25).fill(undefined);
    mockValues[11] = 'BUSINESS'; // identityType
    mockValues[15] = 'INVALIDPAN1'; // businessPan

    (useWatch as jest.Mock).mockReturnValue(mockValues);

    const { result, rerender } = renderHook(() => useOnboardingChecklist());
    expect(result.current.localKycStatus).toBe('INVALID');

    // Valid business PAN, but missing businessName
    mockValues[15] = 'ABCDE1234F'; // valid businessPan
    (useWatch as jest.Mock).mockReturnValue([...mockValues]);
    rerender();
    expect(result.current.localKycStatus).toBe('INCOMPLETE');

    // Valid business PAN and businessName
    mockValues[16] = 'Acme Corp'; // businessName
    (useWatch as jest.Mock).mockReturnValue([...mockValues]);
    rerender();
    expect(result.current.localKycStatus).toBe('COMPLETE');
  });

  it('handles GST status transitions', () => {
    // Invalid GSTIN format
    let mockValues = Array(25).fill(undefined);
    mockValues[24] = 'INVALIDGSTIN1'; // gstin

    (useWatch as jest.Mock).mockReturnValue(mockValues);

    const { result, rerender } = renderHook(() => useOnboardingChecklist());
    expect(result.current.localGstStatus).toBe('INVALID');

    // Valid GSTIN format
    mockValues[24] = '27AAAAA1111A1Z1'; // valid gstin
    (useWatch as jest.Mock).mockReturnValue([...mockValues]);
    rerender();
    expect(result.current.localGstStatus).toBe('COMPLETE');
  });
});
