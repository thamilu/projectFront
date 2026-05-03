"use client";

import React, { useState } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { User, Mail, Phone, Calendar, Globe, Edit2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { SellerOnboardingValues } from '../../schemas';

import { StepLayout } from '../shared/StepLayout';
import { StepInput } from '../shared/StepInput';
import { ModernDatePicker } from '@/components/shared/ModernDatePicker';

export function PersonalInfoStep() {
  const { register, control, formState: { errors } } = useFormContext<SellerOnboardingValues>();
  const [isEditing, setIsEditing] = useState(false);

  return (
    <StepLayout
      title="Personal Information"
      description="Manage your core profile identity and contact details."
    >
      <div className="space-y-6">
        <div className="flex justify-end mb-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            className={`h-8 px-3 text-[10px] font-bold uppercase tracking-widest transition-all ${
              isEditing ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'text-muted-foreground hover:text-primary'
            }`}
          >
            {isEditing ? (
              <><Lock className="mr-2 h-3 w-3" /> Lock & Save</>
            ) : (
              <><Edit2 className="mr-2 h-3 w-3" /> Edit Details</>
            )}
          </Button>
        </div>

        <div className="grid gap-6">
          {/* Name Group */}
          <div className="grid gap-6 md:grid-cols-2">
            <StepInput
              id="firstName"
              label="First Name"
              icon={User}
              {...register('firstName')}
              readOnly={!isEditing}
              className={`${!isEditing ? 'bg-muted/30 border-none shadow-inner cursor-not-allowed' : 'bg-background/50'}`}
            />
            <StepInput
              id="lastName"
              label="Last Name"
              icon={User}
              {...register('lastName')}
              readOnly={!isEditing}
              className={`${!isEditing ? 'bg-muted/30 border-none shadow-inner cursor-not-allowed' : 'bg-background/50'}`}
            />
          </div>

          {/* Contact Group */}
          <div className="grid gap-6 md:grid-cols-2">
            <StepInput
              id="email"
              label="Email Address"
              icon={Mail}
              {...register('email')}
              readOnly
              className="bg-muted/30 border-none shadow-inner cursor-not-allowed"
            />
            <StepInput
              id="phone"
              label="Phone Number"
              icon={Phone}
              placeholder="+91 98765 43210"
              {...register('phone')}
              readOnly={!isEditing}
              error={errors.phone?.message}
              className={`${!isEditing ? 'bg-muted/30 border-none shadow-inner cursor-not-allowed' : 'bg-background/50'}`}
            />
          </div>

          {/* Demographic Group */}
          <div className="grid gap-6 md:grid-cols-2">
            <StepInput
              id="gender"
              label="Gender"
              icon={User}
              {...register('gender')}
              readOnly={!isEditing}
              className={`${!isEditing ? 'bg-muted/30 border-none shadow-inner cursor-not-allowed' : 'bg-background/50'}`}
            />
            
            <div className="space-y-1.5 w-full">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
                Date of Birth
              </Label>
              <Controller
                name="dateOfBirth"
                control={control}
                render={({ field }) => (
                  <ModernDatePicker
                    value={field.value}
                    onChange={field.onChange}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-muted/30 border-none shadow-inner cursor-not-allowed' : ''}
                  />
                )}
              />
              {errors.dateOfBirth && (
                <p className="text-[10px] text-destructive font-semibold uppercase tracking-tighter ml-1">
                  {errors.dateOfBirth.message}
                </p>
              )}
            </div>
          </div>

          {/* Preferences Group */}
          <div className="grid gap-6 md:grid-cols-2">
            <StepInput
              id="alternatePhone"
              label="Alternate Phone"
              icon={Phone}
              {...register('alternatePhone')}
              readOnly={!isEditing}
              className={`${!isEditing ? 'bg-muted/30 border-none shadow-inner cursor-not-allowed' : 'bg-background/50'}`}
            />
            <StepInput
              id="preferredLanguage"
              label="Preferred Language"
              icon={Globe}
              {...register('preferredLanguage')}
              readOnly={!isEditing}
              className={`${!isEditing ? 'bg-muted/30 border-none shadow-inner cursor-not-allowed' : 'bg-background/50'}`}
            />
          </div>
        </div>
      </div>
    </StepLayout>
  );
}
