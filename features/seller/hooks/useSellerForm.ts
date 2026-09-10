'use client';

import { useState, useEffect } from 'react';
import { useForm, Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  sellerOnboardingSchema,
  SellerOnboardingValues,
} from '@/domains/seller/contracts/seller.schema';
import { SellerIdentityType } from '@/domains/seller/contracts/seller.types';
import { useAuth } from '@/domains/auth/hooks/use-auth';
import { STEPS, SELLER_FORM_DEFAULTS } from '../constants/seller-form-steps';
import { useSellerPrefill } from './useSellerPrefill';
import { useSellerSubmit } from './useSellerSubmit';
import { useSellerStepValidation } from './useSellerStepValidation';
import { useSellerSessionSync } from './useSellerSessionSync';
import { logger } from '@/core/telemetry/logger';
import { sellerApi } from '@/features/seller/api/seller-api';

export interface UseSellerFormOptions {
  initialStatus?: string;
  onSuccess?: () => void;
}

/** Exported so callers (e.g. SellerRoleUpgradeForm's "Start Fresh" handler) can reset to a truly blank form without duplicating this literal. */
export const DEFAULT_SELLER_FORM_VALUES: Partial<SellerOnboardingValues> = {
  firstName: '',
  lastName: '',
  email: '',
  gender: '',
  dateOfBirth: '',
  preferredLanguage: '',
  alternatePhone: '',
  panNumber: '',
  aadhar: '',
  gstin: '',
  businessPan: '',
  identityType: SellerIdentityType.INDIVIDUAL,
  businessTypes: [],
  shopName: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  district: '',
  taluk: '',
  state: '',
  pincode: '',
  country: SELLER_FORM_DEFAULTS.DEFAULT_COUNTRY,
  storeAddressLine1: '',
  storeAddressLine2: '',
  storeCity: '',
  storeDistrict: '',
  storeTaluk: '',
  storeState: '',
  storePincode: '',
  storeCountry: SELLER_FORM_DEFAULTS.DEFAULT_COUNTRY,
  phone: '',
  businessPhone: '',
  description: '',
  shopHandle: '',
  shopLogoUrl: '',
  acceptedTerms: false,
};

export function useSellerForm({ initialStatus, onSuccess }: UseSellerFormOptions = {}) {
  const { user, isSeller, refreshSession } = useAuth();
  const [status, setStatus] = useState(initialStatus || 'IDLE');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [referenceId, setReferenceId] = useState<string | null>(null);

  // Fetch referenceId from profile if status is PENDING initially
  useEffect(() => {
    if (status === 'PENDING') {
      let active = true;
      sellerApi.getMyProfile()
        .then((profile) => {
          if (active && profile?.id) {
            setReferenceId(`SEL-${profile.id}`);
          }
        })
        .catch((err) => {
          logger.warn('[useSellerForm] Failed to fetch profile ID for pending status', { error: err });
        });
      return () => {
        active = false;
      };
    }
  }, [status]);

  const methods = useForm<SellerOnboardingValues>({
    resolver: zodResolver(sellerOnboardingSchema) as Resolver<SellerOnboardingValues>,
    mode: 'onBlur',
    shouldUnregister: false,
    defaultValues: DEFAULT_SELLER_FORM_VALUES,
  });

  // Prefill Logic
  useSellerPrefill({
    user,
    methods,
    isActive: status === 'IDLE',
  });

  // Submission Logic
  const { isSubmitting, onSubmit } = useSellerSubmit({
    methods,
    setStatus,
    setErrorMessage,
    onSuccess,
    setReferenceId,
  });

  // Step Navigation & Validation
  const { currentStep, setCurrentStep, next, prev } = useSellerStepValidation({
    methods,
    onSubmit,
    stepsCount: STEPS.length,
  });

  // Session Synchronization
  const { isSyncing, handleForceSync } = useSellerSessionSync({
    status,
    isSeller,
    refreshSession,
  });

  // Log form errors for debugging (safe context)
  useEffect(() => {
    if (Object.keys(methods.formState.errors).length > 0) {
      logger.warn('Seller Registration Validation Errors');
    }
  }, [methods.formState.errors]);

  const handleRetry = () => {
    setStatus('IDLE');
    setErrorMessage(null);
    methods.reset(undefined, { keepDefaultValues: true });
  };

  return {
    methods,
    status,
    setStatus,
    currentStep,
    setCurrentStep,
    isSubmitting,
    isSyncing,
    next,
    prev,
    handleForceSync,
    handleRetry,
    user,
    isSeller,
    errorMessage,
    referenceId,
  };
}
export default useSellerForm;
