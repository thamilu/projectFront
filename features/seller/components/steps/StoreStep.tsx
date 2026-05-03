"use client";

import { useFormContext } from 'react-hook-form';
import { StoreDetailsFields } from '@/features/seller/components/StoreDetailsFields';
import { SellerOnboardingValues } from '../../schemas';
import { StepLayout } from '../shared/StepLayout';

export function StoreStep() {
  const {
    register,
    formState: { errors },
  } = useFormContext<SellerOnboardingValues>();

  return (
    <StepLayout
      title="Store Setup"
      description="Define how your brand will appear to customers."
      containerClassName="bg-transparent border-none p-0"
    >
      <StoreDetailsFields
        register={register as any}
        errors={errors as any}
        storeName={{
          id: 'shopName',
          label: 'Store Display Name',
          placeholder: 'e.g. Acme Electronics',
        }}
        phone={{
          id: 'businessPhone',
          label: 'Customer Support Phone',
          placeholder: '+91 98765 43210',
        }}
        description={{
          id: 'description',
          label: 'Store Description',
          placeholder: 'Tell the world what makes your products special...',
        }}
      />
    </StepLayout>
  );
}
