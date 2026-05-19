import { apiClient } from '@/core/client';
import { RequestOptions } from '@/core/client/types';

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  thumbnailUrl?: string;
  altText?: string;
  isPrimary: boolean;
  displayOrder: number;
}

/**
 * [HARDEN] Product Images API Service
 */
export const productImagesApi = {
  /**
   * Upload a new product image with cancellation support.
   */
  upload: async (
    productId: string,
    file: File,
    altText: string = '',
    isPrimary: boolean = false,
    options: RequestOptions = {}
  ): Promise<ProductImage> => {
    const formData = new FormData();
    formData.append('productId', productId);
    formData.append('file', file);
    formData.append('altText', altText);
    formData.append('isPrimary', String(isPrimary));

    const { data } = await apiClient.post<ProductImage>('/api/product-images', formData, {
      signal: options.signal,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(options.correlationId ? { 'X-Correlation-ID': options.correlationId } : {}),
      },
    });
    return data;
  },

  /**
   * Delete a product image by its ID.
   */
  delete: async (imageId: string, options: RequestOptions = {}): Promise<void> => {
    await apiClient.delete(`/api/product-images/${imageId}`, {
      signal: options.signal,
    });
  },

  /**
   * Set a specific image as the primary image for a product.
   */
  setPrimary: async (productId: string, imageId: string, options: RequestOptions = {}): Promise<void> => {
    await apiClient.put(`/api/product-images/product/${productId}/primary/${imageId}`, null, {
      signal: options.signal,
    });
  },

  /**
   * Update image metadata (e.g., alt text).
   */
  updateMetadata: async (
    imageId: string,
    metadata: { altText?: string; displayOrder?: number },
    options: RequestOptions = {}
  ): Promise<ProductImage> => {
    const { data } = await apiClient.put<ProductImage>(
      `/api/product-images/${imageId}`,
      metadata,
      { signal: options.signal }
    );
    return data;
  },
};

export default productImagesApi;
