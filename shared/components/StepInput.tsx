"use client";

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { LucideIcon } from 'lucide-react';

interface StepInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: LucideIcon;
  error?: string;
  id: string;
}

export const StepInput = React.forwardRef<HTMLInputElement, StepInputProps>(
  ({ label, icon: Icon, error, id, className, ...props }, ref) => {
    return (
      <div className="space-y-1.5 w-full">
        <Label 
          htmlFor={id} 
          className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1"
        >
          {label}
        </Label>
        <div className="relative group">
          {Icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-primary text-muted-foreground">
              <Icon className="h-4 w-4" />
            </div>
          )}
          <Input
            id={id}
            ref={ref}
            className={`h-11 bg-background/50 border-muted-foreground/20 transition-all focus:ring-2 focus:ring-primary/20 ${
              Icon ? 'pl-10' : ''
            } ${
              error ? 'border-destructive ring-destructive/10' : 'focus:border-primary'
            } ${className}`}
            {...props}
          />
        </div>
        {error && (
          <p className="text-[10px] text-destructive font-semibold uppercase tracking-tighter ml-1 animate-in slide-in-from-top-1">
            {error}
          </p>
        )}
      </div>
    );
  }
);

StepInput.displayName = 'StepInput';
