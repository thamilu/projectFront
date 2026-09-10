/**
 * Seller Profile Page
 *
 * Page for sellers to view and edit their profile
 */

'use client';

import {
  sellerProfileUpdateSchema,
  type SellerProfileUpdateFormData,
} from '@/domains/seller/contracts/seller.schema';
import {
  useSellerProfile as useMyStore,
  useUpdateSellerProfile as useUpdateStore,
} from '@/features/seller';
import { APP_ROUTES } from '@/shared/routes';
import { Button } from '@/shared/ui/atoms/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/atoms/card';
import { Input } from '@/shared/ui/atoms/input';
import { Label } from '@/shared/ui/atoms/label';
import { Textarea } from '@/shared/ui/atoms/textarea';
import { cn } from '@/shared/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  BadgeCheck,
  Briefcase,
  CreditCard,
  Edit,
  Fingerprint,
  Globe,
  Loader2,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

export default function SellerProfilePage() {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const { data: profile, isLoading, error: profileError, refetch } = useMyStore();
  const { mutateAsync: updateProfile, isPending: saving } = useUpdateStore();

  const businessTypesText = profile?.businessTypes?.join(', ') || 'None';

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setError,
  } = useForm<SellerProfileUpdateFormData>({
    resolver: zodResolver(sellerProfileUpdateSchema) as any,
  });

  // Populate form when profile loads
  useEffect(() => {
    if (profile) {
      reset({
        shopName: profile.shopName || profile.displayName || '',
        shopHandle: profile.shopHandle || '',
        shopLogoUrl: profile.shopLogoUrl || '',
        businessName: profile.businessName || '',
        description: profile.description || '',
        panNumber: profile.kyc?.panNumber || '',
        aadhar: profile.kyc?.aadhar || '',
        gstin: profile.kyc?.gstin || '',
        businessPhone: profile.businessMobileNumber || '',
        storeAddressLine1: profile.storeAddressLine1 || profile.addressLine1 || '',
        storeAddressLine2: profile.storeAddressLine2 || profile.addressLine2 || '',
        storeCity: profile.storeCity || profile.city || '',
        storeDistrict: profile.storeDistrict || profile.district || '',
        storeTaluk: profile.storeTaluk || profile.taluk || '',
        storeState: profile.storeState || profile.state || '',
        storePincode: profile.storePincode || profile.pincode || '',
        storeCountry: profile.storeCountry || profile.country || 'India',
        taluk: profile.taluk || '',
        googleMapsUrl: profile.googleMapsUrl || '',
      });
    }
  }, [profile, reset]);

  if (isLoading) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-4 bg-[#05070a]">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-blue-500/20 border-t-blue-500" />
          <Loader2 className="absolute inset-0 m-auto h-8 w-8 animate-pulse text-blue-500/50" />
        </div>
        <p className="animate-pulse text-[10px] font-black tracking-[0.3em] text-blue-500 uppercase">
          Initializing Identity
        </p>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#05070a] p-4">
        <div className="w-full max-w-md space-y-8 rounded-[2.5rem] border border-white/[0.05] bg-white/[0.02] p-10 text-center shadow-2xl backdrop-blur-xl">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-blue-500/20 bg-blue-500/10">
            <ShieldCheck className="h-10 w-10 text-red-500/50" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black tracking-tight text-white italic">
              Interface Failure
            </h2>
            <p className="text-sm leading-relaxed font-medium text-white/40">
              The security layer encountered an error while resolving your seller identity. Please
              check your network connection.
            </p>
          </div>
          <div className="flex flex-col gap-3 pt-4">
            <Button
              onClick={() => refetch()}
              className="h-12 rounded-2xl bg-blue-600 text-xs font-black tracking-widest hover:bg-blue-700"
            >
              RETRY SYNCHRONIZATION
            </Button>
            <Button
              variant="ghost"
              onClick={() => router.push(APP_ROUTES.SELLER.DASHBOARD)}
              className="text-[10px] font-bold tracking-widest text-white/30 hover:text-white"
            >
              BACK TO DASHBOARD
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#05070a] p-4">
        <div className="w-full max-w-md space-y-8 rounded-[2.5rem] border border-white/[0.05] bg-white/[0.02] p-10 text-center shadow-2xl backdrop-blur-xl">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-blue-500/20 bg-blue-500/10">
            <User className="h-10 w-10 text-blue-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black tracking-tight text-white italic">
              Profile Required
            </h2>
            <p className="text-sm leading-relaxed font-medium text-white/40">
              We could not find an active seller profile associated with this account. Please
              complete your registration to activate the console.
            </p>
          </div>
          <div className="flex flex-col gap-3 pt-4">
            <Button
              onClick={() => router.push(APP_ROUTES.SELLER.REGISTER)}
              className="h-12 rounded-2xl bg-blue-600 text-xs font-black tracking-widest hover:bg-blue-700"
            >
              START ONBOARDING
            </Button>
            <Button
              variant="ghost"
              onClick={() => router.push(APP_ROUTES.SELLER.DASHBOARD)}
              className="text-[10px] font-bold tracking-widest text-white/30 hover:text-white"
            >
              BACK TO DASHBOARD
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: SellerProfileUpdateFormData) => {
    try {
      // [HARDEN] Robust Partial Update: Filter out empty strings to prevent accidental
      // blank-overwrites and validation failures on the backend.
      const filteredData = Object.fromEntries(
        Object.entries(data).filter(
          ([_, value]) => value !== '' && value !== null && value !== undefined
        )
      );

      await updateProfile(filteredData as any);
      toast.success('Configuration Synchronized', {
        description: 'Seller identity and store parameters updated successfully.',
      });
      setIsEditing(false);
    } catch (error: any) {
      console.error('[SellerProfile] Sync Error:', error);

      const responseData = error?.response?.data;

      // HARDENED ERROR CORRECTION: Map backend validation errors to form fields
      if (responseData && responseData.errors && typeof responseData.errors === 'object') {
        Object.entries(responseData.errors).forEach(([field, message]) => {
          setError(field as any, {
            type: 'server',
            message: message as string,
          });
        });
        toast.error('Validation Failure', {
          description: 'Please correct the highlighted fields in the configuration.',
        });
      } else {
        const message = responseData?.message || error?.message || 'Sync Error';
        toast.error('System Synchronization Failed', {
          description: message,
        });
      }
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const DataNode = ({
    label,
    value,
    icon: Icon,
    color = 'blue',
  }: {
    label: string;
    value: string | undefined;
    icon: any;
    color?: string;
  }) => (
    <div className="flex min-w-0 items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3 transition-all hover:bg-white/[0.05]">
      <div
        className={cn(
          'shrink-0 rounded-lg p-2',
          color === 'blue' ? 'bg-blue-500/10 text-blue-500' : 'bg-emerald-500/10 text-emerald-500'
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="mb-0.5 truncate text-[9px] font-black tracking-widest text-white/60 uppercase">
          {label}
        </p>
        <p className="truncate text-xs font-bold text-white/90" title={value}>
          {value || 'N/A'}
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#05070a] px-4 py-8 text-slate-300">
      <div className="container mx-auto max-w-4xl">
        {/* Compact Navigation Bar */}
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-white/[0.05] bg-white/[0.02] p-2 pl-5 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <Fingerprint className="h-5 w-5 text-blue-500" />
            <h1 className="text-sm font-black tracking-widest text-white uppercase italic">
              Seller Console
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <Button
                size="sm"
                onClick={() => setIsEditing(true)}
                className="h-8 rounded-xl bg-blue-600 px-4 text-xs hover:bg-blue-700"
              >
                <Edit className="mr-1.5 h-3 w-3" />
                Edit
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(false)}
                // Same fix as PromoBannerSection's "Learn More" button: the
                // `outline` variant's base `bg-background` (light) was never
                // overridden here, only its hover state — leaving
                // near-invisible light text on a light background at rest,
                // against this page's near-black bg-[#05070a].
                className="h-8 rounded-xl border-white/10 bg-transparent px-4 text-xs text-white/50 hover:bg-white/5"
              >
                <X className="mr-1.5 h-3 w-3" />
                Cancel
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => router.push(APP_ROUTES.SELLER.DASHBOARD)}
              className="h-8 w-8 p-0 text-white/30 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isEditing ? (
          /* PRECISE EDIT INTERFACE */
          <Card className="animate-in fade-in overflow-hidden rounded-3xl border-white/[0.05] bg-white/[0.02] shadow-2xl duration-300">
            <CardHeader className="border-b border-white/[0.05] p-6">
              <CardTitle className="text-lg font-black text-white">Update Configuration</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
                {/* Account Info - Read Only in Form */}
                <div className="grid grid-cols-1 gap-4 rounded-2xl border border-white/[0.05] bg-white/[0.03] p-4 md:grid-cols-3">
                  <div className="min-w-0 space-y-1">
                    <p className="text-[9px] font-black tracking-widest text-white/60 uppercase">
                      Account Email
                    </p>
                    <p className="truncate text-xs font-bold text-white/80">{profile?.email}</p>
                  </div>
                  <div className="min-w-0 space-y-1">
                    <p className="text-[9px] font-black tracking-widest text-white/60 uppercase">
                      Identity Type
                    </p>
                    <p className="truncate text-xs font-bold text-white/80">
                      {profile?.identityType}
                    </p>
                  </div>
                  <div className="min-w-0 space-y-1">
                    <p className="text-[9px] font-black tracking-widest text-white/60 uppercase">
                      Business Type
                    </p>
                    <p className="truncate text-xs font-bold text-white/80">{businessTypesText}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="ml-1 text-[10px] font-black tracking-widest text-white/60 uppercase">
                      Shop Name
                    </Label>
                    <Input
                      {...register('shopName')}
                      className="h-9 rounded-xl border-white/[0.1] bg-white/[0.03] text-white"
                    />
                    {errors.shopName && (
                      <p className="ml-1 text-[10px] font-bold text-red-500">
                        {errors.shopName.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="ml-1 text-[10px] font-black tracking-widest text-white/60 uppercase">
                      Shop Handle
                    </Label>
                    <Input
                      {...register('shopHandle')}
                      className="h-9 rounded-xl border-white/[0.1] bg-white/[0.03] font-mono font-bold text-blue-500"
                    />
                    {errors.shopHandle && (
                      <p className="ml-1 text-[10px] font-bold text-red-500">
                        {errors.shopHandle.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="ml-1 text-[10px] font-black tracking-widest text-white/60 uppercase">
                    Logo URL
                  </Label>
                  <Input
                    {...register('shopLogoUrl')}
                    className="h-9 rounded-xl border-white/[0.1] bg-white/[0.03]"
                  />
                  {errors.shopLogoUrl && (
                    <p className="ml-1 text-[10px] font-bold text-red-500">
                      {errors.shopLogoUrl.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="ml-1 text-[10px] font-black tracking-widest text-white/60 uppercase">
                      PAN Number
                    </Label>
                    <Input
                      {...register('panNumber')}
                      className="h-9 rounded-xl border-white/[0.1] bg-white/[0.03] font-mono tracking-widest uppercase"
                    />
                    {errors.panNumber && (
                      <p className="ml-1 text-[10px] font-bold text-red-500">
                        {errors.panNumber.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="ml-1 text-[10px] font-black tracking-widest text-white/60 uppercase">
                      Aadhaar Number
                    </Label>
                    <Input
                      {...register('aadhar')}
                      className="h-9 rounded-xl border-white/[0.1] bg-white/[0.03] font-mono"
                    />
                    {errors.aadhar && (
                      <p className="ml-1 text-[10px] font-bold text-red-500">
                        {errors.aadhar.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="ml-1 text-[10px] font-black tracking-widest text-white/60 uppercase">
                    Support Phone
                  </Label>
                  <Input
                    {...register('businessPhone')}
                    className="h-9 rounded-xl border-white/[0.1] bg-white/[0.03]"
                  />
                  {errors.businessPhone && (
                    <p className="ml-1 text-[10px] font-bold text-red-500">
                      {errors.businessPhone.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="ml-1 text-[10px] font-black tracking-widest text-white/60 uppercase">
                    About Store
                  </Label>
                  <Textarea
                    rows={3}
                    {...register('description')}
                    className="resize-none rounded-xl border-white/[0.1] bg-white/[0.03] text-xs"
                  />
                  {errors.description && (
                    <p className="ml-1 text-[10px] font-bold text-red-500">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                <div className="space-y-6 border-t border-white/[0.05] pt-4">
                  <h3 className="text-[10px] font-black tracking-[0.2em] text-white/40 uppercase">
                    Store Location
                  </h3>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="ml-1 text-[10px] font-black tracking-widest text-white/60 uppercase">
                        Physical Address (Line 1)
                      </Label>
                      <Input
                        {...register('storeAddressLine1')}
                        className="h-9 rounded-xl border-white/[0.1] bg-white/[0.03]"
                        placeholder="Building, Street, Area..."
                      />
                      {errors.storeAddressLine1 && (
                        <p className="ml-1 text-[10px] font-bold text-red-500">
                          {errors.storeAddressLine1.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="ml-1 text-[10px] font-black tracking-widest text-white/60 uppercase">
                        Address Line 2
                      </Label>
                      <Input
                        {...register('storeAddressLine2')}
                        className="h-9 rounded-xl border-white/[0.1] bg-white/[0.03]"
                        placeholder="Near landmark, floor..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-2">
                      <Label className="ml-1 text-[10px] font-black tracking-widest text-white/60 uppercase">
                        City
                      </Label>
                      <Input
                        {...register('storeCity')}
                        className="h-9 rounded-xl border-white/[0.1] bg-white/[0.03] text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="ml-1 text-[10px] font-black tracking-widest text-white/60 uppercase">
                        Taluk
                      </Label>
                      <Input
                        {...register('storeTaluk')}
                        className="h-9 rounded-xl border-white/[0.1] bg-white/[0.03] text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="ml-1 text-[10px] font-black tracking-widest text-white/60 uppercase">
                        District
                      </Label>
                      <Input
                        {...register('storeDistrict')}
                        className="h-9 rounded-xl border-white/[0.1] bg-white/[0.03] text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="ml-1 text-[10px] font-black tracking-widest text-white/60 uppercase">
                        State
                      </Label>
                      <Input
                        {...register('storeState')}
                        className="h-9 rounded-xl border-white/[0.1] bg-white/[0.03] text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label className="ml-1 text-[10px] font-black tracking-widest text-white/60 uppercase">
                        Pincode
                      </Label>
                      <Input
                        {...register('storePincode')}
                        className="h-9 rounded-xl border-white/[0.1] bg-white/[0.03]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="ml-1 text-[10px] font-black tracking-widest text-white/60 uppercase">
                        Country
                      </Label>
                      <Input
                        {...register('storeCountry')}
                        className="h-9 rounded-xl border-white/[0.1] bg-white/[0.03]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="ml-1 text-[10px] font-black tracking-widest text-white/60 uppercase">
                        Maps Link
                      </Label>
                      <Input
                        {...register('googleMapsUrl')}
                        className="h-9 rounded-xl border-white/[0.1] bg-white/[0.03]"
                        placeholder="https://maps..."
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end border-t border-white/[0.05] pt-4">
                  <Button
                    type="submit"
                    disabled={saving}
                    size="sm"
                    className="h-10 rounded-xl bg-blue-600 px-8 text-[10px] font-bold tracking-widest hover:bg-blue-700"
                  >
                    {saving ? (
                      <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                    ) : (
                      <Save className="mr-1.5 h-3 w-3" />
                    )}
                    SAVE PROFILE
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          /* PRESTIGE COMPACT VIEW */
          <div className="animate-in fade-in space-y-6 duration-500">
            {/* Identity Card */}
            <Card className="rounded-[2rem] border-white/[0.05] bg-gradient-to-b from-white/[0.04] to-transparent shadow-2xl backdrop-blur-2xl">
              <CardContent className="p-6">
                <div className="flex flex-col items-center gap-6 md:flex-row">
                  <div className="group relative">
                    <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-white/[0.05] bg-[#0a0c10] p-1 shadow-2xl">
                      {profile?.shopLogoUrl && !profile.shopLogoUrl.includes('adfs') ? (
                        <img
                          src={profile.shopLogoUrl}
                          className="h-full w-full rounded-full object-cover"
                          alt="L"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              `https://ui-avatars.com/api/?name=${profile?.shopName}&background=0D8ABC&color=fff&size=256`;
                          }}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-blue-600/20 to-blue-900/10 text-2xl font-black text-blue-500 italic">
                          {getInitials(profile?.shopName || 'S')}
                        </div>
                      )}
                    </div>
                    <div className="absolute right-2 bottom-1 rounded-lg border-2 border-[#05070a] bg-emerald-500 p-1.5 shadow-lg">
                      <BadgeCheck className="h-3 w-3 text-white" />
                    </div>
                  </div>

                  <div className="flex-1 space-y-1 text-center md:text-left">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center">
                      <h2 className="text-2xl font-black tracking-tight text-white italic">
                        {profile?.shopName}
                      </h2>
                      <div className="mx-auto w-fit rounded-lg border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[8px] font-black tracking-widest text-blue-500 uppercase md:mx-0">
                        {profile?.status}
                      </div>
                    </div>
                    <p className="font-mono text-lg font-bold tracking-wider text-blue-500 opacity-80">
                      @{profile?.shopHandle}
                    </p>
                    <p className="max-w-lg text-[11px] leading-relaxed text-white/40 italic">
                      "{profile?.description || 'System configuration active.'}"
                    </p>
                  </div>
                </div>

                {/* Data Grid */}
                <div className="mt-8 grid grid-cols-1 gap-3 border-t border-white/[0.05] pt-6 sm:grid-cols-2 lg:grid-cols-4">
                  <DataNode label="Account Email" value={profile?.email} icon={Mail} />
                  <DataNode label="Business Type" value={businessTypesText} icon={Briefcase} />
                  <DataNode label="Identity Type" value={profile?.identityType} icon={User} />
                  <DataNode
                    label="Support Contact"
                    value={profile?.businessMobileNumber}
                    icon={Phone}
                  />

                  <DataNode
                    label="PAN Identifier"
                    value={profile?.kyc?.panNumber}
                    icon={ShieldCheck}
                    color="emerald"
                  />
                  <DataNode
                    label="Aadhaar UID"
                    value={profile?.kyc?.aadhar}
                    icon={CreditCard}
                    color="emerald"
                  />
                  <DataNode
                    label="Network Domain"
                    value={`${profile?.shopHandle}.eshop.com`}
                    icon={Globe}
                    color="emerald"
                  />
                  <DataNode
                    label="System Status"
                    value={profile?.status}
                    icon={BadgeCheck}
                    color="emerald"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Address Card */}
            <Card className="group flex flex-col items-center justify-between gap-6 overflow-hidden rounded-[1.5rem] border-white/[0.05] bg-white/[0.02] p-6 shadow-xl md:flex-row">
              <div className="text-center md:text-left">
                <h3 className="mb-2 text-[8px] font-black tracking-[0.3em] text-white/60 uppercase">
                  Geolocation
                </h3>
                <h4 className="text-xl font-black tracking-tight text-white italic">
                  {profile?.storeAddressLine1 || profile?.addressLine1}
                  {(profile?.storeAddressLine2 || profile?.addressLine2) && (
                    <span className="ml-2 font-medium text-white/40 not-italic">
                      , {profile?.storeAddressLine2 || profile?.addressLine2}
                    </span>
                  )}
                </h4>
                <p className="text-xs font-bold tracking-tight text-white/40">
                  {profile?.storeCity || profile?.city} / {profile?.storeTaluk || profile?.taluk} /{' '}
                  {profile?.storeDistrict || profile?.district || 'Global'} /{' '}
                  {profile?.storeState || profile?.state} /{' '}
                  {profile?.storePincode || profile?.pincode} /{' '}
                  {profile?.storeCountry || profile?.country || 'India'}
                </p>
              </div>

              {profile?.googleMapsUrl && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-10 rounded-xl border-white/10 bg-white/5 px-6 shadow-xl transition-all hover:bg-blue-600 hover:text-white"
                  asChild
                >
                  <a href={profile?.googleMapsUrl} target="_blank">
                    <Globe className="mr-2 h-4 w-4" />
                    <span className="text-[10px] font-black tracking-widest">MAPS</span>
                  </a>
                </Button>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
