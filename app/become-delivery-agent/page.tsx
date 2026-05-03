'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Loader2, Truck, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { safeFetch } from '@/lib/utils/fetch-utils';
import { handleError, getUserFriendlyMessage } from '@/lib/utils/error-utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { APP_ROUTES } from '@/constants/routes/app-routes';

// Zod Schema
const deliveryOnboardingSchema = z.object({
  vehicleType: z.enum(['BIKE', 'SCOOTER', 'TRUCK', 'VAN']),
  licenseNumber: z.string().min(5, 'License number is too short'),
  zone: z.string().min(3, 'Please specify your preferred delivery zone (City/Area)'),
});

type DeliveryOnboardingFormData = z.infer<typeof deliveryOnboardingSchema>;

export default function BecomeDeliveryAgentPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<DeliveryOnboardingFormData>({
    resolver: zodResolver(deliveryOnboardingSchema),
    defaultValues: {
      zone: '',
      licenseNumber: '',
    },
  });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = form;

  const onSubmit = async (data: DeliveryOnboardingFormData) => {
    setIsSubmitting(true);
    try {
      await safeFetch('/api/onboarding/delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      setIsSuccess(true);
      toast.success('Application Submitted!');
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-20">
        <Card className="border-green-200 bg-green-50 text-center dark:bg-green-900/10">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 p-3 dark:bg-green-900">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl text-green-800 dark:text-green-300">
              Application Submitted
            </CardTitle>
            <CardDescription className="text-green-700 dark:text-green-400">
              Ready to hit the road?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Your application to become a Delivery Agent is <strong>PENDING APPROVAL</strong>. We
              will verify your license details and get back to you.
            </p>
            <Button onClick={() => router.push(APP_ROUTES.CUSTOMER.DASHBOARD)} className="w-full">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold">Become a Delivery Partner</h1>
        <p className="text-muted-foreground">
          Join our logistics network and earn by delivering smiles.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Delivery Agent Application</CardTitle>
          <CardDescription>Provide your vehicle and license details.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Vehicle Type */}
            <div className="space-y-2">
              <Label htmlFor="vehicleType">Vehicle Type</Label>
              <Controller
                name="vehicleType"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BIKE">Motorbike</SelectItem>
                      <SelectItem value="SCOOTER">Scooter</SelectItem>
                      <SelectItem value="VAN">Delivery Van</SelectItem>
                      <SelectItem value="TRUCK">Truck</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.vehicleType && (
                <p className="text-destructive text-sm">{errors.vehicleType.message}</p>
              )}
            </div>

            {/* License Number */}
            <div className="space-y-2">
              <Label htmlFor="licenseNumber">Driving License Number</Label>
              <Input
                id="licenseNumber"
                placeholder="DL-XXXXXXXXXXXX"
                {...register('licenseNumber')}
              />
              {errors.licenseNumber && (
                <p className="text-destructive text-sm">{errors.licenseNumber.message}</p>
              )}
            </div>

            {/* Zone */}
            <div className="space-y-2">
              <Label htmlFor="zone">Preferred Zone (City/Area)</Label>
              <Input id="zone" placeholder="e.g. South Mumbai" {...register('zone')} />
              {errors.zone && <p className="text-destructive text-sm">{errors.zone.message}</p>}
            </div>

            <Alert variant="default">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Verification Required</AlertTitle>
              <AlertDescription>
                We will perform a background check on your driving license. By submitting, you
                consent to this verification.
              </AlertDescription>
            </Alert>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Application'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="mt-8 text-center">
        <Button variant="ghost" onClick={() => router.push(APP_ROUTES.CUSTOMER.DASHBOARD)}>
          Cancel and Return to Dashboard
        </Button>
      </div>
    </div>
  );
}
