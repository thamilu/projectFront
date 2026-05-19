'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/shared/utils';

interface Step {
  title: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

/**
 * Premium Stepper Component
 * 
 * A responsive, animated progress indicator for multi-step flows.
 * Uses Framer Motion for smooth transitions if available, otherwise fallback to CSS.
 */
export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <nav aria-label="Progress" className={cn("w-full", className)}>
      <ol role="list" className="flex items-center justify-between w-full space-x-4">
        {steps.map((step, index) => {
          const isCompleted = currentStep > index;
          const isActive = currentStep === index;
          const isPending = currentStep < index;

          return (
            <li key={step.title} className="relative flex-1">
              <div className="flex flex-col items-center group">
                {/* Connector Line */}
                {index !== 0 && (
                  <div 
                    className={cn(
                      "absolute top-5 -left-[50%] right-[50%] h-0.5 transition-colors duration-300",
                      isCompleted || isActive ? "bg-primary" : "bg-muted"
                    )} 
                    aria-hidden="true" 
                  />
                )}

                {/* Step Icon */}
                <div 
                  className={cn(
                    "relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 z-10",
                    isCompleted 
                      ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20" 
                      : isActive 
                        ? "border-primary bg-background text-primary ring-4 ring-primary/10" 
                        : "border-muted bg-background text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-6 w-6" strokeWidth={3} />
                  ) : (
                    <span className="text-sm font-bold">{index + 1}</span>
                  )}
                </div>

                {/* Step Labels */}
                <div className="mt-3 text-center hidden md:block">
                  <p 
                    className={cn(
                      "text-xs font-bold uppercase tracking-wider transition-colors duration-300",
                      isActive ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {step.title}
                  </p>
                  {step.description && (
                    <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
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
