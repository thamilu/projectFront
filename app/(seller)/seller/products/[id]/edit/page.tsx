'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProductFormController } from '@/features/seller/hooks/use-product-form-controller';
import { ProductFormShell } from '@/features/seller/components/ProductFormShell';
import { Button } from '@/shared/ui/atoms/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { APP_ROUTES } from '@/shared/routes';

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();

  const controller = useProductFormController('edit', id);

  if (controller.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-blue-600" />
          <p className="text-muted-foreground">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (controller.productQueryError) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="bg-card max-w-md rounded-lg border p-6 text-center shadow-sm">
          <h2 className="mb-2 text-2xl font-bold text-red-600">Product Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The product you are trying to edit does not exist or you do not have permission to view
            it.
          </p>
          <Button onClick={() => router.push(APP_ROUTES.SELLER.PRODUCTS)} className="w-full">
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Products
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Product</h1>
          <p className="text-muted-foreground mt-1">Modify your store catalog listing details</p>
        </div>
      </div>

      <ProductFormShell
        mode="edit"
        form={controller.form}
        activeTab={controller.activeTab}
        setActiveTab={controller.setActiveTab}
        catalog={controller.catalog}
        media={controller.media}
        submit={controller.submit}
      />
    </div>
  );
}
