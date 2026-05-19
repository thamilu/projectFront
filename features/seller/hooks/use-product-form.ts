'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ProductFormData } from '@/domains/catalog/contracts/product.schema';
import { toast } from 'sonner';
import { logger } from '@/core/telemetry/logger';
import { apiClient } from '@/core/client';

interface AddProductResponse {
  success: boolean;
  message: string;
  product: Record<string, unknown>;
}

interface AddProductError {
  error: string;
  details?: Array<{ field: string; message: string }>;
}

async function addProduct(data: ProductFormData): Promise<AddProductResponse> {
  // apiClient automatically handles NextAuth session attachment via interceptors
  const response = await apiClient.post<AddProductResponse>('/api/v1/seller/products', data);
  return response.data;
}

export function useAddProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addProduct,
    onSuccess: (data) => {
      // Invalidate and refetch products list
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });

      toast.success('Product Added', {
        description: data.message || 'Your product has been successfully added.',
      });
    },
    onError: (error: unknown) => {
      logger.error('Failed to add product:', { error });

      const errRec = error as Record<string, unknown> | undefined;
      // Backend might return field errors under `details` or `fieldErrors`
      const details = (errRec?.details || errRec?.fieldErrors) as Array<Record<string, unknown>> | undefined;

      // If there are field-specific errors, we let the component handle them via the mutate onError callback.
      // We only show a toast if there are no specific field errors.
      if (!details || details.length === 0) {
        const desc = (errRec?.message as string) || (errRec?.error as string) || 'An unexpected error occurred. Please try again.';
        toast.error('Failed to add product', { description: desc });
      }
    },
  });
}
