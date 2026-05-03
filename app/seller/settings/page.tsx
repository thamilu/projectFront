'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSellerStore, useUpdateStore } from '@/features/seller/hooks/use-seller';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { APP_ROUTES } from '@/constants/routes/app-routes';
import { StoreProfileForm } from '@/features/seller/components/StoreProfileForm';
import { StoreCreateFormData } from '@/features/seller/schemas';
import { storeCreateRequestFromForm } from '@/features/seller/utils/store-mappers';

export default function SellerSettingsPage() {
  const router = useRouter();
  const { data: storeData, isLoading } = useSellerStore();
  const { mutate: updateStore, isPending: isSaving } = useUpdateStore();

  const handleSave = (data: StoreCreateFormData) => {
    if (!storeData?.id) return;
    
    // Construct store update payload via form request mapper + ID
    const updates = {
      ...storeCreateRequestFromForm(data),
      id: storeData.id,
    };

    updateStore(updates, {
      onSuccess: () => {
        router.push(APP_ROUTES.SELLER.STORE);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!storeData?.id) {
    return (
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <CardTitle>Store Setup Required</CardTitle>
          <CardDescription>Create your store before accessing settings</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.push(APP_ROUTES.SELLER.STORE_CREATE)}>Create Store</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Seller Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your store information and preferences</p>
      </div>

      <StoreProfileForm
        initialData={{
          storeName: storeData.storeName,
          description: storeData.description,
          email: storeData.email || '',
          phone: storeData.phone || '',
          address: storeData.address || '',
          logoUrl: storeData.logoUrl || '',
        }}
        onSubmit={handleSave}
        isPending={isSaving}
        submitLabel="Save Changes"
        onCancel={() => router.back()}
        title="Store Information"
        description="Update your store details"
      />
    </div>
  );
}
