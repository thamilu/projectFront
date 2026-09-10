'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCreateStore, useSellerStore, useUpdateStore } from '@/features/seller/hooks/use-seller';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/atoms/card';
import { Loader2, Store as StoreIcon } from 'lucide-react';
import { Button } from '@/shared/ui/atoms/button';
import { APP_ROUTES } from '@/shared/routes';
import { queryKeys } from '@/core/cache/query-keys';
import { sellerApi } from '@/features/seller/api/seller-api';
import {
  storeCreateRequestFromSellerProfile,
  storeCreateRequestFromForm,
} from '@/features/seller/utils/store-mappers';
import { type StoreCreateFormData } from '@/domains/seller/contracts/seller.schema';
import { StoreProfileForm } from '@/features/seller/components/StoreProfileForm';
import { toast } from 'sonner';
import { FeatureHeader } from '@/shared/ui/molecules';

export default function SellerStorePage() {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const { data: store, isLoading: isStoreLoading, error } = useSellerStore();
  const createStore = useCreateStore();
  const updateStore = useUpdateStore();

  const {
    data: sellerProfile,
    isLoading: isProfileLoading,
    error: profileError,
  } = useQuery({
    queryKey: queryKeys.seller.profile,
    queryFn: sellerApi.getMyProfile,
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
    const appError = error as { statusCode?: number; message?: string };
    const statusCode = appError?.statusCode;
    const errorMsg =
      appError?.message || 'Failed to load store profile. Please try again or contact support.';

    return (
      <div className="flex h-[50vh] flex-col items-center justify-center p-4 text-center">
        <StoreIcon className="text-muted-foreground/50 mx-auto mb-4 h-12 w-12" />
        <h2 className="mb-2 text-xl font-semibold">Couldn&apos;t Load Store Profile</h2>
        {statusCode && (
          <p className="text-muted-foreground mb-1 font-mono text-xs">Error {statusCode}</p>
        )}
        <p className="text-muted-foreground max-w-sm text-sm">{errorMsg}</p>
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
        <FeatureHeader
          title="Setup Your Store"
          subtitle="Please finalize your store details below to begin selling."
          icon={StoreIcon}
        />

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
          <p className="mt-4 font-mono text-sm text-red-500">
            Profile Error: {(profileError as any)?.message}
          </p>
        )}
        {!sellerProfile && !profileError && (
          <div className="mt-6 rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">
            <p className="text-sm font-medium text-orange-500">
              Your seller profile was not found. If you haven't applied yet, please complete your
              onboarding.
            </p>
            <Button
              className="mt-4 border-none bg-orange-600 text-white hover:bg-orange-700"
              onClick={() => router.push(APP_ROUTES.SELLER.REGISTER)}
            >
              Start Onboarding
            </Button>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <Button variant="ghost" onClick={() => window.location.reload()}>
            Retry
          </Button>
          <Button variant="outline" onClick={() => router.push(APP_ROUTES.SELLER.SETTINGS)}>
            Go to Settings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <FeatureHeader
        title="My Store Profile"
        subtitle="Manage your store details and visibility"
        icon={StoreIcon}
        actions={
          !isEditing && (
            <Button
              onClick={() => setIsEditing(true)}
              className="shadow-primary/10 rounded-xl shadow-lg"
            >
              Edit Profile
            </Button>
          )
        }
      />

      {!isEditing ? (
        <Card className="border-primary/20 border-2">
          <CardHeader className="flex flex-row items-center gap-4 space-y-0 border-b border-white/[0.05] pb-4">
            <div className="relative">
              {store.logoUrl ? (
                <div className="border-primary/20 group-hover:border-primary/40 h-16 w-16 overflow-hidden rounded-2xl border-2 shadow-2xl transition-colors">
                  <img
                    src={store.logoUrl}
                    alt={store.storeName}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      // Fallback if image fails
                      (e.target as any).src =
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(store.storeName)}&background=0D8ABC&color=fff&size=128`;
                    }}
                  />
                </div>
              ) : (
                <div className="bg-primary/10 border-primary/20 flex h-16 w-16 items-center justify-center rounded-2xl border-2 shadow-xl">
                  <StoreIcon className="text-primary h-8 w-8" />
                </div>
              )}
              {store.isVerified && (
                <div className="absolute -top-1 -right-1 rounded-full border-2 border-[#05070a] bg-green-500 p-1 shadow-lg">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-white" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-2xl font-black tracking-tight italic">
                  {store.storeName}
                </CardTitle>
                <div
                  className={`rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase ${
                    store.isVerified
                      ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500'
                      : 'border-amber-500/20 bg-amber-500/10 text-amber-500'
                  }`}
                >
                  {store.isVerified ? 'Verified' : 'Unverified'}
                </div>
              </div>
              <p className="text-muted-foreground mt-1 font-mono text-xs">
                {store.email || 'contact@eshop.com'}
              </p>
            </div>
          </CardHeader>
          <CardContent className="mt-6 grid gap-6 text-sm leading-relaxed md:grid-cols-2">
            <div>
              <span className="text-muted-foreground font-semibold">Description: </span>
              <span>{store.description}</span>
            </div>
            <div>
              <span className="text-muted-foreground font-semibold">Phone: </span>
              <span>{store.phone || 'N/A'}</span>
            </div>
            <div>
              <span className="text-muted-foreground font-semibold">Shop Handle: </span>
              <span className="text-primary font-mono">{store.shopHandle || 'N/A'}</span>
            </div>
            <div>
              <span className="text-muted-foreground font-semibold">Store Address: </span>
              <span>{store.address || 'N/A'}</span>
            </div>
            <div>
              <span className="text-muted-foreground font-semibold">Store Currency: </span>
              <span className="font-mono font-bold text-amber-500">
                {store.currencyCode || 'INR'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground font-semibold">Rating: </span>
              <span>
                {store.rating ?? 0} ({store.totalRatings ?? 0} reviews)
              </span>
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
              addressLine1: store.addressLine1 || '',
              addressLine2: store.addressLine2 || '',
              city: store.city || '',
              district: store.district || '',
              state: store.state || '',
              pincode: store.pincode || '',
              country: store.country || 'India',
              shopLogoUrl: store.logoUrl || '',
              shopHandle: store.shopHandle || '',
              googleMapsUrl: store.googleMapsUrl || '',
              currencyCode: store.currencyCode || 'INR',
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
