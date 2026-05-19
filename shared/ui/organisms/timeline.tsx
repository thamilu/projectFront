'use client';

import { cn } from '@/shared/utils';
import { Check, Dot } from 'lucide-react';

export interface TimelineStep {
  id: string;
  title: string;
  description?: string;
  date?: string;
  status: 'completed' | 'current' | 'upcoming';
}

interface TimelineProps {
  steps: TimelineStep[];
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export function Timeline({ steps, className, orientation = 'vertical' }: TimelineProps) {
  const isHorizontal = orientation === 'horizontal';

  return (
    <div
      className={cn(
        "flex",
        isHorizontal ? "flex-row items-center w-full justify-between gap-4" : "flex-col",
        className
      )}
      role="progressbar"
      aria-label="Progress Tracker"
    >
      {steps.map((step, idx) => {
        const isLast = idx === steps.length - 1;
        const isCompleted = step.status === 'completed';
        const isCurrent = step.status === 'current';

        return (
          <div
            key={step.id}
            className={cn(
              "relative flex",
              isHorizontal ? "flex-1 flex-col items-center text-center" : "flex-row items-start pb-8 last:pb-0"
            )}
          >
            {/* Line connector */}
            {!isLast && (
              <div
                className={cn(
                  "absolute bg-border transition-all duration-500 ease-out",
                  isHorizontal
                    ? "top-4 left-[50%] right-[-50%] h-[2px]"
                    : "left-4 top-8 bottom-0 w-[2px]",
                  isCompleted ? "bg-primary" : "bg-muted"
                )}
                aria-hidden="true"
              />
            )}

            {/* Icon/Indicator wrapper */}
            <div className={cn("flex items-center", isHorizontal ? "mb-3" : "mr-4")}>
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-300",
                  isCompleted
                    ? "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                    : isCurrent
                    ? "border-primary bg-background text-primary ring-4 ring-primary/10 scale-110"
                    : "border-muted bg-card text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4 stroke-[3] animate-in zoom-in duration-300" />
                ) : isCurrent ? (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                ) : (
                  <Dot className="h-4 w-4" />
                )}
              </div>
            </div>

            {/* Text description */}
            <div className={cn("flex flex-col text-left", isHorizontal ? "items-center text-center px-2" : "mt-0.5")}>
              <h4
                className={cn(
                  "text-sm font-semibold transition-all duration-200",
                  isCurrent ? "text-primary" : "text-foreground"
                )}
              >
                {step.title}
              </h4>
              {step.description && (
                <p className="text-xs text-muted-foreground mt-0.5 max-w-[200px]">{step.description}</p>
              )}
              {step.date && (
                <span className="text-[10px] font-medium text-muted-foreground/60 mt-1 uppercase tracking-wider">
                  {step.date}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
