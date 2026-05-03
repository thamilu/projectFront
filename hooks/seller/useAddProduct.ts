'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ProductFormData } from '@/lib/validations/product';
import { toast } from 'sonner';
import { logger } from '@/lib/observability/logger';
import { authenticatedFetch } from '@/lib/utils/fetch-utils';
import { handleError, getUserFriendlyMessage } from '@/lib/utils/error-utils';
import { tokenStorage } from '@/lib/axios';

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
  try {
    // Use centralized token storage instead of relying on a global variable
    const token = typeof window !== 'undefined' ? tokenStorage.getAccessToken() : null;

    const result = await authenticatedFetch('/api/seller/products', {
      method: 'POST',
      accessToken: token ?? undefined,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    return result as AddProductResponse;
  } catch (err) {
    handleError(err, 'Add product failed');
    throw err;
  }
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
      const details = errRec?.details as Array<Record<string, unknown>> | undefined;

      if (details && details.length > 0) {
        details.forEach((detail) => {
          const field = detail.field as string | undefined;
          const message = detail.message as string | undefined;
          if (field && message) toast.error(`${field}: ${message}`);
        });
      } else {
        const desc = (errRec?.error as string) || 'An unexpected error occurred. Please try again.';
        toast.error('Failed to add product', { description: desc });
      }
    },
  });
}
