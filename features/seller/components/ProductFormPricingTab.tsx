'use client';

import React, { useMemo } from 'react';
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
import { IndianRupee } from 'lucide-react';

interface ProductFormPricingTabProps {
  form: UseFormReturn<ProductFormData>;
}

export function ProductFormPricingTab({ form }: ProductFormPricingTabProps) {
  const {
    register,
    control,
    watch,
    formState: { errors },
  } = form;

  const watchSellingPrice = watch('sellingPrice') || 0;
  const watchDiscountType = watch('discountType') || 'NONE';
  const watchDiscountValue = watch('discountValue') || 0;
  const watchTaxPercentage = watch('taxPercentage') || 18;

  const breakdown = useMemo(() => {
    let finalSellingPrice = watchSellingPrice;
    if (watchDiscountType === 'PERCENTAGE') {
      finalSellingPrice = watchSellingPrice - (watchSellingPrice * watchDiscountValue) / 100;
    } else if (watchDiscountType === 'FLAT') {
      finalSellingPrice = watchSellingPrice - watchDiscountValue;
    }
    finalSellingPrice = Math.max(0, finalSellingPrice);

    const gstAmount = (finalSellingPrice * watchTaxPercentage) / 100;
    const finalPriceWithGST = finalSellingPrice + gstAmount;

    return {
      finalSellingPrice,
      gstAmount,
      finalPriceWithGST,
    };
  }, [watchSellingPrice, watchDiscountType, watchDiscountValue, watchTaxPercentage]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="mrp">Regular Price / MRP (INR) *</Label>
          <div className="relative mt-1">
            <span className="text-muted-foreground absolute inset-y-0 left-0 flex items-center pl-3">
              <IndianRupee className="h-4 w-4" />
            </span>
            <Input
              id="mrp"
              type="number"
              className="pl-8"
              step="0.01"
              {...register('mrp', { valueAsNumber: true })}
            />
          </div>
          {errors.mrp && <p className="mt-1 text-xs text-red-500">{errors.mrp.message}</p>}
        </div>

        <div>
          <Label htmlFor="sellingPrice">Selling Price (INR) *</Label>
          <div className="relative mt-1">
            <span className="text-muted-foreground absolute inset-y-0 left-0 flex items-center pl-3">
              <IndianRupee className="h-4 w-4" />
            </span>
            <Input
              id="sellingPrice"
              type="number"
              className="pl-8"
              step="0.01"
              {...register('sellingPrice', { valueAsNumber: true })}
            />
          </div>
          {errors.sellingPrice && (
            <p className="mt-1 text-xs text-red-500">{errors.sellingPrice.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <Label>Discount Type</Label>
          <Controller
            name="discountType"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">No Discount</SelectItem>
                  <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                  <SelectItem value="FLAT">Flat Amount (INR)</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {watchDiscountType !== 'NONE' && (
          <div>
            <Label htmlFor="discountValue">Discount Value *</Label>
            <Input
              id="discountValue"
              type="number"
              className="mt-1"
              step="0.01"
              {...register('discountValue', { valueAsNumber: true })}
            />
            {errors.discountValue && (
              <p className="mt-1 text-xs text-red-500">{errors.discountValue.message}</p>
            )}
          </div>
        )}

        <div>
          <Label htmlFor="taxPercentage">GST Rate (%)</Label>
          <Input
            id="taxPercentage"
            type="number"
            className="mt-1"
            {...register('taxPercentage', { valueAsNumber: true })}
          />
        </div>
      </div>

      <div className="bg-muted/30 mt-4 space-y-2 rounded-lg border border-dashed p-4 text-sm">
        <p className="font-semibold">Calculated Summary Breakdowns:</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <span>Final Price (Excl. GST):</span>
          <span className="font-bold">₹{breakdown.finalSellingPrice.toFixed(2)}</span>
          <span>GST Amount:</span>
          <span>₹{breakdown.gstAmount.toFixed(2)}</span>
          <span className="text-sm font-semibold">Total Customer Price (Incl. GST):</span>
          <span className="text-sm font-bold text-blue-600">
            ₹{breakdown.finalPriceWithGST.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
