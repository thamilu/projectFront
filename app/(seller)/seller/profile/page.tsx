/**
 * Seller Profile Page
 *
 * Page for sellers to view and edit their profile
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Loader2, Save, User, Edit, ArrowLeft, Globe, Phone, MapPin, 
  Building2, CreditCard, ShieldCheck, BadgeCheck, Store, 
  ExternalLink, X, Mail, Fingerprint, Briefcase
} from 'lucide-react';
import { useMyStore, useUpdateStore } from '@/lib/hooks/queries/use-seller';
import { APP_ROUTES } from '@/constants/routes/app-routes';
import { SellerIdentityType, SellerStatus } from '@/features/seller/types';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  sellerProfileUpdateSchema,
  type SellerProfileUpdateFormData,
} from '@/schemas/seller.schema';
import { cn } from '@/lib/utils';

export default function SellerProfilePage() {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const { data: profile, isLoading, error: profileError, refetch } = useMyStore();
  const { mutateAsync: updateProfile, isPending: saving } = useUpdateStore();
  
  const isBusiness = profile?.identityType === SellerIdentityType.BUSINESS;
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
      <div className="flex h-[80vh] flex-col items-center justify-center bg-[#05070a] gap-4">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
          <Loader2 className="absolute inset-0 m-auto h-8 w-8 animate-pulse text-blue-500/50" />
        </div>
        <p className="text-[10px] font-black text-blue-500 tracking-[0.3em] uppercase animate-pulse">Initializing Identity</p>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="min-h-screen bg-[#05070a] flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8 p-10 rounded-[2.5rem] bg-white/[0.02] border border-white/[0.05] shadow-2xl backdrop-blur-xl text-center">
          <div className="mx-auto w-20 h-20 rounded-3xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
            <ShieldCheck className="h-10 w-10 text-red-500/50" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white italic tracking-tight">Interface Failure</h2>
            <p className="text-sm text-white/40 font-medium leading-relaxed">
              The security layer encountered an error while resolving your seller identity. Please check your network connection.
            </p>
          </div>
          <div className="flex flex-col gap-3 pt-4">
            <Button onClick={() => refetch()} className="bg-blue-600 hover:bg-blue-700 h-12 rounded-2xl font-black tracking-widest text-xs">
              RETRY SYNCHRONIZATION
            </Button>
            <Button variant="ghost" onClick={() => router.push(APP_ROUTES.SELLER.DASHBOARD)} className="text-white/30 hover:text-white text-[10px] font-bold tracking-widest">
              BACK TO DASHBOARD
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#05070a] flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8 p-10 rounded-[2.5rem] bg-white/[0.02] border border-white/[0.05] shadow-2xl backdrop-blur-xl text-center">
          <div className="mx-auto w-20 h-20 rounded-3xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
            <User className="h-10 w-10 text-blue-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white italic tracking-tight">Profile Required</h2>
            <p className="text-sm text-white/40 font-medium leading-relaxed">
              We could not find an active seller profile associated with this account. Please complete your registration to activate the console.
            </p>
          </div>
          <div className="flex flex-col gap-3 pt-4">
            <Button onClick={() => router.push(APP_ROUTES.SELLER.REGISTER)} className="bg-blue-600 hover:bg-blue-700 h-12 rounded-2xl font-black tracking-widest text-xs">
              START ONBOARDING
            </Button>
            <Button variant="ghost" onClick={() => router.push(APP_ROUTES.SELLER.DASHBOARD)} className="text-white/30 hover:text-white text-[10px] font-bold tracking-widest">
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
        Object.entries(data).filter(([_, value]) => value !== '' && value !== null && value !== undefined)
      );
      
      const response = await updateProfile(filteredData as any);
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
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const DataNode = ({ label, value, icon: Icon, color = "blue" }: { label: string; value: string | undefined; icon: any; color?: string }) => (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05] transition-all min-w-0">
      <div className={cn(
        "p-2 rounded-lg shrink-0",
        color === "blue" ? "bg-blue-500/10 text-blue-500" : "bg-emerald-500/10 text-emerald-500"
      )}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-black uppercase tracking-widest text-white/60 mb-0.5 truncate">{label}</p>
        <p className="text-xs font-bold text-white/90 truncate" title={value}>{value || 'N/A'}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#05070a] text-slate-300 py-8 px-4">
      
      <div className="container mx-auto max-w-4xl">
        
        {/* Compact Navigation Bar */}
        <div className="flex justify-between items-center mb-6 bg-white/[0.02] p-2 pl-5 rounded-2xl border border-white/[0.05] backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <Fingerprint className="h-5 w-5 text-blue-500" />
            <h1 className="text-sm font-black text-white tracking-widest uppercase italic">Seller Console</h1>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <Button size="sm" onClick={() => setIsEditing(true)} className="bg-blue-600 hover:bg-blue-700 h-8 rounded-xl px-4 text-xs">
                <Edit className="h-3 w-3 mr-1.5" />
                Edit
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setIsEditing(false)} className="border-white/10 hover:bg-white/5 text-white/50 h-8 rounded-xl px-4 text-xs">
                <X className="h-3 w-3 mr-1.5" />
                Cancel
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => router.push(APP_ROUTES.SELLER.DASHBOARD)} className="h-8 w-8 p-0 text-white/30 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isEditing ? (
          /* PRECISE EDIT INTERFACE */
          <Card className="rounded-3xl bg-white/[0.02] border-white/[0.05] shadow-2xl overflow-hidden animate-in fade-in duration-300">
            <CardHeader className="p-6 border-b border-white/[0.05]">
              <CardTitle className="text-lg font-black text-white">Update Configuration</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
                
                {/* Account Info - Read Only in Form */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white/[0.03] rounded-2xl border border-white/[0.05]">
                  <div className="space-y-1 min-w-0">
                    <p className="text-[9px] font-black uppercase text-white/60 tracking-widest">Account Email</p>
                    <p className="text-xs font-bold text-white/80 truncate">{profile?.email}</p>
                  </div>
                  <div className="space-y-1 min-w-0">
                    <p className="text-[9px] font-black uppercase text-white/60 tracking-widest">Identity Type</p>
                    <p className="text-xs font-bold text-white/80 truncate">{profile?.identityType}</p>
                  </div>
                  <div className="space-y-1 min-w-0">
                    <p className="text-[9px] font-black uppercase text-white/60 tracking-widest">Business Type</p>
                    <p className="text-xs font-bold text-white/80 truncate">{businessTypesText}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-white/60 uppercase tracking-widest ml-1">Shop Name</Label>
                    <Input {...register('shopName')} className="h-9 rounded-xl bg-white/[0.03] border-white/[0.1] text-white" />
                    {errors.shopName && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.shopName.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-white/60 uppercase tracking-widest ml-1">Shop Handle</Label>
                    <Input {...register('shopHandle')} className="h-9 rounded-xl bg-white/[0.03] border-white/[0.1] font-mono text-blue-500 font-bold" />
                    {errors.shopHandle && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.shopHandle.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-white/60 uppercase tracking-widest ml-1">Logo URL</Label>
                  <Input {...register('shopLogoUrl')} className="h-9 rounded-xl bg-white/[0.03] border-white/[0.1]" />
                  {errors.shopLogoUrl && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.shopLogoUrl.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-white/60 uppercase tracking-widest ml-1">PAN Number</Label>
                    <Input {...register('panNumber')} className="h-9 rounded-xl bg-white/[0.03] border-white/[0.1] uppercase font-mono tracking-widest" />
                    {errors.panNumber && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.panNumber.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-white/60 uppercase tracking-widest ml-1">Aadhaar Number</Label>
                    <Input {...register('aadhar')} className="h-9 rounded-xl bg-white/[0.03] border-white/[0.1] font-mono" />
                    {errors.aadhar && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.aadhar.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-white/60 uppercase tracking-widest ml-1">Support Phone</Label>
                  <Input {...register('businessPhone')} className="h-9 rounded-xl bg-white/[0.03] border-white/[0.1]" />
                  {errors.businessPhone && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.businessPhone.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-white/60 uppercase tracking-widest ml-1">About Store</Label>
                  <Textarea rows={3} {...register('description')} className="bg-white/[0.03] border-white/[0.1] rounded-xl text-xs resize-none" />
                  {errors.description && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.description.message}</p>}
                </div>

                <div className="pt-4 border-t border-white/[0.05] space-y-6">
                  <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Store Location</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-white/60 uppercase tracking-widest ml-1">Physical Address (Line 1)</Label>
                      <Input {...register('storeAddressLine1')} className="h-9 rounded-xl bg-white/[0.03] border-white/[0.1]" placeholder="Building, Street, Area..." />
                      {errors.storeAddressLine1 && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.storeAddressLine1.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-white/60 uppercase tracking-widest ml-1">Address Line 2</Label>
                      <Input {...register('storeAddressLine2')} className="h-9 rounded-xl bg-white/[0.03] border-white/[0.1]" placeholder="Near landmark, floor..." />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-white/60 uppercase tracking-widest ml-1">City</Label>
                      <Input {...register('storeCity')} className="h-9 rounded-xl bg-white/[0.03] border-white/[0.1] text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-white/60 uppercase tracking-widest ml-1">Taluk</Label>
                      <Input {...register('storeTaluk')} className="h-9 rounded-xl bg-white/[0.03] border-white/[0.1] text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-white/60 uppercase tracking-widest ml-1">District</Label>
                      <Input {...register('storeDistrict')} className="h-9 rounded-xl bg-white/[0.03] border-white/[0.1] text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-white/60 uppercase tracking-widest ml-1">State</Label>
                      <Input {...register('storeState')} className="h-9 rounded-xl bg-white/[0.03] border-white/[0.1] text-white" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-white/60 uppercase tracking-widest ml-1">Pincode</Label>
                      <Input {...register('storePincode')} className="h-9 rounded-xl bg-white/[0.03] border-white/[0.1]" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-white/60 uppercase tracking-widest ml-1">Country</Label>
                      <Input {...register('storeCountry')} className="h-9 rounded-xl bg-white/[0.03] border-white/[0.1]" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-white/60 uppercase tracking-widest ml-1">Maps Link</Label>
                      <Input {...register('googleMapsUrl')} className="h-9 rounded-xl bg-white/[0.03] border-white/[0.1]" placeholder="https://maps..." />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-white/[0.05]">
                  <Button type="submit" disabled={saving} size="sm" className="bg-blue-600 hover:bg-blue-700 h-10 px-8 rounded-xl font-bold tracking-widest text-[10px]">
                    {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <Save className="h-3 w-3 mr-1.5" />}
                    SAVE PROFILE
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          /* PRESTIGE COMPACT VIEW */
          <div className="space-y-6 animate-in fade-in duration-500">
            
            {/* Identity Card */}
            <Card className="rounded-[2rem] bg-gradient-to-b from-white/[0.04] to-transparent border-white/[0.05] shadow-2xl backdrop-blur-2xl">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="relative group">
                    <div className="h-24 w-24 rounded-full bg-[#0a0c10] border-2 border-white/[0.05] p-1 shadow-2xl overflow-hidden">
                      {profile?.shopLogoUrl && !profile.shopLogoUrl.includes('adfs') ? (
                        <img 
                          src={profile.shopLogoUrl} 
                          className="h-full w-full rounded-full object-cover" 
                          alt="L" 
                          onError={(e) => {(e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${profile?.shopName}&background=0D8ABC&color=fff&size=256`}}
                        />
                      ) : (
                        <div className="h-full w-full rounded-full bg-gradient-to-br from-blue-600/20 to-blue-900/10 flex items-center justify-center text-2xl font-black text-blue-500 italic">
                          {getInitials(profile?.shopName || 'S')}
                        </div>
                      )}
                    </div>
                    <div className="absolute bottom-1 right-2 bg-emerald-500 p-1.5 rounded-lg border-2 border-[#05070a] shadow-lg">
                      <BadgeCheck className="h-3 w-3 text-white" />
                    </div>
                  </div>

                  <div className="flex-1 text-center md:text-left space-y-1">
                    <div className="flex flex-col md:flex-row md:items-center gap-2">
                      <h2 className="text-2xl font-black tracking-tight text-white italic">{profile?.shopName}</h2>
                      <div className="bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border border-blue-500/20 w-fit mx-auto md:mx-0">
                        {profile?.status}
                      </div>
                    </div>
                    <p className="text-lg font-mono font-bold text-blue-500 tracking-wider opacity-80">@{profile?.shopHandle}</p>
                    <p className="text-[11px] text-white/40 italic leading-relaxed max-w-lg">
                      "{profile?.description || "System configuration active."}"
                    </p>
                  </div>
                </div>

                {/* Data Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-8 pt-6 border-t border-white/[0.05]">
                  <DataNode label="Account Email" value={profile?.email} icon={Mail} />
                  <DataNode label="Business Type" value={businessTypesText} icon={Briefcase} />
                  <DataNode label="Identity Type" value={profile?.identityType} icon={User} />
                  <DataNode label="Support Contact" value={profile?.businessMobileNumber} icon={Phone} />
                  
                  <DataNode label="PAN Identifier" value={profile?.kyc?.panNumber} icon={ShieldCheck} color="emerald" />
                  <DataNode label="Aadhaar UID" value={profile?.kyc?.aadhar} icon={CreditCard} color="emerald" />
                  <DataNode label="Network Domain" value={`${profile?.shopHandle}.eshop.com`} icon={Globe} color="emerald" />
                  <DataNode label="System Status" value={profile?.status} icon={BadgeCheck} color="emerald" />
                </div>
              </CardContent>
            </Card>

            {/* Address Card */}
            <Card className="rounded-[1.5rem] bg-white/[0.02] border-white/[0.05] p-6 flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl overflow-hidden group">
               <div className="text-center md:text-left">
                  <h3 className="text-[8px] font-black text-white/60 uppercase tracking-[0.3em] mb-2">Geolocation</h3>
                  <h4 className="text-xl font-black text-white italic tracking-tight">
                    {profile?.storeAddressLine1 || profile?.addressLine1}
                    {(profile?.storeAddressLine2 || profile?.addressLine2) && (
                      <span className="text-white/40 font-medium not-italic ml-2">
                        , {profile?.storeAddressLine2 || profile?.addressLine2}
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-white/40 font-bold tracking-tight">
                    {profile?.storeCity || profile?.city} / {profile?.storeTaluk || profile?.taluk} / {profile?.storeDistrict || profile?.district || 'Global'} / {profile?.storeState || profile?.state} / {profile?.storePincode || profile?.pincode} / {profile?.storeCountry || profile?.country || 'India'}
                  </p>
               </div>

               {profile?.googleMapsUrl && (
                <Button size="sm" variant="outline" className="h-10 px-6 rounded-xl border-white/10 bg-white/5 hover:bg-blue-600 hover:text-white transition-all shadow-xl" asChild>
                  <a href={profile?.googleMapsUrl} target="_blank">
                    <Globe className="h-4 w-4 mr-2" />
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
