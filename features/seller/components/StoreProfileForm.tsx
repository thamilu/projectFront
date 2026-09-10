'use client';

import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Store as StoreIcon,
  Save,
  X,
  Loader2,
  Mail,
  Phone,
  Globe,
  Info,
  Coins,
} from 'lucide-react';

import { PremiumCard } from '@/shared/ui/molecules/PremiumCard';
import { Button } from '@/shared/ui/atoms/button';
import { Input } from '@/shared/ui/atoms/input';
import { Label } from '@/shared/ui/atoms/label';
import { Textarea } from '@/shared/ui/atoms/textarea';
import { AddressFields } from '@/shared/ui/molecules/AddressFields';
import {
  storeCreateSchema,
  type StoreCreateFormData,
} from '@/domains/seller/contracts/seller.schema';

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
  submitLabel = 'Save Store Profile',
  title = 'Public Store Presence',
  description = 'This information is visible to customers on your store page.',
}: StoreProfileFormProps) {
  const methods = useForm<StoreCreateFormData>({
    resolver: zodResolver(storeCreateSchema) as any,
    mode: 'onTouched',
    defaultValues: {
      storeName: initialData?.storeName || '',
      description: initialData?.description || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      addressLine1: initialData?.addressLine1 || '',
      addressLine2: initialData?.addressLine2 || '',
      city: initialData?.city || '',
      taluk: initialData?.taluk || '',
      district: initialData?.district || '',
      state: initialData?.state || '',
      pincode: initialData?.pincode || '',
      country: initialData?.country || 'India',
      shopHandle: initialData?.shopHandle || '',
      shopLogoUrl: initialData?.shopLogoUrl || '',
      googleMapsUrl: initialData?.googleMapsUrl || '',
      currencyCode: initialData?.currencyCode || 'INR',
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = methods;

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
        <PremiumCard
          title={title}
          description={description}
          icon={<StoreIcon className="h-6 w-6" />}
          className="animate-none" // Form handles its own entrance
        >
          <div className="space-y-8">
            {/* Core Details Section */}
            <section className="space-y-6">
              <div className="text-primary flex items-center gap-2 text-sm font-semibold tracking-wider uppercase">
                <Info className="h-4 w-4" /> Basic Information
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="storeName">Store Display Name</Label>
                  <Input
                    id="storeName"
                    {...register('storeName')}
                    className="bg-background/50 h-12"
                    placeholder="e.g. Acme Electronics"
                  />
                  {errors.storeName && (
                    <p className="text-destructive text-xs">{errors.storeName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Public Contact Email</Label>
                  <div className="relative">
                    <Mail className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
                    <Input
                      id="email"
                      {...register('email')}
                      className="bg-background/50 h-12 pl-10"
                      placeholder="support@yourstore.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-destructive text-xs">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="shopHandle">Shop Handle (Unique ID)</Label>
                  <Input
                    id="shopHandle"
                    {...register('shopHandle')}
                    className="bg-background/50 h-12 font-mono text-sm"
                    placeholder="my-awesome-shop"
                  />
                  <p className="text-muted-foreground ml-1 text-[10px]">
                    Public URL:{' '}
                    <span className="text-primary">
                      eshop.com/shop/{methods.watch('shopHandle') || 'handle'}
                    </span>
                  </p>
                  {errors.shopHandle && (
                    <p className="text-destructive text-xs">{errors.shopHandle.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shopLogoUrl">Shop Logo URL</Label>
                  <Input
                    id="shopLogoUrl"
                    {...register('shopLogoUrl')}
                    className="bg-background/50 h-12"
                    placeholder="https://..."
                  />
                  {errors.shopLogoUrl && (
                    <p className="text-destructive text-xs">{errors.shopLogoUrl.message}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Customer Support Phone</Label>
                  <div className="relative">
                    <Phone className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
                    <Input
                      id="phone"
                      {...register('phone')}
                      className="bg-background/50 h-12 pl-10"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="googleMapsUrl">Google Maps URL</Label>
                  <div className="relative">
                    <Globe className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
                    <Input
                      id="googleMapsUrl"
                      {...register('googleMapsUrl')}
                      className="bg-background/50 h-12 pl-10 text-xs"
                      placeholder="https://maps.app.goo.gl/..."
                    />
                  </div>
                </div>
              </div>

              {/* Currency Selector Row */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="currencyCode" className="flex items-center gap-1.5">
                    <Coins className="h-4 w-4 text-amber-500" /> Store Settlement Currency
                  </Label>
                  <select
                    id="currencyCode"
                    {...register('currencyCode')}
                    className="border-input bg-background/50 focus:ring-ring flex h-12 w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="INR" className="text-foreground bg-[#0b0c10]">
                      INR (₹) - Indian Rupee (Default)
                    </option>
                    <option value="USD" className="text-foreground bg-[#0b0c10]">
                      USD ($) - US Dollar
                    </option>
                    <option value="EUR" className="text-foreground bg-[#0b0c10]">
                      EUR (€) - Euro
                    </option>
                    <option value="GBP" className="text-foreground bg-[#0b0c10]">
                      GBP (£) - British Pound
                    </option>
                  </select>
                  <p className="text-muted-foreground ml-1 text-[10px]">
                    Select the currency used for product pricing in your store listing.
                  </p>
                  {errors.currencyCode && (
                    <p className="text-destructive text-xs">
                      {(errors.currencyCode as any).message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Store Description</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  className="bg-background/50 min-h-32 resize-none p-4 text-base"
                  placeholder="Tell your customers about your brand story and product values..."
                />
                {errors.description && (
                  <p className="text-destructive text-xs">{errors.description.message}</p>
                )}
              </div>
            </section>

            <section className="space-y-6 border-t pt-6">
              <AddressFields
                showTitle
                title="Store Location Details"
                description="The physical location of your shop or warehouse."
              />
            </section>

            {/* Actions */}
            <div className="flex justify-end gap-4 border-t pt-8">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isPending}
                  className="h-12 px-6"
                >
                  <X className="mr-2 h-4 w-4" /> Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={isPending}
                className="shadow-primary/20 h-12 px-8 shadow-lg"
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {isPending ? 'Processing...' : submitLabel}
              </Button>
            </div>
          </div>
        </PremiumCard>
      </form>
    </FormProvider>
  );
}
