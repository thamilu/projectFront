'use client';

import React from 'react';
import { UseFormReturn, Controller } from 'react-hook-form';
import { ProductFormData } from '@/domains/catalog/contracts/product-form.schema';
import { Label } from '@/shared/ui/atoms/label';
import { Input } from '@/shared/ui/atoms/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/shared/ui/atoms/select';
import { Checkbox } from '@/shared/ui/atoms/checkbox';

interface ProductFormAdvancedTabProps {
  form: UseFormReturn<ProductFormData>;
}

export function ProductFormAdvancedTab({ form }: ProductFormAdvancedTabProps) {
  const { register, control } = form;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label>Publish Status</Label>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft (Hidden)</SelectItem>
                  <SelectItem value="PUBLISHED">Published (Visible)</SelectItem>
                  <SelectItem value="INACTIVE">Inactive (Archived)</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="flex items-center space-x-2 pt-6">
          <Controller
            name="featured"
            control={control}
            render={({ field }) => (
              <Checkbox
                id="featuredProd"
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(Boolean(checked))}
              />
            )}
          />
          <Label htmlFor="featuredProd" className="cursor-pointer">
            Featured Product (Promoted in home sections)
          </Label>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <Label htmlFor="hsnCode">HSN / SAC Code</Label>
          <Input id="hsnCode" className="mt-1" {...register('hsnCode')} />
        </div>

        <div>
          <Label htmlFor="countryOfOrigin">Country of Origin</Label>
          <Input id="countryOfOrigin" className="mt-1" {...register('countryOfOrigin')} />
        </div>

        <div>
          <Label htmlFor="manufacturer">Manufacturer</Label>
          <Input id="manufacturer" className="mt-1" {...register('manufacturer')} />
        </div>
      </div>

      <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="seoTitle">SEO Meta Title</Label>
          <Input
            id="seoTitle"
            className="mt-1"
            placeholder="Max 60 chars"
            {...register('seoTitle')}
          />
        </div>

        <div>
          <Label htmlFor="seoDescription">SEO Meta Description</Label>
          <Input
            id="seoDescription"
            className="mt-1"
            placeholder="Max 160 chars"
            {...register('seoDescription')}
          />
        </div>
      </div>
    </div>
  );
}
