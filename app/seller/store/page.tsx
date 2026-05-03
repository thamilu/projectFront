'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCreateStore, useSellerStore, useUpdateStore } from '@/features/seller/hooks/use-seller';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Store as StoreIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { APP_ROUTES } from '@/constants/routes/app-routes';
import { queryKeys } from '@/lib/query-keys';
import { sellerProfileApi } from '@/features/seller/api/seller-profile-api';
import {
  storeCreateRequestFromSellerProfile,
  storeCreateRequestFromForm
} from '@/features/seller/utils/store-mappers';
import { StoreCreateFormData } from '@/features/seller/schemas';
import { StoreProfileForm } from '@/features/seller/components/StoreProfileForm';
import { toast } from 'sonner';

export default function SellerStorePage() {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const { data: store, isLoading: isStoreLoading, error } = useSellerStore();
  const createStore = useCreateStore();
  const updateStore = useUpdateStore();

  const { data: sellerProfile, isLoading: isProfileLoading, error: profileError } = useQuery({
    queryKey: queryKeys.seller.profile(),
    queryFn: sellerProfileApi.getMyProfile,
  });

  const isLoading = isStoreLoading || isProfileLoading;

  const handleSubmit = (data: StoreCreateFormData) => {
    const apiPayload = storeCreateRequestFromForm(data);

    if (store) {
      updateStore.mutate(
        { ...apiPayload, id: store.id },
        {
          onSuccess: () => {
            toast.success('Store details submitted for update successfully.');
            setIsEditing(false);
          },
        }
      );
    } else {
      createStore.mutate(apiPayload, {
        onSuccess: () => {
          toast.success('Store details submitted successfully.');
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center p-4 text-center">
        <StoreIcon className="text-muted-foreground/50 mx-auto mb-4 h-12 w-12" />
        <h2 className="mb-2 text-xl font-semibold">Couldn't Load Store Profile</h2>
        <p className="text-muted-foreground">
          {(error as { message?: string })?.message || 'Failed to load store profile'}
        </p>
        <div className="mt-6 flex gap-3">
          <Button onClick={() => window.location.reload()}>Retry</Button>
          <Button variant="outline" onClick={() => router.push(APP_ROUTES.SELLER.SETTINGS)}>
            Seller Settings
          </Button>
        </div>
      </div>
    );
  }

  // If the store does not exist yet, we pre-fill from the seller profile mappings
  if (!store && sellerProfile) {
    const initialData = storeCreateRequestFromSellerProfile(sellerProfile);

    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Setup Your Store</h1>
          <p className="text-muted-foreground">
            Please finalize your store details below to begin selling.
          </p>
        </div>

        <StoreProfileForm
          initialData={initialData as Partial<StoreCreateFormData>}
          onSubmit={handleSubmit}
          isPending={createStore.isPending}
          submitLabel="Create Store"
          title="Review and Submit Store Details"
          description="Your details have been pre-filled from your seller application. You can modify them here."
        />
      </div>
    );
  }

  // If we reach here, store is null AND sellerProfile is null (or it errored out silently)
  if (!store) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center p-4 text-center">
        <StoreIcon className="text-muted-foreground/50 mx-auto mb-4 h-12 w-12" />
        <h2 className="mb-2 text-xl font-semibold">Store Setup Required</h2>
        <p className="text-muted-foreground">
          You do not have an active seller account or store yet.
        </p>

        {/* DEBUGGING OVERLAY: To help identify why sellerProfile didn't render the form */}
        {profileError && (
          <p className="mt-4 text-red-500 font-mono text-sm">
            Profile Error: {(profileError as any)?.message}
          </p>
        )}
        {!sellerProfile && !profileError && (
          <p className="mt-4 text-orange-500 font-mono text-sm max-w-md">
            Notice: The backend returned empty for your seller profile (404 Not Found), meaning an application form hasn't been submitted or was reset.
          </p>
        )}

        <div className="mt-6 flex gap-3">
          <Button onClick={() => window.location.reload()}>Retry</Button>
          <Button variant="outline" onClick={() => router.push(APP_ROUTES.SELLER.SETTINGS)}>
            Go to Settings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Store Profile</h1>
          <p className="text-muted-foreground">Manage your store details and visibility</p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            Edit Profile
          </Button>
        )}
      </div>

      {!isEditing ? (
        <Card className="border-2 border-primary/20">
          <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
            <StoreIcon className="text-primary h-8 w-8" />
            <div className="flex-1">
              <CardTitle>{store.storeName}</CardTitle>
              <p className="text-muted-foreground text-sm">{store.email || '—'}</p>
            </div>
            <div className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
              {store.isVerified ? 'Verified' : 'Unverified'}
            </div>
          </CardHeader>
          <CardContent className="mt-4 grid gap-4 md:grid-cols-2 text-sm">
            <div>
              <span className="text-muted-foreground font-semibold">Description: </span>
              <span>{store.description}</span>
            </div>
            <div>
              <span className="text-muted-foreground font-semibold">Phone: </span>
              <span>{store.phone || 'N/A'}</span>
            </div>
            <div>
              <span className="text-muted-foreground font-semibold">Address: </span>
              <span>{store.address || 'N/A'}</span>
            </div>
            <div>
              <span className="text-muted-foreground font-semibold">Rating: </span>
              <span>{store.rating ?? 0} ({store.totalRatings ?? 0} reviews)</span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="pt-2">
          <StoreProfileForm
            initialData={{
              storeName: store.storeName,
              description: store.description,
              email: store.email || '',
              phone: store.phone || '',
              address: store.address || '',
              logoUrl: store.logoUrl || '',
            }}
            onSubmit={handleSubmit}
            isPending={updateStore.isPending}
            onCancel={() => setIsEditing(false)}
            submitLabel="Save Changes & Submit for Approval"
            title="Update Information"
            description="Any modifications you make to these fields may require administrative review before updating publicly."
          />
        </div>
      )}
    </div>
  );
}
