import React, { useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { sellerOnboardingSchema, SellerOnboardingValues } from '../schemas';
import { SellerIdentityType, SellerBusinessType } from '../types';
import { useAuth } from '@/hooks/use-auth';
import { ProfileStep } from './steps/ProfileStep';
import { IdentityStep } from './steps/IdentityStep';
import { StoreStep } from './steps/StoreStep';
import { TermsStep } from './steps/TermsStep';
import { Stepper } from '@/components/ui/stepper';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const STEPS = [
  { title: 'Seller Info', description: 'Personal details' },
  { title: 'Identity', description: 'Business type' },
  { title: 'Store Details', description: 'Shop setup' },
  { title: 'Terms', description: 'Agreement' },
];

export function SellerRoleUpgradeForm({ onSuccess }: { onSuccess: () => void }) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = React.useState(0);

  const methods = useForm<SellerOnboardingValues>({
    resolver: zodResolver(sellerOnboardingSchema),
    defaultValues: {
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

  // Pre-populate Step 1 (Personal Address) from user profile
  useEffect(() => {
    if (user) {
      methods.reset({
        ...methods.getValues(),
        phone: (user as any).phone || '',
        // Note: We keep Store Address (Step 3) empty to encourage distinct shop location
      });
    }
  }, [user, methods]);

  const onSubmit = async (data: SellerOnboardingValues) => {
    try {
      // API call to register seller
      toast.success('Seller registration submitted for approval!');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
    }
  };

  const next = async () => {
    const fields = getFieldsForStep(currentStep);
    const isValid = await methods.trigger(fields as any);
    if (isValid) {
      if (currentStep < STEPS.length - 1) {
        setCurrentStep((s) => s + 1);
      } else {
        methods.handleSubmit(onSubmit)();
      }
    }
  };

  const prev = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  return (
    <div className="space-y-8">
      <Stepper steps={STEPS} currentStep={currentStep} />
      
      <FormProvider {...methods}>
        <form className="space-y-6">
          {currentStep === 0 && <ProfileStep />}
          {currentStep === 1 && <IdentityStep />}
          {currentStep === 2 && <StoreStep />}
          {currentStep === 3 && <TermsStep />}

          <div className="flex justify-between pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={prev}
              disabled={currentStep === 0}
            >
              Back
            </Button>
            <Button type="button" onClick={next}>
              {currentStep === STEPS.length - 1 ? 'Submit Registration' : 'Continue'}
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}

function getFieldsForStep(step: number): string[] {
  switch (step) {
    case 0:
      return ['addressLine1', 'city', 'district', 'state', 'pincode', 'phone'];
    case 1:
      return ['identityType', 'businessTypes'];
    case 2:
      return ['shopName', 'storeAddressLine1', 'storeCity', 'storeDistrict', 'storeState', 'storePincode'];
    case 3:
      return ['acceptedTerms'];
    default:
      return [];
  }
}
