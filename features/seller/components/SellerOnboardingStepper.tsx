import { CheckCircle2 } from 'lucide-react';
import { STEPS_DATA } from '../hooks/useSellerOnboarding';

interface SellerOnboardingStepperProps {
  currentStep: number;
}

export function SellerOnboardingStepper({ currentStep }: SellerOnboardingStepperProps) {
  return (
    <div className="relative mb-8">
      <div className="bg-muted absolute top-1/2 left-0 -z-10 h-0.5 w-full -translate-y-1/2 rounded"></div>
      <div
        className="bg-primary absolute top-1/2 left-0 -z-10 h-0.5 -translate-y-1/2 rounded transition-all duration-500 ease-in-out"
        // Progress ends at 100% on step index 3 out of 4 total steps (3+1) / 4 * 100 = 100
        style={{ width: `${((currentStep + 1) / STEPS_DATA.length) * 100}%` }}
      ></div>
      <div className="flex justify-between">
        {STEPS_DATA.map((step, index) => (
          <div key={step.id} className="flex flex-col items-center">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold shadow-sm transition-colors duration-300 ${
                index < currentStep
                  ? 'bg-primary text-primary-foreground'
                  : index === currentStep
                    ? 'bg-primary text-primary-foreground ring-primary/20 ring-4'
                    : 'bg-background border-muted text-muted-foreground border-2'
              }`}
            >
              {index < currentStep ? <CheckCircle2 className="h-5 w-5" /> : index + 1}
            </div>
            <span
              className={`mt-2 hidden text-xs font-medium sm:block md:text-sm ${
                index <= currentStep ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              {step.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
