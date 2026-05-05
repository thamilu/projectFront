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
import { KycStep } from '@/features/seller/components/steps/KycStep';
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
    shouldUnregister: false,
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      gender: '',
      dateOfBirth: '',
      preferredLanguage: '',
      alternatePhone: '',
      panNumber: '',
      aadhar: '',
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
      shopHandle: '',
      shopLogoUrl: '',
      acceptedTerms: false,
    },
  });

  // Log form errors for debugging
  useEffect(() => {
    if (Object.keys(methods.formState.errors).length > 0) {
      console.warn('Seller Registration Validation Errors:', methods.formState.errors);
    }
  }, [methods.formState.errors]);

  // Pre-populate Step 1 (Personal Address) from user profile
  useEffect(() => {
    async function prefillData() {
      try {
        const response = await apiClient.get(API_ENDPOINTS.USERS.PROFILE);
        const data = response.data.data;
        
        if (data) {
          console.log('Prefilling seller data from profile:', data);
          const currentValues = methods.getValues();
          methods.reset({
            ...currentValues,
            ...data, // Spread data safely
            firstName: data.firstName || currentValues.firstName || '',
            lastName: data.lastName || currentValues.lastName || '',
            email: data.email || user?.email || currentValues.email || '',
            phone: data.phone || data.personalMobileNumber || (user as any)?.phone || currentValues.phone || '',
          }, { keepDefaultValues: true });
        }
      } catch (error) {
        console.error('Failed to prefill seller registration data', error);
      }
    }
    
    if (user && status === 'IDLE') {
      prefillData();
    }
  }, [user, methods.reset, methods.getValues, status]);

  const onSubmit = async (data: SellerOnboardingValues) => {
    console.log('Attempting final submission with data:', data);
    setIsSubmitting(true);
    try {
      const response = await apiClient.post(API_ENDPOINTS.SELLERS.REGISTER, data);
      console.log('Registration success response:', response.data);
      toast.success('Registration successful! Redirecting...');
      setStatus('PENDING');
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('Seller registration API error details:', error);
      
      const details = error.response?.data?.fieldErrors || error.response?.data?.details;
      if (details && Array.isArray(details) && details.length > 0) {
        // Map backend field errors to react-hook-form
        details.forEach((err: any) => {
          if (err.field) {
            methods.setError(err.field as any, { type: 'server', message: err.message });
          }
        });
        toast.error('Registration failed: Please check the highlighted fields across all steps.');
      } else {
        toast.error(error.response?.data?.message || error.message || 'Registration failed. Please check your data.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const next = async () => {
    const fields = getFieldsForStep(currentStep);
    const isValid = await methods.trigger(fields as any);
    
    if (isValid) {
      if (currentStep < STEPS.length - 1) {
        setCurrentStep((s) => s + 1);
      } else {
        // Final submission - trigger WHOLE form validation to catch hidden errors
        const isFormValid = await methods.trigger();
        if (isFormValid) {
          await onSubmit(methods.getValues());
        } else {
          // Direct Zod validation to catch "ghost" errors
          const currentValues = methods.getValues();
          const result = await sellerOnboardingSchema.safeParseAsync(currentValues);
          
          if (!result.success) {
            const zodErrors = result.error.flatten().fieldErrors;
            console.error('Zod Validation Result:', result.success);
            console.error('Flattened Zod Errors:', zodErrors);
            console.error('Current Form Values:', currentValues);
            
            // Set errors back to form
            Object.entries(zodErrors).forEach(([field, messages]) => {
              if (messages && messages.length > 0) {
                methods.setError(field as any, { type: 'manual', message: messages[0] });
              }
            });
          }

          const { errors: currentErrors } = methods.formState;
          console.error('Whole Form Validation Failed. Errors:', currentErrors);
          toast.error('Please check all steps for missing or incorrect information.');
        }
      }
    } else {
      const { errors: stepErrors } = methods.formState;
      console.warn(`Step ${currentStep} validation failed. Errors:`, stepErrors);
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
                {currentStep === 3 && <KycStep />}
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

function getFieldsForStep(step: number): Array<import('react-hook-form').Path<SellerOnboardingValues>> {
  switch (step) {
    case 0:
      return ['firstName', 'lastName', 'email', 'phone', 'gender', 'dateOfBirth', 'preferredLanguage', 'alternatePhone'];
    case 1:
      return ['addressLine1', 'addressLine2', 'city', 'district', 'state', 'pincode', 'country'];
    case 2:
      return ['identityType', 'businessTypes'];
    case 3:
      return ['panNumber', 'aadhar', 'gstin', 'businessPan'];
    case 4:
      return [
        'shopName', 'shopHandle', 'shopLogoUrl', 'description', 'businessPhone',
        'storeAddressLine1', 'storeAddressLine2', 'storeCity', 'storeDistrict', 'storeState', 'storePincode', 'storeCountry',
        'googleMapsUrl'
      ];
    case 5:
      return ['acceptedTerms'];
    default:
      return [];
  }
}
