'use client';

import { create } from 'zustand';

interface OnboardingState {
  currentStep: number;
  totalSteps: number;
  stepTitle: string;
  isFormDirty: boolean;
  isSaving: boolean;
  confirmExitOpen: boolean;
  showHelpModal: boolean;
  saveDraftCallback: (() => Promise<void>) | null;
  setCurrentStep: (step: number) => void;
  setTotalSteps: (total: number) => void;
  setStepTitle: (title: string) => void;
  setIsFormDirty: (dirty: boolean) => void;
  setIsSaving: (saving: boolean) => void;
  setConfirmExitOpen: (open: boolean) => void;
  setShowHelpModal: (show: boolean) => void;
  setSaveDraftCallback: (cb: (() => Promise<void>) | null) => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  currentStep: 0,
  totalSteps: 6,
  stepTitle: '',
  isFormDirty: false,
  isSaving: false,
  confirmExitOpen: false,
  showHelpModal: false,
  saveDraftCallback: null,
  setCurrentStep: (step) => set({ currentStep: step }),
  setTotalSteps: (total) => set({ totalSteps: total }),
  setStepTitle: (title) => set({ stepTitle: title }),
  setIsFormDirty: (dirty) => set({ isFormDirty: dirty }),
  setIsSaving: (saving) => set({ isSaving: saving }),
  setConfirmExitOpen: (open) => set({ confirmExitOpen: open }),
  setShowHelpModal: (show) => set({ showHelpModal: show }),
  setSaveDraftCallback: (cb) => set({ saveDraftCallback: cb }),
}));
