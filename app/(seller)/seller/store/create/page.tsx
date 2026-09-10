'use client';

import { useCreateStore } from '@/features/seller/hooks/use-seller';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { APP_ROUTES } from '@/shared/routes';
import { StoreProfileForm } from '@/features/seller/components/StoreProfileForm';
import { storeCreateRequestFromForm } from '@/features/seller/utils/store-mappers';
import { type StoreCreateFormData } from '@/domains/seller/contracts/seller.schema';
import { FeatureHeader } from '@/shared/ui/molecules';

export default function CreateStorePage() {
  const router = useRouter();
  const createStoreMutation = useCreateStore();

  const onSubmit = (data: StoreCreateFormData) => {
    createStoreMutation.mutate(storeCreateRequestFromForm(data), {
      onSuccess: () => {
        toast.success('Store created successfully!');
        router.push(APP_ROUTES.SELLER.STORE);
      },
      onError: (error: unknown) => {
        const err = error as { message?: string };
        toast.error('Failed to create store', {
          description: err.message || 'Please try again',
        });
      },
    });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <FeatureHeader
        title="Genesis: Store Setup"
        subtitle="Initialize your commercial presence on the marketplace"
      />

      <StoreProfileForm
        onSubmit={onSubmit}
        isPending={createStoreMutation.isPending}
        submitLabel="Initialize Store"
        title="Store Parameters"
        description="Configure your public identity and operational parameters."
        onCancel={() => router.back()}
      />
    </div>
  );
}
