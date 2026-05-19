'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Package, RotateCcw, Loader2 } from 'lucide-react';
import { Button } from '@/shared/ui/atoms/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/atoms/card';
import { Label } from '@/shared/ui/atoms/label';
import { Textarea } from '@/shared/ui/atoms/textarea';
import { RadioGroup, RadioGroupItem } from '@/shared/ui/atoms/radio-group';
import { toast } from 'sonner';
import { APP_ROUTES } from '@/shared/constants/routes/app-routes';

const RETURN_REASONS = [
  'Item is defective / not working',
  'Wrong item received',
  'Item not as described',
  'Size / fit issue',
  'Changed my mind',
  'Other',
];

const returnSchema = z.object({
  reason: z.string().min(1, 'Please select a reason'),
  details: z.string().min(10, 'Please provide at least 10 characters of detail').optional().or(z.literal('')),
});

type ReturnValues = z.infer<typeof returnSchema>;

export default function OrderReturnPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ReturnValues>({
    resolver: zodResolver(returnSchema),
  });

  const selectedReason = watch('reason');

  const onSubmit = async (data: ReturnValues) => {
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1200));
    setSubmitting(false);
    toast.success('Return request submitted! You\'ll hear from us within 24 hours.');
    router.push(APP_ROUTES.ORDER_DETAIL(id));
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-1 text-2xl font-bold">Return / Refund Request</h1>
      <p className="mb-6 text-sm text-muted-foreground">Order ID: #{id}</p>

      <Card className="mb-5 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
        <CardContent className="flex items-center gap-3 pt-5">
          <RotateCcw className="h-5 w-5 text-orange-600" />
          <p className="text-sm text-orange-800 dark:text-orange-300">
            Returns are accepted within 30 days of delivery. Refunds are processed in 5–7 business days.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Why are you returning?</CardTitle>
          <CardDescription>Please select a reason and provide details to help us process your request faster.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <RadioGroup value={selectedReason} onValueChange={v => setValue('reason', v)}>
                <div className="space-y-2">
                  {RETURN_REASONS.map(reason => (
                    <label key={reason} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${selectedReason === reason ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}>
                      <RadioGroupItem value={reason} />
                      <span className="text-sm">{reason}</span>
                    </label>
                  ))}
                </div>
              </RadioGroup>
              {errors.reason && <p className="mt-2 text-xs text-destructive">{errors.reason.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Additional Details (optional)</Label>
              <Textarea
                {...register('details')}
                placeholder="Describe the issue in more detail…"
                rows={4}
              />
              {errors.details && <p className="text-xs text-destructive">{errors.details.message}</p>}
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {submitting ? 'Submitting…' : 'Submit Return Request'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
