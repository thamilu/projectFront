'use client';

import { useMemo } from 'react';
import { useFormContext, useForm, useWatch } from 'react-hook-form';
import { STEPS } from '../constants/seller-form-steps';
import type { SellerOnboardingValues } from '@/domains/seller/contracts/seller.schema';

export const WATCHED_FIELDS = [
  'firstName',
  'lastName',
  'email',
  'phone',
  'gender',
  'dateOfBirth',
  'addressLine1',
  'city',
  'district',
  'state',
  'pincode',
  'identityType',
  'businessTypes',
  'panNumber',
  'aadhar',
  'businessPan',
  'businessName',
  'shopName',
  'storeAddressLine1',
  'storeCity',
  'storeState',
  'storePincode',
  'shopHandle',
  'acceptedTerms',
  'gstin',
  'bankAccountNumber',
  'bankIfsc',
] as const;

export type LocalKycStatus = 'COMPLETE' | 'INCOMPLETE' | 'INVALID';
export type LocalGstStatus = 'COMPLETE' | 'INCOMPLETE' | 'INVALID';

export interface UseOnboardingChecklistResult {
  stepCompletenessMap: Record<string, boolean>;
  percentComplete: number;
  isPhoneEntered: boolean;
  localKycStatus: LocalKycStatus;
  localGstStatus: LocalGstStatus;
  identityType?: string;
  panNumber?: string;
  aadhar?: string;
  businessPan?: string;
  businessName?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  gstin?: string;
  errors?: any;
}

// Strictly-typed isFilled helper defined outside component/hook to prevent re-allocations
export function isFilled(val: unknown): boolean {
  if (val === undefined || val === null) return false;
  if (typeof val === 'boolean') return val === true;
  if (Array.isArray(val)) return val.length > 0;
  if (typeof val === 'object') return false; // Objects are not considered filled directly
  return String(val).trim().length > 0;
}

/**
 * Custom hook to calculate onboarding step completeness and compliance check statuses.
 * Granularly subscribes to form changes using useWatch to avoid redundant re-renders.
 */
export function useOnboardingChecklist(): UseOnboardingChecklistResult {
  const context = useFormContext<SellerOnboardingValues>();

  // Hooks below must run unconditionally on every render (Rules of Hooks) — even
  // when this is misused outside a FormProvider. useWatch throws internally if
  // given an undefined control (verified against the installed react-hook-form
  // version), so a bound, unused local form provides a guaranteed-safe fallback
  // control instead of conditionally skipping straight to an early return.
  const fallbackForm = useForm<SellerOnboardingValues>();
  const control = context?.control ?? fallbackForm.control;
  const errors = context?.formState?.errors ?? {};

  // Granular subscription to form fields
  const [
    firstName,
    lastName,
    email,
    phone,
    gender,
    dateOfBirth,
    addressLine1,
    city,
    district,
    state,
    pincode,
    identityType,
    businessTypes,
    panNumber,
    aadhar,
    businessPan,
    businessName,
    shopName,
    storeAddressLine1,
    storeCity,
    storeState,
    storePincode,
    shopHandle,
    acceptedTerms,
    gstin,
    bankAccountNumber,
    bankIfsc,
  ] = useWatch({
    control,
    name: WATCHED_FIELDS as any,
  }) as any;

  // Calculate completeness per step dynamically
  const isPersonalCompleted = useMemo(() => {
    return (
      isFilled(firstName) &&
      isFilled(lastName) &&
      isFilled(email) &&
      isFilled(phone) &&
      isFilled(gender) &&
      isFilled(dateOfBirth)
    );
  }, [firstName, lastName, email, phone, gender, dateOfBirth]);

  const isAddressCompleted = useMemo(() => {
    return (
      isFilled(addressLine1) &&
      isFilled(city) &&
      isFilled(district) &&
      isFilled(state) &&
      isFilled(pincode)
    );
  }, [addressLine1, city, district, state, pincode]);

  const isIdentityCompleted = useMemo(() => {
    return (
      isFilled(identityType) &&
      Array.isArray(businessTypes) &&
      businessTypes.length > 0
    );
  }, [identityType, businessTypes]);

  const isKycCompleted = useMemo(() => {
    if (identityType === 'INDIVIDUAL') {
      return isFilled(panNumber) && isFilled(aadhar);
    }
    return isFilled(businessPan) && isFilled(businessName);
  }, [identityType, panNumber, aadhar, businessPan, businessName]);

  const isStoreCompleted = useMemo(() => {
    return (
      isFilled(shopName) &&
      isFilled(storeAddressLine1) &&
      isFilled(storeCity) &&
      isFilled(storeState) &&
      isFilled(storePincode) &&
      isFilled(shopHandle)
    );
  }, [shopName, storeAddressLine1, storeCity, storeState, storePincode, shopHandle]);

  const isTermsCompleted = useMemo(() => {
    return acceptedTerms === true;
  }, [acceptedTerms]);

  const stepCompletenessMap = useMemo<Record<string, boolean>>(() => {
    return {
      'personal-info': isPersonalCompleted,
      'permanent-address': isAddressCompleted,
      'identity': isIdentityCompleted,
      'kyc': isKycCompleted,
      'store': isStoreCompleted,
      'terms': isTermsCompleted,
    };
  }, [
    isPersonalCompleted,
    isAddressCompleted,
    isIdentityCompleted,
    isKycCompleted,
    isStoreCompleted,
    isTermsCompleted,
  ]);

  const percentComplete = useMemo(() => {
    if (!STEPS || STEPS.length === 0) {
      return 0;
    }
    const completedCount = STEPS.filter((step) => stepCompletenessMap[step.id]).length;
    return Math.round((completedCount / STEPS.length) * 100);
  }, [stepCompletenessMap]);

  // Derived compliance widget statuses
  const isPhoneEntered = useMemo(() => isFilled(phone), [phone]);

  const localGstStatus = useMemo<LocalGstStatus>(() => {
    if (!isFilled(gstin)) {
      return 'INCOMPLETE';
    }
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;
    const isValid = gstRegex.test(String(gstin).trim());
    return errors.gstin || !isValid ? 'INVALID' : 'COMPLETE';
  }, [gstin, errors.gstin]);

  const localKycStatus = useMemo<LocalKycStatus>(() => {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i;
    const aadharRegex = /^\d{12}$/;

    if (identityType === 'INDIVIDUAL') {
      const hasPan = isFilled(panNumber);
      const hasAadhar = isFilled(aadhar);

      if (!hasPan && !hasAadhar) {
        return 'INCOMPLETE';
      }

      const isPanValid = hasPan && panRegex.test(String(panNumber).trim());
      const isAadharValid = hasAadhar && aadharRegex.test(String(aadhar).trim());

      const hasValidationError = errors.panNumber || errors.aadhar;

      if (hasValidationError || (hasPan && !isPanValid) || (hasAadhar && !isAadharValid)) {
        return 'INVALID';
      }

      return isPanValid && isAadharValid ? 'COMPLETE' : 'INCOMPLETE';
    } else {
      const hasBusPan = isFilled(businessPan);
      const hasBusName = isFilled(businessName);

      if (!hasBusPan) {
        return 'INCOMPLETE';
      }

      const isBusPanValid = panRegex.test(String(businessPan).trim());
      const hasValidationError = errors.businessPan;

      if (hasValidationError || !isBusPanValid) {
        return 'INVALID';
      }

      return isBusPanValid && hasBusName ? 'COMPLETE' : 'INCOMPLETE';
    }
  }, [identityType, panNumber, aadhar, businessPan, businessName, errors.panNumber, errors.aadhar, errors.businessPan]);

  // Checked after all hooks above have already run (not before, and not via an
  // early return) so the hook call order never changes between renders — see
  // the comment at the top of this function.
  if (!context) {
    const errorMsg =
      '[OnboardingChecklist] must be rendered inside a FormProvider. ' +
      'Wrap the parent component with <FormProvider methods={methods}>.';
    if (process.env.NODE_ENV !== 'production') {
      throw new Error(errorMsg);
    }
    // In production, log a warning and fall through with the safe/incomplete
    // defaults the useMemo calls above already computed from undefined fields.
    console.warn(errorMsg);
  }

  return {
    stepCompletenessMap,
    percentComplete,
    isPhoneEntered,
    localKycStatus,
    localGstStatus,
    identityType,
    panNumber,
    aadhar,
    businessPan,
    businessName,
    bankAccountNumber,
    bankIfsc,
    gstin,
    errors,
  };
}
