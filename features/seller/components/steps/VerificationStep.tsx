"use client";

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { ShieldCheck, FileText, CreditCard, Landmark, User } from 'lucide-react';
import { SellerIdentityType } from '@/types';
import { SellerOnboardingValues } from '@/schemas/seller.schema';
import { StepLayout } from '@/shared/components/StepLayout';
import { StepInput } from '@/shared/components/StepInput';
import { motion } from 'framer-motion';

export function VerificationStep() {
  const { register, watch, formState: { errors } } = useFormContext<SellerOnboardingValues>();
  const identityType = watch('identityType');
  const isBusiness = identityType === SellerIdentityType.BUSINESS;

  return (
    <StepLayout
      title="Legal Verification"
      description="Provide your tax and identity details for regulatory compliance."
    >
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="grid gap-8">
          {/* PAN Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-primary">
              <FileText className="h-5 w-5" />
              <h3 className="text-sm font-bold uppercase tracking-widest">Tax Information</h3>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              <StepInput
                id="panNumber"
                label={isBusiness ? "Personal PAN (Representative)" : "Permanent Account Number (PAN)"}
                icon={CreditCard}
                placeholder="ABCDE1234F"
                {...register('panNumber')}
                error={errors.panNumber?.message}
                maxLength={10}
                className="uppercase"
              />
              
              {isBusiness && (
                <StepInput
                  id="businessPan"
                  label="Business PAN"
                  icon={Landmark}
                  placeholder="FGHIJ5678K"
                  {...register('businessPan')}
                  error={errors.businessPan?.message}
                  maxLength={10}
                  className="uppercase"
                />
              )}
            </div>
          </div>

          {/* GST & Aadhaar Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-primary">
              <ShieldCheck className="h-5 w-5" />
              <h3 className="text-sm font-bold uppercase tracking-widest">Identity & GST</h3>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              <StepInput
                id="aadhar"
                label="Aadhaar Number (12 Digits)"
                icon={User}
                placeholder="1234 5678 9012"
                {...register('aadhar')}
                error={errors.aadhar?.message}
                maxLength={12}
              />
              
              {isBusiness && (
                <StepInput
                  id="gstin"
                  label="GSTIN (Optional)"
                  icon={FileText}
                  placeholder="22AAAAA0000A1Z5"
                  {...register('gstin')}
                  error={errors.gstin?.message}
                  maxLength={15}
                  className="uppercase"
                />
              )}
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex gap-4 items-start">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-primary uppercase tracking-tighter">Secure Verification</p>
            <p className="text-[11px] text-muted-foreground leading-tight mt-1">
              Your sensitive data is encrypted and stored securely. We only use this information for government compliance and seller verification purposes.
            </p>
          </div>
        </div>
      </motion.div>
    </StepLayout>
  );
}
