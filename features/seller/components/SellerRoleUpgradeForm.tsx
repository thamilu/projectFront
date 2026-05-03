"use client";

import React, { useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { sellerOnboardingSchema, SellerOnboardingValues } from '../schemas';
import { SellerIdentityType } from '../types';
import { useAuth } from '@/hooks/use-auth';
import { PersonalInfoStep } from '@/features/seller/components/steps/PersonalInfoStep';
import { PermanentAddressStep } from '@/features/seller/components/steps/PermanentAddressStep';
import { IdentityStep } from '@/features/seller/components/steps/IdentityStep';
import { VerificationStep } from '@/features/seller/components/steps/VerificationStep';
import { StoreStep } from '@/features/seller/components/steps/StoreStep';
import { TermsStep } from '@/features/seller/components/steps/TermsStep';
import { Stepper } from '@/components/ui/stepper';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/axios';
import { API_ENDPOINTS } from '@/constants/api/endpoints';

const STEPS = [
  { title: 'Personal', description: 'Contact details' },
  { title: 'Address', description: 'Residential info' },
  { title: 'Identity', description: 'Business type' },
  { title: 'Legal', description: 'KYC Verification' },
  { title: 'Store', description: 'Shop setup' },
  { title: 'Terms', description: 'Agreement' },
];

export function SellerRoleUpgradeForm({ 
  initialStatus, 
  onSuccess 
}: { 
  initialStatus?: string;
  onSuccess?: () => void;
}) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = React.useState(0);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [status, setStatus] = React.useState(initialStatus || 'IDLE');

  const methods = useForm<SellerOnboardingValues>({
    resolver: zodResolver(sellerOnboardingSchema) as any,
    mode: 'onBlur',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      gender: '',
      dateOfBirth: '',
      preferredLanguage: '',
      alternatePhone: '',
      panNumber: '',
      aadhaarNumber: '',
      gstin: '',
      businessPan: '',
      identityType: SellerIdentityType.INDIVIDUAL,
      businessTypes: [],
      shopName: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      district: '',
      state: '',
      pincode: '',
      country: 'India',
      storeAddressLine1: '',
      storeAddressLine2: '',
      storeCity: '',
      storeDistrict: '',
      storeState: '',
      storePincode: '',
      storeCountry: 'India',
      phone: '',
      businessPhone: '',
      description: '',
      acceptedTerms: false,
    },
  });

  const { formState: { errors }, trigger, getValues, reset } = methods;

  // Log form errors for debugging
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.warn('Seller Registration Validation Errors:', errors);
    }
  }, [errors]);

  // Pre-populate Step 1 (Personal Address) from user profile
  useEffect(() => {
    async function prefillData() {
      try {
        const response = await apiClient.get(API_ENDPOINTS.USERS.PROFILE);
        const data = response.data.data;
        
        if (data) {
          console.log('Prefilling seller data from profile:', data);
          reset({
            ...getValues(),
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            email: data.email || user?.email || '',
            phone: data.phone || data.personalMobileNumber || (user as any)?.phone || '',
            gender: data.gender || '',
            dateOfBirth: data.dateOfBirth || '',
            preferredLanguage: data.preferredLanguage || '',
            alternatePhone: data.alternatePhone || '',
            addressLine1: data.addressLine1 || '',
            addressLine2: data.addressLine2 || '',
            city: data.city || '',
            district: data.district || '',
            state: data.state || '',
            pincode: data.pincode || '',
            country: data.country || 'India',
          });
        }
      } catch (error) {
        console.error('Failed to prefill seller registration data', error);
      }
    }
    
    if (user && status === 'IDLE') {
      prefillData();
    }
  }, [user, reset, getValues, status]);

  const onSubmit = async (data: SellerOnboardingValues) => {
    console.log('Attempting final submission with data:', data);
    setIsSubmitting(true);
    try {
      await apiClient.post(API_ENDPOINTS.SELLERS.REGISTER, data);
      toast.success('Registration successful! Redirecting...');
      setStatus('PENDING');
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('Seller registration API error:', error);
      toast.error(error.response?.data?.message || 'Registration failed. Please check your data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const next = async () => {
    const fields = getFieldsForStep(currentStep);
    const isValid = await trigger(fields as any);
    
    if (isValid) {
      if (currentStep < STEPS.length - 1) {
        setCurrentStep((s) => s + 1);
      } else {
        // Final submission - trigger WHOLE form validation to catch hidden errors
        const isFormValid = await trigger();
        if (isFormValid) {
          await onSubmit(getValues());
        } else {
          console.error('Whole Form Validation Failed. Errors:', methods.formState.errors);
          toast.error('Please check all steps for missing or incorrect information.');
        }
      }
    } else {
      console.warn(`Step ${currentStep} validation failed. Errors:`, methods.formState.errors);
      toast.error('Please fix the errors in this step before proceeding.');
    }
  };

  const prev = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  if (status === 'PENDING') {
    return (
      <div className="p-12 text-center space-y-4 border-2 border-primary/20 bg-primary/5 rounded-2xl">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
          <CheckCircle2 className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Registration Submitted</h2>
        <p className="text-muted-foreground">
          We are reviewing your application. You will be notified once your seller account is activated.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 animate-in fade-in duration-700">
      <div className="relative group">
        <div className="absolute -inset-1 bg-linear-to-r from-primary/30 to-primary/10 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition duration-1000"></div>
        <div className="relative space-y-8 bg-background/80 backdrop-blur-xl p-8 sm:p-10 rounded-3xl border shadow-2xl overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-linear-to-r from-primary to-primary/20" />
          
          <Stepper steps={STEPS} currentStep={currentStep} />
          
          <FormProvider {...methods}>
            <form className="space-y-10 min-h-[400px] flex flex-col">
              <div className="flex-1">
                {currentStep === 0 && <PersonalInfoStep />}
                {currentStep === 1 && <PermanentAddressStep />}
                {currentStep === 2 && <IdentityStep />}
                {currentStep === 3 && <VerificationStep />}
                {currentStep === 4 && <StoreStep />}
                {currentStep === 5 && <TermsStep />}
              </div>

              <div className="flex justify-between items-center pt-8 border-t border-primary/10">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={prev}
                  disabled={currentStep === 0 || isSubmitting}
                  className="px-8 h-12 rounded-xl hover:bg-primary/5 hover:text-primary transition-all font-bold uppercase tracking-widest text-[10px]"
                >
                  Back
                </Button>
                <Button 
                  type="button" 
                  onClick={() => {
                    next().catch(err => {
                      console.error('Next Button Critical Error:', err);
                      toast.error('An unexpected error occurred during submission.');
                    });
                  }} 
                  disabled={isSubmitting}
                  className="px-10 h-12 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all font-bold uppercase tracking-widest text-[10px]"
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : currentStep === STEPS.length - 1 ? (
                    'Finalize Registration'
                  ) : (
                    'Next Step'
                  )}
                </Button>
              </div>
            </form>
          </FormProvider>
        </div>
      </div>
    </div>
  );
}

function getFieldsForStep(step: number): string[] {
  switch (step) {
    case 0:
      return ['phone'];
    case 1:
      return ['addressLine1', 'city', 'district', 'state', 'pincode'];
    case 2:
      return ['identityType', 'businessTypes'];
    case 3:
      return ['panNumber', 'aadhaarNumber', 'gstin', 'businessPan'];
    case 4:
      return ['shopName', 'storeAddressLine1', 'storeCity', 'storeDistrict', 'storeState', 'storePincode'];
    case 5:
      return ['acceptedTerms'];
    default:
      return [];
  }
}
