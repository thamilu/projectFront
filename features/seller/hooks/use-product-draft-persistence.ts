'use client';

import { useEffect, useState } from 'react';
import { UseFormReset } from 'react-hook-form';
import { ProductFormData } from '@/domains/catalog/contracts/product-form.schema';
import { toast } from 'sonner';

const PERSISTENCE_KEY = 'eshop_seller_create_product_form';

export function useProductDraftPersistence(
  reset: UseFormReset<ProductFormData>,
  watchAllFields: ProductFormData
) {
  const [isRestored, setIsRestored] = useState(false);

  // Load persisted data on mount
  useEffect(() => {
    const savedData = localStorage.getItem(PERSISTENCE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          // Sanitize numeric fields to ensure they are real numbers
          const sanitized = {
            ...parsed,
            categoryId: parsed.categoryId ? Number(parsed.categoryId) : undefined,
            subCategoryId: parsed.subCategoryId ? Number(parsed.subCategoryId) : undefined,
            thirdLevelCategoryId: parsed.thirdLevelCategoryId
              ? Number(parsed.thirdLevelCategoryId)
              : undefined,
            fourthLevelCategoryId: parsed.fourthLevelCategoryId
              ? Number(parsed.fourthLevelCategoryId)
              : undefined,
            brandId: parsed.brandId ? Number(parsed.brandId) : undefined,
            sellingPrice: Number(parsed.sellingPrice) || 0,
            mrp: Number(parsed.mrp) || 0,
            discountValue: Number(parsed.discountValue) || 0,
            taxPercentage: Number(parsed.taxPercentage) || 0,
            stockQuantity: Number(parsed.stockQuantity) || 0,
            minOrderQuantity: Number(parsed.minOrderQuantity) || 1,
            maxOrderQuantity: Number(parsed.maxOrderQuantity) || 999,
            lowStockThreshold: Number(parsed.lowStockThreshold) || 5,
          };

          reset(sanitized as any);
          toast.info('Form data restored from your previous session.');
        }
      } catch (e) {
        console.error('Failed to restore form data', e);
      }
    }
    setIsRestored(true);
  }, [reset]);

  // Persist form data on change with a debounce
  useEffect(() => {
    if (!isRestored) return;

    const hasData =
      watchAllFields.name?.trim() ||
      watchAllFields.categoryId ||
      watchAllFields.description?.trim() ||
      watchAllFields.sku?.trim();

    if (!hasData) return;

    const timeoutId = setTimeout(() => {
      localStorage.setItem(PERSISTENCE_KEY, JSON.stringify(watchAllFields));
    }, 1500);

    return () => clearTimeout(timeoutId);
  }, [watchAllFields, isRestored]);

  const clearDraft = () => {
    localStorage.removeItem(PERSISTENCE_KEY);
  };

  return { isRestored, clearDraft };
}
