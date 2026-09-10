'use client';

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { ProductFormData } from '@/domains/catalog/contracts/product-form.schema';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/atoms/tabs';
import { Button } from '@/shared/ui/atoms/button';
import { Card, CardContent } from '@/shared/ui/atoms/card';
import { ProductFormBasicTab } from './ProductFormBasicTab';
import { ProductFormDetailsTab } from './ProductFormDetailsTab';
import { ProductFormPricingTab } from './ProductFormPricingTab';
import { ProductFormInventoryTab } from './ProductFormInventoryTab';
import { ProductFormAdvancedTab } from './ProductFormAdvancedTab';
import { ProductMediaManager } from './ProductMediaManager';
import {
  Package,
  List,
  DollarSign,
  Warehouse,
  Settings,
  ImageIcon,
  Loader2,
  Save,
} from 'lucide-react';

interface ProductFormShellProps {
  form: UseFormReturn<ProductFormData>;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  catalog: {
    categoryList: any[];
    brandList: any[];
  };
  media: {
    imageFiles: File[];
    setImageFiles: (files: File[]) => void;
    existingImages?: any[];
    deleteExistingImage?: (id: number) => Promise<void>;
  };
  submit: {
    onSubmit: (data: ProductFormData) => Promise<void>;
    handleInvalidSubmit: (errors: any) => void;
    isSubmitting: boolean;
  };
  mode: 'create' | 'edit';
}

export function ProductFormShell({
  form,
  activeTab,
  setActiveTab,
  catalog,
  media,
  submit,
  mode,
}: ProductFormShellProps) {
  const { handleSubmit } = form;

  return (
    <form onSubmit={handleSubmit(submit.onSubmit, submit.handleInvalidSubmit)}>
      <div className="w-full space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 bg-slate-100/50 p-1 dark:bg-zinc-900/50">
            <TabsTrigger value="basic" className="text-xs sm:text-sm">
              <Package className="mr-1 h-4 w-4" /> Basic
            </TabsTrigger>
            <TabsTrigger value="details" className="text-xs sm:text-sm">
              <List className="mr-1 h-4 w-4" /> Details
            </TabsTrigger>
            <TabsTrigger value="pricing" className="text-xs sm:text-sm">
              <DollarSign className="mr-1 h-4 w-4" /> Pricing
            </TabsTrigger>
            <TabsTrigger value="inventory" className="text-xs sm:text-sm">
              <Warehouse className="mr-1 h-4 w-4" /> Inventory
            </TabsTrigger>
            <TabsTrigger value="advanced" className="text-xs sm:text-sm">
              <Settings className="mr-1 h-4 w-4" /> Advanced
            </TabsTrigger>
            <TabsTrigger value="media" className="text-xs sm:text-sm">
              <ImageIcon className="mr-1 h-4 w-4" /> Media
            </TabsTrigger>
          </TabsList>

          <Card className="mt-4">
            <CardContent className="pt-6">
              <TabsContent value="basic" className="m-0">
                <ProductFormBasicTab
                  form={form}
                  categoryList={catalog.categoryList}
                  brandList={catalog.brandList}
                />
              </TabsContent>

              <TabsContent value="details" className="m-0">
                <ProductFormDetailsTab form={form} />
              </TabsContent>

              <TabsContent value="pricing" className="m-0">
                <ProductFormPricingTab form={form} />
              </TabsContent>

              <TabsContent value="inventory" className="m-0">
                <ProductFormInventoryTab form={form} />
              </TabsContent>

              <TabsContent value="advanced" className="m-0">
                <ProductFormAdvancedTab form={form} />
              </TabsContent>

              <TabsContent value="media" className="m-0">
                <ProductMediaManager
                  imageFiles={media.imageFiles}
                  setImageFiles={media.setImageFiles}
                  existingImages={media.existingImages}
                  deleteExistingImage={media.deleteExistingImage}
                />
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>

        <div className="flex justify-end gap-4">
          <Button type="submit" disabled={submit.isSubmitting} className="flex items-center gap-2">
            {submit.isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {mode === 'create' ? 'Create Product' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </form>
  );
}
