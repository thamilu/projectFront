'use client';

import { useMemo } from 'react';
import { STEPS } from '@/features/seller/constants/seller-form-steps';
import { STEP_ESTIMATES } from '@/features/seller/constants/onboarding-assistant-config';

/**
 * Custom hook to calculate onboarding progress details.
 * Encapsulates derived statistics calculations for percentComplete and timeLeft.
 * 
 * @param safeStep - The clamped, zero-indexed current active step number.
 * @returns An object containing percentComplete and timeLeft.
 */
export function useOnboardingProgress(safeStep: number): {
  percentComplete: number;
  timeLeft: number;
} {
  return useMemo(() => {
    if (!STEPS || STEPS.length === 0) {
      return { percentComplete: 0, timeLeft: 0 };
    }
    
    // Correct off-by-one progress calculation
    const percent = Math.min(100, Math.round(((safeStep + 1) / STEPS.length) * 100));

    // Sum estimated minutes for remaining steps
    const remainingSteps = STEPS.slice(safeStep);
    const time = remainingSteps.reduce((sum, step) => {
      const estimate = STEP_ESTIMATES[step.id] ?? 2;
      return sum + estimate;
    }, 0);

    return {
      percentComplete: percent,
      timeLeft: time,
    };
  }, [safeStep]);
}
