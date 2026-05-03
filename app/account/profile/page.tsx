'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Camera, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { authenticatedFetch } from '@/lib/utils/fetch-utils';
import { API_ENDPOINTS } from '@/constants/api/endpoints';
import { motion } from 'framer-motion';

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(10, 'Enter a valid phone number').optional().or(z.literal('')),

  // Demographics
  gender: z.string().optional().or(z.literal('')),
  dateOfBirth: z.string().optional().or(z.literal('')),

  // Address
  address: z.string().max(255).optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  state: z.string().max(100).optional().or(z.literal('')),
  pincode: z.string().max(20).optional().or(z.literal('')),
  country: z.string().max(100).optional().or(z.literal('')),

  // Identity / KYC (Removed from buyer profile)
});

type ProfileValues = z.infer<typeof profileSchema>;

interface ExtendedSession {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    // New fields mapped from token (KYC removed)
    phone?: string | null;
    gender?: string | null;
    dateOfBirth?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
    country?: string | null;
  };
  accessToken?: string;
}

export default function AccountProfilePage() {
  const { data: session } = useSession() as { data: ExtendedSession | null };

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const name = session?.user?.name || '';
  const [firstName, ...rest] = name.split(' ');
  const lastName = rest.join(' ');

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName,
      lastName,
      email: session?.user?.email || '',
      phone: session?.user?.phone || '',
      gender: session?.user?.gender || '',
      dateOfBirth: session?.user?.dateOfBirth || '',
      address: session?.user?.address || '',
      city: session?.user?.city || '',
      state: session?.user?.state || '',
      pincode: session?.user?.pincode || '',
      country: session?.user?.country || '',
    },
  });

  const onSubmit = async (data: ProfileValues) => {
    setSaving(true);
    try {
      if (!session?.accessToken) throw new Error('Not authenticated');

      // Destructure email to exclude it from the database update payload
      // Email is managed by Keycloak and should not be stored in user_profiles
      const { email, ...updateData } = data;

      await authenticatedFetch(API_ENDPOINTS.USERS.PROFILE, {
        method: 'PUT',
        body: JSON.stringify(updateData),
        accessToken: session.accessToken,
      });
      setSaved(true);
      toast.success('Profile updated successfully');
      // Forcing a session refresh to reflect new claims might be necessary depending on NextAuth config.
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const initials = [firstName, lastName].map(s => s?.[0]).join('').toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="container mx-auto max-w-4xl px-4 py-10"
    >
      <h1 className="mb-6 text-2xl font-bold">Edit Profile</h1>

      {/* Avatar */}
      <Card className="mb-6">
        <CardContent className="flex items-center gap-5 pt-6">
          <div className="relative">
            <Avatar className="h-20 w-20 text-xl">
              <AvatarImage src={session?.user?.image || ''} />
              <AvatarFallback>{initials || <User />}</AvatarFallback>
            </Avatar>
            <button className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow" type="button">
              <Camera className="h-3.5 w-3.5" />
            </button>
          </div>
          <div>
            <p className="font-semibold">{name || 'Your Name'}</p>
            <p className="text-sm text-muted-foreground">Click the camera icon to change your photo</p>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Core Info */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your basic contact details and demographics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>First Name</Label>
                <Input {...register('firstName')} placeholder="First name" />
                {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Last Name</Label>
                <Input {...register('lastName')} placeholder="Last name" />
                {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-muted-foreground italic">Email Address (Managed by Identity Provider)</Label>
                <Input
                  {...register('email')}
                  type="email"
                  placeholder="you@example.com"
                  disabled
                  className="bg-muted cursor-not-allowed font-medium opacity-80"
                  title="Your email is managed by the identity provider and cannot be changed here."
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Phone Number</Label>
                <Input {...register('phone')} type="tel" placeholder="+91 98765 43210" />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Gender</Label>
                <Input {...register('gender')} placeholder="Male, Female, Other" />
                {errors.gender && <p className="text-xs text-destructive">{errors.gender.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Date of Birth</Label>
                <Input {...register('dateOfBirth')} type="date" />
                {errors.dateOfBirth && <p className="text-xs text-destructive">{errors.dateOfBirth.message}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle>Address Book</CardTitle>
            <CardDescription>Update your permanent residential address</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label>Address Line 1</Label>
              <Input {...register('address')} placeholder="123 Main St, Apt 4B" />
              {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              <div className="space-y-1.5 md:col-span-2">
                <Label>City</Label>
                <Input {...register('city')} placeholder="City" />
                {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>State</Label>
                <Input {...register('state')} placeholder="State/Province" />
                {errors.state && <p className="text-xs text-destructive">{errors.state.message}</p>}
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Pincode / ZIP</Label>
                <Input {...register('pincode')} placeholder="123456" />
                {errors.pincode && <p className="text-xs text-destructive">{errors.pincode.message}</p>}
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Country</Label>
                <Input {...register('country')} placeholder="Country" />
                {errors.country && <p className="text-xs text-destructive">{errors.country.message}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Actions */}
        <div className="flex justify-end gap-4 pb-10">
          <Button type="button" variant="outline" disabled={saving}>Cancel</Button>
          <Button type="submit" disabled={saving} className="min-w-[140px]">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="mr-2 h-4 w-4" /> : null}
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
