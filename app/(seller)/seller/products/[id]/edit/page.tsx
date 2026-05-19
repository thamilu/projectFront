'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/shared/ui/atoms/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/atoms/card';
import { Input } from '@/shared/ui/atoms/input';
import { Label } from '@/shared/ui/atoms/label';
import { Textarea } from '@/shared/ui/atoms/textarea';
import { Switch } from '@/shared/ui/atoms/switch';
import { toast } from 'sonner';
import { APP_ROUTES } from '@/shared/constants/routes/app-routes';

const schema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  price: z.coerce.number().positive('Price must be positive'),
  discountedPrice: z.coerce.number().min(0).optional(),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  stockQuantity: z.coerce.number().int().min(0),
  active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as unknown as Resolver<FormValues>,
    defaultValues: { active: true },
  });

  useEffect(() => {
    if (!id || !session?.accessToken) return;
    fetch(`/api/v1/products/${id}`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    })
      .then((r) => r.json())
      .then((d) => {
        const p = d?.data ?? d;
        reset({
          name: p.name,
          price: p.price,
          discountedPrice: p.discountedPrice ?? undefined,
          description: p.description ?? '',
          stockQuantity: p.stockQuantity ?? 0,
          active: p.active ?? true,
        });
      })
      .catch(() => toast.error('Failed to load product'))
      .finally(() => setLoading(false));
  }, [id, session, reset]);

  const onSubmit = async (data: FormValues) => {
    try {
      const res = await fetch(`/api/v1/products/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Update failed');
      toast.success('Product updated successfully!');
      router.push(APP_ROUTES.SELLER.PRODUCTS);
    } catch {
      toast.error('Failed to update product. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={APP_ROUTES.SELLER.PRODUCTS}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Products
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Edit Product</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Update the core product details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name*</Label>
              <Input id="name" {...register('name')} placeholder="Enter product name" />
              {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description*</Label>
              <Textarea
                id="description"
                {...register('description')}
                rows={5}
                placeholder="Describe your product"
              />
              {errors.description && (
                <p className="text-destructive text-sm">{errors.description.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing & Inventory</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (₹)*</Label>
                <Input id="price" type="number" step="0.01" {...register('price')} />
                {errors.price && <p className="text-destructive text-sm">{errors.price.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="discountedPrice">Discounted Price (₹)</Label>
                <Input
                  id="discountedPrice"
                  type="number"
                  step="0.01"
                  {...register('discountedPrice')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stockQuantity">Stock Quantity*</Label>
              <Input id="stockQuantity" type="number" {...register('stockQuantity')} />
              {errors.stockQuantity && (
                <p className="text-destructive text-sm">{errors.stockQuantity.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Visibility</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Controller
                name="active"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="active"
                    checked={field.value}
                    onChange={(e) => field.onChange((e.target as HTMLInputElement).checked)}
                  />
                )}
              />
              <Label htmlFor="active">Product is active (visible to customers)</Label>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href={APP_ROUTES.SELLER.PRODUCTS}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
