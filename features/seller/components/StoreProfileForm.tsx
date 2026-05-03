'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Store, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { storeCreateSchema, type StoreCreateFormData } from '@/features/seller/schemas';
import { StoreDetailsFields } from '@/features/seller/components/StoreDetailsFields';

interface StoreProfileFormProps {
  initialData?: Partial<StoreCreateFormData>;
  onSubmit: (data: StoreCreateFormData) => void;
  isPending: boolean;
  onCancel?: () => void;
  submitLabel?: string;
  title?: string;
  description?: string;
}

export function StoreProfileForm({
  initialData,
  onSubmit,
  isPending,
  onCancel,
  submitLabel = 'Save Store',
  title = 'Store Information',
  description = 'Provide details about your business that customers will see',
}: StoreProfileFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StoreCreateFormData>({
    resolver: zodResolver(storeCreateSchema),
    mode: 'onTouched',
    defaultValues: {
      storeName: initialData?.storeName || '',
      description: initialData?.description || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      address: initialData?.address || '',
      logoUrl: initialData?.logoUrl || '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Store className="text-primary h-5 w-5" />
            <CardTitle>{title}</CardTitle>
          </div>
          <CardDescription>{description}</CardDescription>
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
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isPending}
              >
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? 'Saving...' : submitLabel}
              {!isPending && submitLabel.includes('Save') && <Save className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
