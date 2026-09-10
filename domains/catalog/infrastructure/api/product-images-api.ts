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

    const { data: resp } = await apiClient.post<any>('/api/v1/productImages', formData, {
      signal: options.signal,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(options.correlationId ? { 'X-Correlation-ID': options.correlationId } : {}),
      },
    });
    return resp?.data ?? resp;
  },

  /**
   * Delete a product image by its ID.
   */
  delete: async (imageId: string, options: RequestOptions = {}): Promise<void> => {
    const { data: resp } = await apiClient.delete<any>(`/api/v1/productImages/${imageId}`, {
      signal: options.signal,
      headers: options.correlationId ? { 'X-Correlation-ID': options.correlationId } : undefined,
    });
    return resp?.data ?? resp;
  },

  /**
   * Set a specific image as the primary image for a product.
   */
  setPrimary: async (
    productId: string,
    imageId: string,
    options: RequestOptions = {}
  ): Promise<void> => {
    const { data: resp } = await apiClient.put<any>(
      `/api/v1/productImages/product/${productId}/primary/${imageId}`,
      null,
      {
        signal: options.signal,
        headers: options.correlationId ? { 'X-Correlation-ID': options.correlationId } : undefined,
      }
    );
    return resp?.data ?? resp;
  },

  /**
   * Update image metadata (e.g., alt text).
   */
  updateMetadata: async (
    imageId: string,
    metadata: { productId?: string; imageUrl?: string; altText?: string; displayOrder?: number },
    options: RequestOptions = {}
  ): Promise<ProductImage> => {
    const { data: resp } = await apiClient.put<any>(`/api/v1/productImages/${imageId}`, metadata, {
      signal: options.signal,
      headers: options.correlationId ? { 'X-Correlation-ID': options.correlationId } : undefined,
    });
    return resp?.data ?? resp;
  },
};

export default productImagesApi;
