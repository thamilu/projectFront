import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { SellerOnboardingFormData } from '@/schemas/seller.schema';
import { SellerIdentityType } from '@/types';

export const STEPS_DATA = [
  { id: 'identity', title: 'Identity & Business Type' },
  { id: 'store', title: 'Store Details' },
  { id: 'kyc', title: 'Verification (KYC)' },
  { id: 'finance', title: 'Financials & Agreement' },
];

const STEP_VALIDATION: Record<number, (keyof SellerOnboardingFormData)[]> = {
  0: ['identityType', 'businessTypes'],
  1: ['shopName', 'phone', 'description'],
  2: ['panNumber', 'aadhar', 'businessName', 'businessPan', 'gstin', 'authorizedSignatory'],
  3: [],
};

const FUTURE_STEP_FIELDS: Record<number, (keyof SellerOnboardingFormData)[]> = {
  0: ['shopName', 'phone', 'description', 'panNumber', 'aadhar', 'businessName', 'businessPan', 'gstin', 'authorizedSignatory', 'bankAccountNumber', 'bankIfsc', 'acceptedTerms'],
  1: ['panNumber', 'aadhar', 'businessName', 'businessPan', 'gstin', 'authorizedSignatory', 'bankAccountNumber', 'bankIfsc', 'acceptedTerms'],
  2: ['bankAccountNumber', 'bankIfsc', 'acceptedTerms'],
  3: [],
};

export function useSellerOnboarding(methods: UseFormReturn<SellerOnboardingFormData>) {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = async () => {
    let fieldsToValidate = STEP_VALIDATION[currentStep] || [];

    // Filter dynamic fields based on identity type for KYC step
    if (currentStep === 2) {
      const identityType = methods.watch('identityType');
      if (identityType === SellerIdentityType.INDIVIDUAL) {
        fieldsToValidate = ['panNumber', 'aadhar'];
      } else if (identityType === SellerIdentityType.BUSINESS) {
        fieldsToValidate = ['businessName', 'businessPan', 'gstin', 'authorizedSignatory'];
      }
    }

    const isStepValid = await methods.trigger(fieldsToValidate);

    const toClear = FUTURE_STEP_FIELDS[currentStep] ?? [];
    if (toClear.length > 0) methods.clearErrors(toClear);

    if (isStepValid) {
      setCurrentStep((curr) => Math.min(curr + 1, STEPS_DATA.length - 1));
      requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }
  };

  const prevStep = () => {
    setCurrentStep((curr) => Math.max(curr - 1, 0));
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  };

  return { currentStep, setCurrentStep, nextStep, prevStep };
}
