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

interface ProductFormInventoryTabProps {
  form: UseFormReturn<ProductFormData>;
}

export function ProductFormInventoryTab({ form }: ProductFormInventoryTabProps) {
  const {
    register,
    control,
    formState: { errors },
  } = form;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <Label htmlFor="stockQuantity">Stock Quantity *</Label>
          <Input
            id="stockQuantity"
            type="number"
            {...register('stockQuantity', { valueAsNumber: true })}
          />
          {errors.stockQuantity && (
            <p className="mt-1 text-xs text-red-500">{errors.stockQuantity.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
          <Input
            id="lowStockThreshold"
            type="number"
            {...register('lowStockThreshold', { valueAsNumber: true })}
          />
        </div>

        <div>
          <Label>Stock Status</Label>
          <Controller
            name="stockStatus"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN_STOCK">In Stock</SelectItem>
                  <SelectItem value="OUT_OF_STOCK">Out of Stock</SelectItem>
                  <SelectItem value="PRE_ORDER">Pre-Order</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="weight">Weight</Label>
            <Input
              id="weight"
              type="number"
              step="0.01"
              {...register('weight', { valueAsNumber: true })}
            />
          </div>
          <div>
            <Label>Weight Unit</Label>
            <Controller
              name="weightUnit"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KG">KG</SelectItem>
                    <SelectItem value="G">Gram (g)</SelectItem>
                    <SelectItem value="LB">Pound (lb)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <div className="col-span-3 grid grid-cols-3 gap-2">
            <div>
              <Label htmlFor="length">L</Label>
              <Input
                id="length"
                type="number"
                step="0.1"
                {...register('length', { valueAsNumber: true })}
              />
            </div>
            <div>
              <Label htmlFor="width">W</Label>
              <Input
                id="width"
                type="number"
                step="0.1"
                {...register('width', { valueAsNumber: true })}
              />
            </div>
            <div>
              <Label htmlFor="height">H</Label>
              <Input
                id="height"
                type="number"
                step="0.1"
                {...register('height', { valueAsNumber: true })}
              />
            </div>
          </div>
          <div>
            <Label>Unit</Label>
            <Controller
              name="dimensionUnit"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CM">CM</SelectItem>
                    <SelectItem value="M">M</SelectItem>
                    <SelectItem value="IN">IN</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 pt-2 md:grid-cols-3">
        <div>
          <Label htmlFor="deliveryTime">Delivery Time (Days)</Label>
          <Input
            id="deliveryTime"
            type="number"
            {...register('deliveryTime', { valueAsNumber: true })}
          />
        </div>

        <div className="flex items-center space-x-2 pt-6">
          <Controller
            name="freeShipping"
            control={control}
            render={({ field }) => (
              <Checkbox
                id="freeShipping"
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(Boolean(checked))}
              />
            )}
          />
          <Label htmlFor="freeShipping">Free Shipping</Label>
        </div>

        <div>
          <Label htmlFor="shippingCharges">Shipping Charges (INR)</Label>
          <Input
            id="shippingCharges"
            type="number"
            step="0.01"
            {...register('shippingCharges', { valueAsNumber: true })}
          />
        </div>
      </div>
    </div>
  );
}
