/**
 * Seller Profile Page
 *
 * Page for sellers to view and edit their profile
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, User } from 'lucide-react';
import { useMyStore, useUpdateStore } from '@/hooks/queries/use-seller';
import { APP_ROUTES } from '@/constants/routes/app-routes';
import { SellerIdentityType } from '@/types';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  sellerProfileUpdateSchema,
  type SellerProfileUpdateFormData,
} from '@/features/seller/schemas';

export default function SellerProfilePage() {
  const router = useRouter();
  const { data: profile, isLoading } = useMyStore();
  const { mutateAsync: updateProfile, isPending: saving } = useUpdateStore();
  const businessTypesText =
    profile?.businessTypes?.length ? profile.businessTypes.join(', ') : '—';

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SellerProfileUpdateFormData>({
    resolver: zodResolver(sellerProfileUpdateSchema),
  });

  // Populate form when profile loads
  useEffect(() => {
    if (profile) {
      reset({
        displayName: profile.displayName,
        businessName: profile.businessName || '',
        taxId: profile.taxId || '',
        description: profile.description || '',
        pan: profile.pan || '',
        aadhaar: profile.aadhar || '',
        bankAccountNumber: profile.bankAccountNumber || '',
        bankIfscCode: profile.bankIfscCode || '',
        businessPan: profile.businessPan || '',
        authorizedSignatory: profile.authorizedSignatory || '',
      });
    }
  }, [profile, reset]);

  // Handle explicitly missing profile
  if (!isLoading && !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Profile Not Found</CardTitle>
            <CardDescription>
              We couldn't find your seller profile. Please complete the onboarding process.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => router.push(APP_ROUTES.SELLER.REGISTER)}>
              Complete Onboarding
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const onSubmit = async (data: SellerProfileUpdateFormData) => {
    try {
      await updateProfile(data);
      toast.success('Profile updated successfully');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('[SellerProfile] Update failed:', error);
      toast.error('Failed to update profile', {
        description: error.message || 'Please try again',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 py-12 dark:from-gray-950 dark:to-gray-900">
      <div className="container mx-auto max-w-3xl px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Seller Profile</h1>
          <p className="text-muted-foreground mt-2">Manage your seller information</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  {profile?.status === 'ACTIVE' ? (
                    <span className="text-green-600">Active Seller</span>
                  ) : (
                    <span className="text-gray-600">Status: {profile?.status}</span>
                  )}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="displayName">
                  Display Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="displayName"
                  placeholder="Store display name"
                  {...register('displayName')}
                />
                {errors.displayName && (
                  <p className="text-sm text-red-500">{errors.displayName.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Aadhaar */}
                <div className="space-y-2">
                  <Label htmlFor="aadhaar">Aadhaar Number</Label>
                  <Input
                    id="aadhaar"
                    placeholder="12 digit Aadhaar number"
                    {...register('aadhaar')}
                  />
                  {errors.aadhaar && (
                    <p className="text-sm text-red-500">{errors.aadhaar.message}</p>
                  )}
                </div>

                {/* PAN */}
                <div className="space-y-2">
                  <Label htmlFor="pan">PAN Number</Label>
                  <Input
                    id="pan"
                    placeholder="Permanent Account Number"
                    className="uppercase"
                    {...register('pan')}
                  />
                  {errors.pan && (
                    <p className="text-sm text-red-500">{errors.pan.message}</p>
                  )}
                </div>
              </div>

              {/* Business Name */}
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name (optional)</Label>
                <Input
                  id="businessName"
                  placeholder="Legal business name"
                  {...register('businessName')}
                />
                {errors.businessName && (
                  <p className="text-sm text-red-500">{errors.businessName.message}</p>
                )}
              </div>



              {/* Tax ID */}
              {profile?.identityType === SellerIdentityType.BUSINESS && (
                <div className="space-y-2">
                  <Label htmlFor="taxId">Tax ID (optional)</Label>
                  <Input
                    id="taxId"
                    placeholder="Tax identification number"
                    {...register('taxId')}
                  />
                  {errors.taxId && <p className="text-sm text-red-500">{errors.taxId.message}</p>}
                </div>
              )}

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Store Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Tell customers about your store..."
                  rows={4}
                  {...register('description')}
                />
                {errors.description && (
                  <p className="text-sm text-red-500">{errors.description.message}</p>
                )}
              </div>

              {/* Bank Details Section */}
              <div className="border-t pt-6">
                <h3 className="mb-4 text-lg font-semibold">Bank Account Details</h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="bankAccountNumber">Account Number</Label>
                    <Input
                      id="bankAccountNumber"
                      placeholder="Enter account number"
                      {...register('bankAccountNumber')}
                    />
                    {errors.bankAccountNumber && (
                      <p className="text-sm text-red-500">{errors.bankAccountNumber.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bankIfscCode">IFSC Code</Label>
                    <Input
                      id="bankIfscCode"
                      placeholder="e.g. SBIN0123456"
                      className="uppercase"
                      {...register('bankIfscCode')}
                    />
                    {errors.bankIfscCode && (
                      <p className="text-sm text-red-500">{errors.bankIfscCode.message}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.push(APP_ROUTES.SELLER.DASHBOARD)}>
                  Back to Dashboard
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Profile Metadata */}
        {profile && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Identity Type:</span>
                <span className="font-medium">{profile.identityType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Business Types:</span>
                <span className="font-medium">{businessTypesText}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Member Since:</span>
                <span className="font-medium">
                  {new Date(profile.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Updated:</span>
                <span className="font-medium">
                  {new Date(profile.updatedAt).toLocaleDateString()}
                </span>
              </div>
              {profile.bankAccountNumber && (
                <div className="flex justify-between border-t pt-2">
                  <span className="text-muted-foreground">Bank Account:</span>
                  <span className="font-medium">
                    {profile.bankAccountNumber.replace(/.(?=.{4})/g, '*')}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
