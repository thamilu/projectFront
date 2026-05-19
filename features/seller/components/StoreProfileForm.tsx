'use client';

import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Store as StoreIcon, 
  Save, 
  X, 
  Loader2, 
  Mail, 
  Phone, 
  MapPin, 
  Globe,
  Info
} from 'lucide-react';

import { PremiumCard } from '@/shared/ui/molecules/PremiumCard';
import { Button } from '@/shared/ui/atoms/button';
import { Input } from '@/shared/ui/atoms/input';
import { Label } from '@/shared/ui/atoms/label';
import { Textarea } from '@/shared/ui/atoms/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/shared/ui/atoms/select';
import { AddressFields } from '@/shared/ui/molecules/AddressFields';
import { storeCreateSchema, type StoreCreateFormData } from '@/domains/seller/contracts/seller.schema';

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
    },
  });

  const { register, handleSubmit, formState: { errors } } = methods;

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
              <div className="flex items-center gap-2 text-sm font-semibold text-primary uppercase tracking-wider">
                <Info className="h-4 w-4" /> Basic Information
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="storeName">Store Display Name</Label>
                  <Input id="storeName" {...register('storeName')} className="bg-background/50 h-12" placeholder="e.g. Acme Electronics" />
                  {errors.storeName && <p className="text-xs text-destructive">{errors.storeName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Public Contact Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="email" {...register('email')} className="pl-10 bg-background/50 h-12" placeholder="support@yourstore.com" />
                  </div>
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="shopHandle">Shop Handle (Unique ID)</Label>
                  <Input id="shopHandle" {...register('shopHandle')} className="bg-background/50 h-12 font-mono text-sm" placeholder="my-awesome-shop" />
                  <p className="text-[10px] text-muted-foreground ml-1">
                    Public URL: <span className="text-primary">eshop.com/shop/{(methods.watch('shopHandle') || 'handle')}</span>
                  </p>
                  {errors.shopHandle && <p className="text-xs text-destructive">{errors.shopHandle.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shopLogoUrl">Shop Logo URL</Label>
                  <Input id="shopLogoUrl" {...register('shopLogoUrl')} className="bg-background/50 h-12" placeholder="https://..." />
                  {errors.shopLogoUrl && <p className="text-xs text-destructive">{errors.shopLogoUrl.message}</p>}
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Customer Support Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="phone" {...register('phone')} className="pl-10 bg-background/50 h-12" placeholder="+91 98765 43210" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="googleMapsUrl">Google Maps URL</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="googleMapsUrl" {...register('googleMapsUrl')} className="pl-10 bg-background/50 h-12 text-xs" placeholder="https://maps.app.goo.gl/..." />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Store Description</Label>
                <Textarea 
                  id="description" 
                  {...register('description')} 
                  className="bg-background/50 min-h-32 p-4 text-base resize-none" 
                  placeholder="Tell your customers about your brand story and product values..." 
                />
                {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
              </div>
            </section>

            <section className="space-y-6 pt-6 border-t">
              <AddressFields 
                showTitle 
                title="Store Location Details" 
                description="The physical location of your shop or warehouse."
              />
            </section>

            {/* Actions */}
            <div className="flex justify-end gap-4 pt-8 border-t">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel} disabled={isPending} className="px-6 h-12">
                  <X className="mr-2 h-4 w-4" /> Cancel
                </Button>
              )}
              <Button type="submit" disabled={isPending} className="px-8 h-12 shadow-lg shadow-primary/20">
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
