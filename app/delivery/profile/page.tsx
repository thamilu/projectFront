'use client';

import { useState } from 'react';
import { User, Bike, Phone, MapPin, CheckCircle2, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function DeliveryProfilePage() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const { register, handleSubmit } = useForm({
    defaultValues: { name: 'Ravi Kumar', phone: '9876543210', city: 'Bangalore', pincode: '560001' },
  });

  const onSubmit = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    setSaving(false);
    setSaved(true);
    toast.success('Profile updated!');
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">Delivery Agent Profile</h1>

      <Card className="mb-5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-base">Personal Details</CardTitle>
              <CardDescription>Name and contact information</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Full Name</Label><Input {...register('name')} /></div>
              <div className="space-y-1.5"><Label>Phone</Label><Input {...register('phone')} /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>City</Label><Input {...register('city')} /></div>
              <div className="space-y-1.5"><Label>Pincode</Label><Input {...register('pincode')} /></div>
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="mr-2 h-4 w-4" /> : null}
              {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900">
              <Bike className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <CardTitle className="text-base">Vehicle Information</CardTitle>
              <CardDescription>Your delivery vehicle details</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Vehicle Type</Label>
            <Select defaultValue="bike">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bike">Motorcycle / Scooter</SelectItem>
                <SelectItem value="bicycle">Bicycle</SelectItem>
                <SelectItem value="auto">Auto / 3-Wheeler</SelectItem>
                <SelectItem value="van">Van / Mini Truck</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>Registration Number</Label><Input placeholder="KA01AB1234" defaultValue="KA01AB1234" /></div>
            <div className="space-y-1.5"><Label>Driving License No.</Label><Input placeholder="KA0120220001234" defaultValue="KA0120220001234" /></div>
          </div>
          <Button onClick={() => toast.success('Vehicle info updated!')}>Save Vehicle Info</Button>
        </CardContent>
      </Card>
    </div>
  );
}
