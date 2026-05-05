'use client';

import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  MapPin, 
  Store, 
  ShieldCheck, 
  Save, 
  X, 
  Camera, 
  Loader2, 
  Globe, 
  Phone,
  Mail,
  Calendar,
  CreditCard,
  FileText
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/axios';
import { API_ENDPOINTS } from '@/constants/api/endpoints';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { AddressFields } from '@/components/shared/AddressFields';
import { ModernDatePicker } from '@/components/shared/ModernDatePicker';
import { Controller } from 'react-hook-form';

import { profileSchema, ProfileValues } from '@/lib/validation/schemas/user';

// --- COMPONENT ---

export function ProfileForm() {
  const { data: session, update: updateSession } = useSession();
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isSeller = (session?.roles || []).includes('SELLER');

  const methods = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema) as any,
    mode: 'onBlur',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      alternatePhone: '',
      preferredLanguage: 'English',
      gender: '',
      dateOfBirth: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      district: '',
      state: '',
      pincode: '',
      country: 'India',
    } as any,
  });

  const { register, handleSubmit, formState: { errors, isDirty }, reset, setValue, watch, control } = methods;
  const genderValue = watch('gender');

  // Log form errors for debugging
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.warn('ProfileForm Validation Errors:', errors);
    }
  }, [errors]);

  // Load profile data
  useEffect(() => {
    async function loadData() {
      try {
        const endpoint = isSeller ? API_ENDPOINTS.SELLERS.PROFILE : API_ENDPOINTS.USERS.PROFILE;
        const response = await apiClient.get(endpoint);
        const data = response.data.data;
        console.log("Profile Data received:", data);

        // Map backend names to form names
        reset({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || session?.user?.email || '',
          phone: data.personalMobileNumber || data.phone || '',
          alternatePhone: data.alternatePhone || '',
          preferredLanguage: data.preferredLanguage || 'English',
          gender: data.gender || '',
          dateOfBirth: data.dateOfBirth || '',
          addressLine1: data.addressLine1 || '',
          addressLine2: data.addressLine2 || '',
          city: data.city || '',
          district: data.district || '',
          state: data.state || '',
          pincode: data.pincode || '',
          country: data.country || 'India',
        });
      } catch (error: any) {
        console.error('Failed to load profile', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          endpoint: isSeller ? API_ENDPOINTS.SELLERS.PROFILE : API_ENDPOINTS.USERS.PROFILE
        });
      }
    }
    if (session) loadData();
  }, [session, isSeller, reset]);

  if (!mounted) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  const onSubmit = async (values: ProfileValues) => {
    console.log('Submitting profile update...', values);
    setIsSaving(true);
    try {
      const endpoint = isSeller ? API_ENDPOINTS.SELLERS.PROFILE : API_ENDPOINTS.USERS.PROFILE;
      
      const payload = {
        ...values,
        personalMobileNumber: values.phone,
      };

      const response = await apiClient.put(endpoint, payload);
      console.log('Profile update response:', response.data);
      
      toast.success('Profile updated successfully');
      
      // Update session and form state
      await updateSession();
      
      // Explicitly reset the form with new values to clear isDirty
      reset(values);
      setIsEditing(false);
    } catch (error: any) {
      console.error('Profile update failed:', error);
      
      const details = error.response?.data?.fieldErrors || error.response?.data?.details;
      if (details && Array.isArray(details) && details.length > 0) {
        // Map backend field errors to react-hook-form
        details.forEach((err: any) => {
          if (err.field) {
            methods.setError(err.field as any, { type: 'server', message: err.message });
          }
        });
        toast.error('Please fix the errors in the form.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to update profile');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-20">
      <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
        <div className="flex items-center gap-6">
          <div className="relative group">
            <Avatar className="h-24 w-24 border-4 border-primary/20 shadow-2xl transition-transform group-hover:scale-105">
              <AvatarImage src={session?.user?.image || ''} />
              <AvatarFallback className="bg-linear-to-br from-primary to-primary/60 text-2xl text-primary-foreground">
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
                {isSeller ? 'Verified Seller' : 'Premium Buyer'}
              </Badge>
              <span className="text-sm text-muted-foreground">{session?.user?.email}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} className="px-6 h-12 shadow-lg shadow-primary/20">
              <User className="mr-2 h-4 w-4" /> Edit Profile
            </Button>
          ) : (
            <>
              <Button 
                variant="ghost" 
                onClick={() => {
                  reset();
                  setIsEditing(false);
                }} 
                disabled={isSaving}
                className="hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="mr-2 h-4 w-4" /> Cancel
              </Button>
              <Button variant="outline" onClick={() => reset()} disabled={!isDirty || isSaving}>
                <Loader2 className="mr-2 h-4 w-4 animate-spin hidden data-[visible=true]:block" data-visible={false} />
                Reset
              </Button>
              <Button 
                type="button"
                onClick={handleSubmit(
                  onSubmit, 
                  (errors) => {
                    console.error('Form Validation Errors:', errors);
                    toast.error('Please check the form for errors');
                  }
                )} 
                disabled={!isDirty || isSaving} 
                className="shadow-lg shadow-primary/20 px-6 h-12"
              >
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-fit lg:grid-cols-3 bg-muted/50 p-1 backdrop-blur-sm">
          <TabsTrigger value="personal" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <User className="mr-2 h-4 w-4" /> Personal
          </TabsTrigger>
          <TabsTrigger value="address" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <MapPin className="mr-2 h-4 w-4" /> Address Book
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <ShieldCheck className="mr-2 h-4 w-4" /> Security
          </TabsTrigger>
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
                  transition={{ duration: 0.2 }}
                >
                  <Card className="border-none shadow-xl bg-background/50 backdrop-blur-md">
                    <CardHeader>
                      <CardTitle>Personal Information</CardTitle>
                      <CardDescription>Manage your core profile identity and contact details.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <div className="grid gap-6 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input id="firstName" {...register('firstName')} disabled={!isEditing} className="bg-background/50" />
                            {errors.firstName && <p className="text-sm text-destructive">{errors.firstName.message}</p>}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input id="lastName" {...register('lastName')} disabled={!isEditing} className="bg-background/50" />
                            {errors.lastName && <p className="text-sm text-destructive">{errors.lastName.message}</p>}
                          </div>
                        </div>

                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input id="email" {...register('email')} disabled className="pl-9 bg-muted/50" />
                          </div>
                          <p className="text-[10px] text-muted-foreground italic">Managed by Identity Provider</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input id="phone" {...register('phone')} disabled={!isEditing} placeholder="+91 98765 43210" className="pl-9 bg-background/50" />
                          </div>
                          {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
                        </div>
                      </div>

                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="gender">Gender</Label>
                          <Select 
                            value={genderValue} 
                            onValueChange={(val) => setValue('gender', val, { shouldDirty: true, shouldValidate: true })}
                            disabled={!isEditing}
                          >
                            <SelectTrigger className="bg-background/50 h-12">
                              <SelectValue placeholder="Select Gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MALE">Male</SelectItem>
                              <SelectItem value="FEMALE">Female</SelectItem>
                              <SelectItem value="OTHER">Other</SelectItem>
                              <SelectItem value="PREFER_NOT_TO_SAY">Prefer not to say</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="dateOfBirth">Date of Birth</Label>
                          <Controller
                            name="dateOfBirth"
                            control={methods.control}
                            render={({ field }) => (
                              <ModernDatePicker
                                value={field.value}
                                onChange={field.onChange}
                                disabled={!isEditing}
                                className={!isEditing ? 'bg-muted/50' : 'bg-background/50'}
                              />
                            )}
                          />
                        </div>
                      </div>

                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="alternatePhone">Alternate Phone</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input id="alternatePhone" {...register('alternatePhone')} disabled={!isEditing} placeholder="+91 98765 43210" className="pl-9 bg-background/50" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="preferredLanguage">Preferred Language</Label>
                          <Select 
                            value={watch('preferredLanguage')} 
                            onValueChange={(val) => setValue('preferredLanguage', val, { shouldDirty: true, shouldValidate: true })}
                            disabled={!isEditing}
                          >
                            <SelectTrigger className="bg-background/50 h-12">
                              <SelectValue placeholder="Select Language" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="English">English</SelectItem>
                              <SelectItem value="Hindi">Hindi</SelectItem>
                              <SelectItem value="Tamil">Tamil</SelectItem>
                              <SelectItem value="Malayalam">Malayalam</SelectItem>
                              <SelectItem value="Kannada">Kannada</SelectItem>
                              <SelectItem value="Telugu">Telugu</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
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
                  transition={{ duration: 0.2 }}
                >
                  <Card className="border-none shadow-xl bg-background/50 backdrop-blur-md">
                    <CardHeader>
                      <CardTitle>Residential Address</CardTitle>
                      <CardDescription>Your primary permanent location for billing and shipping.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <AddressFields showTitle={false} disabled={!isEditing} />
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
                  transition={{ duration: 0.2 }}
                >
                  <Card className="border-none shadow-xl bg-background/50 backdrop-blur-md">
                    <CardHeader>
                      <CardTitle>Account Security</CardTitle>
                      <CardDescription>Manage your authentication methods and connected accounts.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between p-4 rounded-lg border bg-background/40">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                            <ShieldCheck className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">Password Management</p>
                            <p className="text-xs text-muted-foreground">Change your password via Keycloak Identity Provider.</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">Manage on Keycloak</Button>
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-lg border bg-background/40">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                            <CreditCard className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">Stored Payment Methods</p>
                            <p className="text-xs text-muted-foreground">You have 2 saved cards.</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">View All</Button>
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-lg border bg-background/40">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">Active Sessions</p>
                            <p className="text-xs text-muted-foreground">Currently logged in from 3 devices.</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">Revoke All</Button>
                      </div>
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
