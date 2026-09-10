'use client';

import { cn } from '@/shared/utils';
import { Check } from 'lucide-react';

interface Step {
  title: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  className?: string;
  onStepClick?: (stepIndex: number) => void;
}

/**
 * Premium Stepper Component
 *
 * A responsive, animated progress indicator for multi-step flows.
 * Uses Framer Motion for smooth transitions if available, otherwise fallback to CSS.
 */
export function Stepper({ steps, currentStep, className, onStepClick }: StepperProps) {
  return (
    <nav aria-label="Progress" className={cn('w-full', className)}>
      {/* Mobile-Only Progress Stepper (< 768px) */}
      <div className="flex flex-col space-y-2 md:hidden px-6" aria-live="polite">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-medium">
            Step <span className="text-foreground font-bold">{currentStep + 1}</span> of {steps.length}
          </span>
          <span className="text-primary font-bold tracking-tight">
            {steps[currentStep]?.title}
          </span>
        </div>
        <div className="bg-slate-200 dark:bg-slate-800 h-2 w-full overflow-hidden rounded-full border border-slate-300/30 dark:border-slate-700/30">
          <div
            className="bg-primary h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
        {steps[currentStep]?.description && (
          <p className="text-[10px] text-muted-foreground font-medium italic mt-0.5">
            Next: {steps[currentStep]?.description}
          </p>
        )}
      </div>

      {/* Desktop-Only Full Stepper (>= 768px) */}
      <ol role="list" className="hidden md:flex w-full items-center justify-between px-8">
        {steps.map((step, index) => {
          const isCompleted = currentStep > index;
          const isActive = currentStep === index;
          const isClickable = isCompleted && !!onStepClick;

          return (
            <li
              key={step.title}
              className="relative flex-1"
              aria-current={isActive ? 'step' : undefined}
            >
              <div className="group flex flex-col items-center">
                {/* Connector Line (drawn from previous step to current) */}
                {index !== 0 && (
                  <div
                    className={cn(
                      'absolute top-5 right-[50%] -left-[50%] h-[3px] transition-colors duration-500 ease-in-out',
                      isCompleted ? 'bg-emerald-500 dark:bg-emerald-600' : isActive ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-800'
                    )}
                    aria-hidden="true"
                  />
                )}

                {/* Step Circle Indicator */}
                {isClickable ? (
                  <button
                    type="button"
                    onClick={() => onStepClick?.(index)}
                    className={cn(
                      'relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ease-in-out font-mono text-sm font-bold shadow-sm',
                      'bg-emerald-500 border-emerald-500 text-white shadow-emerald-500/20 hover:bg-emerald-600 hover:border-emerald-600 hover:scale-110 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 dark:focus:ring-offset-slate-900'
                    )}
                    title={`Go back to step ${index + 1}: ${step.title}`}
                    aria-label={`Go back to step ${index + 1}: ${step.title}`}
                  >
                    <Check className="h-5 w-5 stroke-[3px]" />
                    <span className="sr-only">Go back to step {index + 1}</span>
                  </button>
                ) : (
                  <div
                    className={cn(
                      'relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ease-in-out font-mono text-sm font-bold shadow-sm',
                      isActive
                        ? 'border-primary bg-background text-primary ring-primary/20 ring-4 scale-110 shadow-md'
                        : 'border-slate-300 dark:border-slate-700 bg-background text-muted-foreground'
                    )}
                  >
                    <span>{index + 1}</span>
                    <span className="sr-only">
                      {isActive ? 'Current Step' : 'Upcoming Step'}
                    </span>
                  </div>
                )}

                {/* Step Label */}
                <div className="mt-3 text-center">
                  <p
                    className={cn(
                      'text-xs font-bold tracking-wider uppercase transition-colors duration-300',
                      isActive
                        ? 'text-primary scale-105 font-extrabold'
                        : isCompleted
                          ? 'text-slate-800 dark:text-slate-200'
                          : 'text-muted-foreground/60'
                    )}
                  >
                    {step.title}
                  </p>
                  {step.description && (
                    <p
                      className={cn(
                        'mt-0.5 line-clamp-1 text-[10px] transition-colors duration-300 font-medium',
                        isActive
                          ? 'text-primary/80 font-semibold'
                          : 'text-muted-foreground/45'
                      )}
                    >
                      {step.description}
                    </p>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
