'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useProductFormController } from '@/features/seller/hooks/use-product-form-controller';
import { ProductFormShell } from '@/features/seller/components/ProductFormShell';
import { Button } from '@/shared/ui/atoms/button';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function CreateProductPage() {
  const router = useRouter();
  const controller = useProductFormController('create');

  if (controller.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-blue-600" />
          <p className="text-muted-foreground">Loading product creation resources...</p>
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
          <h1 className="text-3xl font-bold">Add New Product</h1>
          <p className="text-muted-foreground mt-1">Publish a new catalog listing details</p>
        </div>
      </div>

      <ProductFormShell
        mode="create"
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
