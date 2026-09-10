import React from 'react';
import { Stepper } from '@/shared/ui/atoms/stepper';
import { STEPS } from '../constants/seller-form-steps';

interface SellerFormStepperProps {
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
}

export function SellerFormStepper({ currentStep, onStepClick }: SellerFormStepperProps): React.JSX.Element {
  return (
    <Stepper
      steps={STEPS as unknown as { title: string; description?: string }[]}
      currentStep={currentStep}
      onStepClick={onStepClick}
    />
  );
}
export default SellerFormStepper;
