'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  MapPin, 
  ShieldCheck, 
  Save, 
  X, 
  Camera, 
  Loader2, 
  Phone,
  Mail,
  Calendar,
  CreditCard,
  FileText
} from 'lucide-react';
import { useSession, signIn } from 'next-auth/react';
import { toast } from 'sonner';
import { logger } from '@/lib/observability/logger';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/http/services';
import { API_ENDPOINTS } from '@/constants/api/endpoints';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { AddressFields } from '@/shared/components/AddressFields';
import { ModernDatePicker } from '@/shared/components/ModernDatePicker';
import { languages } from '@/constants';
import { FormActions } from '@/shared/components/FormActions';
import { profileSchema, ProfileValues } from '@/schemas/user.schema';

export function ProfileForm() {
  const { data: session, status, update: updateSession } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [mounted, setMounted] = useState(false);
  const [hasSellerProfile, setHasSellerProfile] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isSellerRole = (session?.roles || []).includes('SELLER');

  const methods = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema) as any,
    mode: 'onBlur',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      alternatePhone: '',
      preferredLanguage: languages[0].name,
      gender: '',
      dateOfBirth: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      district: '',
      taluk: '',
      state: '',
      pincode: '',
      country: '',
    } as any,
  });

  const { register, handleSubmit, formState: { errors, isDirty }, reset, setValue, watch, control } = methods;

  // [HARDEN] Unsaved Changes Protection
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && isEditing) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, isEditing]);

  // Load profile data
  useEffect(() => {
    async function loadData() {
      setIsLoadingProfile(true);
      try {
        // [HARDEN] Resilient Profile Detection: Try seller endpoint first if role exists, 
        // but fallback gracefully if profile record is missing.
        let data: any = null;
        let sellerProfileFound = false;

        if (isSellerRole) {
          try {
            const response = await apiClient.get<any>(API_ENDPOINTS.SELLERS.PROFILE);
            data = response.data.data;
            sellerProfileFound = true;
          } catch (err: any) {
            if (err.status !== 404) throw err;
            // Fallback to user profile if seller profile doesn't exist yet
          }
        }

        if (!data) {
          const response = await apiClient.get<any>(API_ENDPOINTS.USERS.PROFILE);
          data = response.data.data;
        }

        setHasSellerProfile(sellerProfileFound);

        reset({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || session?.user?.email || '',
          phone: data.phone || data.personalMobileNumber || '',
          alternatePhone: data.alternatePhone || '',
          preferredLanguage: data.preferredLanguage || languages[0].name,
          gender: data.gender || '',
          dateOfBirth: data.dateOfBirth || '',
          addressLine1: data.addressLine1 || '',
          addressLine2: data.addressLine2 || '',
          city: data.city || '',
          district: data.district || '',
          taluk: data.taluk || '',
          state: data.state || '',
          pincode: data.pincode || '',
          country: data.country || 'India',
        });
      } catch (error: any) {
        // Fallback for new users
        if (session?.user) {
          const nameParts = (session.user.name || '').trim().split(/\s+/);
          reset({
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' ') || '',
            email: session.user.email || '',
            preferredLanguage: languages[0].name,
            country: 'India',
          });
        }
      } finally {
        setIsLoadingProfile(false);
      }
    }
    if (mounted) {
      if (status === 'authenticated') {
        loadData();
      } else if (status === 'unauthenticated') {
        setIsLoadingProfile(false);
      }
    }
  }, [mounted, status, isSellerRole, reset]);

  // [HARDEN] Memoized Handlers
  const handleEdit = useCallback(() => setIsEditing(true), []);
  const handleCancel = useCallback(() => {
    reset();
    setIsEditing(false);
  }, [reset]);
  const handleReset = useCallback(() => reset(), [reset]);
  const handleSave = useCallback(() => {
    handleSubmit(onSubmit)();
  }, [handleSubmit]);

  const handleNext = useCallback(() => {
    if (activeTab === 'personal') setActiveTab('address');
    else if (activeTab === 'address') setActiveTab('security');
  }, [activeTab]);

  const handleBack = useCallback(() => {
    if (activeTab === 'address') setActiveTab('personal');
    else if (activeTab === 'security') setActiveTab('address');
  }, [activeTab]);

  const onSubmit = async (values: ProfileValues) => {
    setIsSubmitting(true);
    try {
      const endpoint = hasSellerProfile ? API_ENDPOINTS.SELLERS.PROFILE : API_ENDPOINTS.USERS.PROFILE;
      
      // [HARDEN] Robust Partial Update: Filter out empty strings to prevent accidental 
      // blank-overwrites and validation failures on the backend.
      const filteredValues = Object.fromEntries(
        Object.entries(values).filter(([_, value]) => value !== '' && value !== null && value !== undefined)
      );

      // [HARDEN] Align payload with UserSelfUpdateRequest / SellerProfileUpdateRequest
      const payload = { 
        ...filteredValues,
        // Backend expects 'phone' or alias 'mobileNumber'
        phone: values.phone || undefined
      };
      
      await apiClient.put(endpoint, payload);
      
      toast.success('Profile updated successfully');
      await updateSession();
      reset(values);
      setIsEditing(false);
    } catch (error: any) {
      logger.error('Profile update failed', { error });
      
      // [HARDEN] Surface specific validation errors from backend
      const message = error.response?.data?.message || error.message || 'Failed to update profile';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted || status === 'loading' || (status === 'authenticated' && isLoadingProfile)) {
    return (
      <div className="mx-auto max-w-5xl space-y-8 pb-20 p-6">
        <div className="flex items-center gap-6">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="space-y-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-5 w-32" />
          </div>
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="mx-auto max-w-5xl p-6 text-center space-y-6 py-20">
        <div className="bg-muted/20 p-12 rounded-3xl border border-dashed border-muted-foreground/20">
          <ShieldCheck className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
          <h2 className="text-2xl font-bold">Authentication Required</h2>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            Please sign in to view and manage your profile information.
          </p>
          <Button onClick={() => signIn('keycloak')} className="mt-8 px-8 h-12">
            Sign In Now
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-20">
      {/* Header section with Premium Aesthetics */}
      <div className="flex flex-col items-center justify-between gap-6 md:flex-row p-6 bg-muted/20 rounded-3xl border border-muted-foreground/10">
        <div className="flex items-center gap-6">
          <div className="relative group">
            <Avatar className="h-24 w-24 border-4 border-primary/20 shadow-2xl transition-transform group-hover:scale-105">
              <AvatarImage src={session?.user?.image || ''} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {session?.user?.name?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <button className="absolute bottom-0 right-0 rounded-full bg-primary p-2 text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors">
              <Camera className="h-4 w-4" />
            </button>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{session?.user?.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                {hasSellerProfile ? 'Verified Seller' : 'Premium Buyer'}
              </Badge>
              <span className="text-sm text-muted-foreground">{session?.user?.email}</span>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 backdrop-blur-sm rounded-xl">
          <TabsTrigger value="personal" className="rounded-lg"><User className="mr-2 h-4 w-4" /> Personal</TabsTrigger>
          <TabsTrigger value="address" className="rounded-lg"><MapPin className="mr-2 h-4 w-4" /> Address</TabsTrigger>
          <TabsTrigger value="security" className="rounded-lg"><ShieldCheck className="mr-2 h-4 w-4" /> Security</TabsTrigger>
        </TabsList>

        <FormProvider {...methods}>
          <form className="mt-8">
            <AnimatePresence mode="wait">
              {activeTab === 'personal' && (
                <motion.div
                  key="personal"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Card className="border-none shadow-xl bg-background/50 backdrop-blur-md">
                    <CardHeader>
                      <CardTitle>Personal Information</CardTitle>
                      <CardDescription>Manage your core profile identity and contact details.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6 px-8">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input id="firstName" {...register('firstName')} disabled={!isEditing} className="h-12" />
                          {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input id="lastName" {...register('lastName')} disabled={!isEditing} className="h-12" />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label>Email Address</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-4 h-4 w-4 text-muted-foreground" />
                            <Input value={session?.user?.email || ''} disabled className="pl-10 h-12 bg-muted/50" />
                          </div>
                          <p className="text-[10px] text-muted-foreground italic">Managed by Identity Provider</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-4 h-4 w-4 text-muted-foreground" />
                            <Input id="phone" {...register('phone')} disabled={!isEditing} className="pl-10 h-12" placeholder="+91 98765 43210" />
                          </div>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label>Gender</Label>
                          <Select 
                            value={watch('gender')} 
                            onValueChange={(val) => setValue('gender', val, { shouldDirty: true })}
                            disabled={!isEditing}
                          >
                            <SelectTrigger className="h-12">
                              <SelectValue placeholder="Select Gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MALE">Male</SelectItem>
                              <SelectItem value="FEMALE">Female</SelectItem>
                              <SelectItem value="OTHER">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Date of Birth</Label>
                          <Controller
                            name="dateOfBirth"
                            control={control}
                            render={({ field }) => (
                              <ModernDatePicker value={field.value} onChange={field.onChange} disabled={!isEditing} />
                            )}
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="alternatePhone">Alternate Phone</Label>
                          <Input id="alternatePhone" {...register('alternatePhone')} disabled={!isEditing} className="h-12" placeholder="+91 98765 43210" />
                        </div>
                        <div className="space-y-2">
                          <Label>Preferred Language</Label>
                          <Select 
                            value={watch('preferredLanguage')} 
                            onValueChange={(val) => setValue('preferredLanguage', val, { shouldDirty: true })}
                            disabled={!isEditing}
                          >
                            <SelectTrigger className="h-12">
                              <SelectValue placeholder="Select Language" />
                            </SelectTrigger>
                            <SelectContent>
                              {languages.map((lang) => (
                                <SelectItem key={lang.code} value={lang.name}>
                                  <span className="flex items-center gap-2">
                                    <span>{lang.flag}</span>
                                    <span>{lang.name}</span>
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <FormActions 
                        isEditing={isEditing} 
                        isDirty={isDirty} 
                        isSubmitting={isSubmitting} 
                        onEdit={handleEdit} 
                        onCancel={handleCancel} 
                        onReset={handleReset} 
                        onSave={handleSave} 
                        onNext={handleNext}
                        hasNext={true}
                        hasBack={false}
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {activeTab === 'address' && (
                <motion.div
                  key="address"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Card className="border-none shadow-xl bg-background/50 backdrop-blur-md">
                    <CardHeader>
                      <CardTitle>Residential Address</CardTitle>
                      <CardDescription>Your primary permanent location for billing and shipping.</CardDescription>
                    </CardHeader>
                    <CardContent className="px-8 pb-8">
                      <AddressFields disabled={!isEditing} />
                      <FormActions 
                        isEditing={isEditing} 
                        isDirty={isDirty} 
                        isSubmitting={isSubmitting} 
                        onEdit={handleEdit} 
                        onCancel={handleCancel} 
                        onReset={handleReset} 
                        onSave={handleSave} 
                        onNext={handleNext}
                        onBack={handleBack}
                        hasNext={true}
                        hasBack={true}
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {activeTab === 'security' && (
                <motion.div
                  key="security"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Card className="border-none shadow-xl bg-background/50 backdrop-blur-md">
                    <CardHeader>
                      <CardTitle>Account Security</CardTitle>
                      <CardDescription>Manage your authentication methods and connected accounts.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 px-8 pb-8">
                      <div className="flex items-center justify-between p-4 rounded-xl border bg-background/40">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                            <ShieldCheck className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">Password Management</p>
                            <p className="text-xs text-muted-foreground">Change your password via Keycloak.</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">Manage</Button>
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-xl border bg-background/40">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                            <CreditCard className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">Stored Payments</p>
                            <p className="text-xs text-muted-foreground">You have 2 saved cards.</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">View</Button>
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-xl border bg-background/40">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">Active Sessions</p>
                            <p className="text-xs text-muted-foreground">Currently active on 3 devices.</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="text-destructive">Revoke All</Button>
                      </div>

                      <FormActions 
                        isEditing={isEditing} 
                        isDirty={isDirty} 
                        isSubmitting={isSubmitting} 
                        onEdit={handleEdit} 
                        onCancel={handleCancel} 
                        onReset={handleReset} 
                        onSave={handleSave} 
                        onBack={handleBack}
                        hasNext={false}
                        hasBack={true}
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </FormProvider>
      </Tabs>
    </div>
  );
}
