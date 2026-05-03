'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { motion } from 'framer-motion';
import { User, Phone, MapPin } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AddressFields } from '@/components/shared/AddressFields';
import { SellerOnboardingValues } from '../../schemas';

export function ProfileStep() {
  const { register, getValues, formState: { errors } } = useFormContext<SellerOnboardingValues>();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="text-left space-y-1">
        <h2 className="text-xl font-bold tracking-tight bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Personal Information
        </h2>
        <p className="text-sm text-muted-foreground">
          Confirm your contact details and permanent residence.
        </p>
      </div>

      <div className="grid gap-4 p-4 rounded-xl border bg-muted/30 backdrop-blur-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <User className="h-3 w-3" /> First Name
            </Label>
            <Input 
              value={(getValues() as any).firstName || ''} 
              readOnly 
              className="h-10 bg-background/50 border-none shadow-inner"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <User className="h-3 w-3" /> Last Name
            </Label>
            <Input 
              value={(getValues() as any).lastName || ''} 
              readOnly 
              className="h-10 bg-background/50 border-none shadow-inner"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <MapPin className="h-3 w-3" /> Email Address
            </Label>
            <Input 
              value={(getValues() as any).email || ''} 
              readOnly 
              className="h-10 bg-background/50 border-none shadow-inner"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
              <Phone className="h-3 w-3 text-primary" /> Phone Number
            </Label>
            <Input 
              id="phone" 
              {...register('phone')} 
              placeholder="+91 98765 43210"
              className={`h-10 bg-background/50 transition-all focus:ring-2 focus:ring-primary/20 ${errors.phone ? 'border-destructive ring-destructive/20' : ''}`}
            />
            {errors.phone && <p className="text-[10px] text-destructive font-medium uppercase tracking-tight">{errors.phone.message}</p>}
          </div>
        </div>
      </div>

      <div className="pt-2">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Permanent Address</span>
          <div className="h-px flex-1 bg-border" />
        </div>
        <AddressFields 
          showTitle={false}
          description=""
        />
      </div>
    </motion.div>
  );
}
