'use client';

import { useState } from 'react';
import type { UseFormReturn, Path } from 'react-hook-form';
import type { SellerOnboardingValues } from '@/domains/seller/contracts/seller.schema';
import { getFieldsForStep, findFirstErrorStep } from '../utils/seller-field-map';
import { toast } from 'sonner';
import { logger } from '@/core/telemetry/logger';

interface UseSellerStepValidationProps {
  methods: UseFormReturn<SellerOnboardingValues>;
  onSubmit: (data: SellerOnboardingValues) => Promise<void>;
  stepsCount: number;
}

export function useSellerStepValidation({
  methods,
  onSubmit,
  stepsCount,
}: UseSellerStepValidationProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const next = async () => {
    const fields = getFieldsForStep(currentStep);
    const isStepValid = await methods.trigger(fields as Path<SellerOnboardingValues>[]);

    if (!isStepValid) {
      const { errors } = methods.formState;
      logger.warn(`Step ${currentStep} validation failed`, { errors });
      toast.error('Please fix the errors in this step before proceeding.');

      // Focus the first invalid element in the current step
      const firstInvalidField = fields.find((field) => field in errors);
      if (firstInvalidField) {
        setTimeout(() => {
          const element = document.querySelector(`[name="${firstInvalidField}"]`) as HTMLElement;
          if (element) {
            element.focus();
          }
        }, 50);
      }
      return;
    }

    if (currentStep < stepsCount - 1) {
      setCurrentStep((s) => s + 1);
      return;
    }

    // Final step check
    const isFormValid = await methods.trigger();
    if (!isFormValid) {
      const { errors } = methods.formState;
      const firstErrorStep = findFirstErrorStep(errors);
      if (firstErrorStep !== -1) {
        setCurrentStep(firstErrorStep);
        toast.error(`Please review Step ${firstErrorStep + 1} for errors.`);

        // Focus the first invalid element in the validation failed step
        setTimeout(() => {
          const firstErrorFields = getFieldsForStep(firstErrorStep);
          const firstInvalidField = firstErrorFields.find((field) => field in errors);
          if (firstInvalidField) {
            const element = document.querySelector(`[name="${firstInvalidField}"]`) as HTMLElement;
            if (element) {
              element.focus();
            }
          }
        }, 100);
      } else {
        toast.error('Please check all steps for missing or incorrect information.');
      }
      return;
    }

    await onSubmit(methods.getValues());
  };

  const prev = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  };

  return {
    currentStep,
    setCurrentStep,
    next,
    prev,
  };
}
