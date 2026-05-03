'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCreateStore } from '@/features/seller/hooks/use-seller';
import { Loader2, Store } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { APP_ROUTES } from '@/constants/routes/app-routes';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { storeCreateSchema, type StoreCreateFormData } from '@/features/seller/schemas';
import { StoreDetailsFields } from '@/features/seller/components/StoreDetailsFields';
import { storeCreateRequestFromForm } from '@/features/seller/utils/store-mappers';

export default function CreateStorePage() {
  const router = useRouter();
  const createStoreMutation = useCreateStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StoreCreateFormData>({
    resolver: zodResolver(storeCreateSchema),
    mode: 'onTouched',
    defaultValues: {
      storeName: '',
      description: '',
      email: '',
      phone: '',
      address: '',
      logoUrl: '',
    },
  });

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
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Your Store</h1>
        <p className="text-muted-foreground mt-2">
          Set up your store to start selling products on the marketplace
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Store className="text-primary h-5 w-5" />
              <CardTitle>Store Information</CardTitle>
            </div>
            <CardDescription>
              Provide details about your business that customers will see
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <StoreDetailsFields
              register={register}
              errors={errors}
              storeName={{
                name: 'storeName',
                id: 'storeName',
                label: 'Store Name *',
                placeholder: 'e.g., Tech Haven Electronics',
                required: true,
                inputClassName: 'h-12 text-lg',
              }}
              email={{
                name: 'email',
                id: 'email',
                label: 'Contact Email',
                placeholder: 'shop@example.com',
              }}
              phone={{
                name: 'phone',
                id: 'phone',
                label: 'Contact Phone',
                placeholder: '+91 1234567890',
                inputClassName: 'h-12 text-lg',
              }}
              description={{
                name: 'description',
                id: 'description',
                label: 'Store Description *',
                placeholder: 'Tell customers about your store and what you sell...',
                required: true,
                inputClassName: 'min-h-30 resize-none p-4 text-base',
              }}
              address={{
                name: 'address',
                id: 'address',
                label: 'Business Address',
                placeholder: 'Enter your business address',
                inputClassName: 'min-h-24 resize-none p-4 text-base',
              }}
            />

            <div className="flex justify-end gap-4 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={createStoreMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createStoreMutation.isPending}>
                {createStoreMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {createStoreMutation.isPending ? 'Creating...' : 'Create Store'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
