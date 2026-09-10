import React from 'react';
import { UserCheck, ShieldCheck, Rocket } from 'lucide-react';

export interface HowItWorksStep {
  number: number;
  icon: React.ComponentType<{ className?: string }>;
  titleKey: string;
  descKey: string;
}

export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    number: 1,
    icon: UserCheck,
    titleKey: 'sellerOnboarding.howItWorks.step1.title',
    descKey: 'sellerOnboarding.howItWorks.step1.desc',
  },
  {
    number: 2,
    icon: ShieldCheck,
    titleKey: 'sellerOnboarding.howItWorks.step2.title',
    descKey: 'sellerOnboarding.howItWorks.step2.desc',
  },
  {
    number: 3,
    icon: Rocket,
    titleKey: 'sellerOnboarding.howItWorks.step3.title',
    descKey: 'sellerOnboarding.howItWorks.step3.desc',
  },
];
