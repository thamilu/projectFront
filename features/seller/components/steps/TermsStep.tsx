"use client";

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { motion } from 'framer-motion';
import { CheckCircle2, ShieldAlert, FileText } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { SellerOnboardingValues } from '../../schemas';
import { StepLayout } from '../shared/StepLayout';

export function TermsStep() {
  const { watch, setValue, formState: { errors } } = useFormContext<SellerOnboardingValues>();
  const accepted = watch('acceptedTerms');

  return (
    <StepLayout
      title="Final Agreement"
      description="Review our seller terms and conditions to complete your registration."
      containerClassName="bg-transparent border-none p-0"
    >
      <div className="space-y-8">
        <div className="rounded-xl border bg-muted/30 p-6 space-y-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-sm">Seller Agreement</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                By becoming a seller on eShop, you agree to our platform fees, shipping policies, 
                and merchant code of conduct.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-600">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-sm text-orange-700 dark:text-orange-400">Important Note</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Approval typically takes 24-48 hours. Our team will review your details before activating your account.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-start space-x-3 p-5 rounded-xl border transition-all cursor-pointer hover:bg-muted/10 group bg-background/40">
          <Checkbox 
            id="acceptedTerms" 
            checked={accepted}
            onCheckedChange={(checked) => setValue('acceptedTerms', checked as boolean, { shouldValidate: true })}
            className="mt-0.5"
          />
          <div className="grid gap-1.5 leading-none">
            <Label
              htmlFor="acceptedTerms"
              className="text-sm font-bold leading-tight cursor-pointer group-hover:text-primary transition-colors"
            >
              I accept the eShop Seller Terms and Conditions
            </Label>
            <p className="text-xs text-muted-foreground leading-normal">
              I confirm that all provided information is accurate and I am authorized to act on behalf of this business.
            </p>
            {errors.acceptedTerms && (
              <p className="text-[10px] text-destructive mt-1 font-bold uppercase tracking-wider">{errors.acceptedTerms.message}</p>
            )}
          </div>
        </div>

        {accepted && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-tight">Ready to submit! Everything looks good.</span>
          </motion.div>
        )}
      </div>
    </StepLayout>
  );
}
