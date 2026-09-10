'use client';

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { ProductFormData } from '@/domains/catalog/contracts/product-form.schema';
import { Label } from '@/shared/ui/atoms/label';
import { Input } from '@/shared/ui/atoms/input';

interface ProductFormDetailsTabProps {
  form: UseFormReturn<ProductFormData>;
}

export function ProductFormDetailsTab({ form }: ProductFormDetailsTabProps) {
  const { register } = form;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="attrBrand">Attribute Brand Name</Label>
          <Input id="attrBrand" placeholder="e.g., Apple" {...register('attributes.brand')} />
        </div>

        <div>
          <Label htmlFor="attrType">Product Type / Sub-Type</Label>
          <Input id="attrType" placeholder="e.g., SMARTPHONE" {...register('attributes.type')} />
        </div>

        <div>
          <Label htmlFor="attrSizes">Available Sizes</Label>
          <Input
            id="attrSizes"
            placeholder="e.g., S, M, L, XL or 128GB, 256GB"
            {...register('attributes.availableSizes')}
          />
        </div>

        <div>
          <Label htmlFor="attrColors">Available Colors</Label>
          <Input
            id="attrColors"
            placeholder="e.g., Black, Blue, Silver"
            {...register('attributes.availableColors')}
          />
        </div>

        <div>
          <Label htmlFor="attrStorage">Storage Capacity</Label>
          <Input id="attrStorage" placeholder="e.g., 256 GB" {...register('attributes.storage')} />
        </div>
      </div>
    </div>
  );
}
