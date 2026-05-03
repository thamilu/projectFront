import { apiClient } from '@/lib/axios';

export interface ProductImage {
  id: string;
  productId: string;
  cloudinaryUrl: string;
  thumbnailUrl: string;
  altText: string;
  displayOrder: number;
  isPrimary: boolean;
  width: number;
  height: number;
}

export const productImagesApi = {
  async upload(
    productId: string,
    file: File,
    altText?: string,
    isPrimary = false
  ): Promise<ProductImage> {
    const formData = new FormData();
    formData.append('productId', productId);
    formData.append('file', file);
    if (altText) formData.append('altText', altText);
    formData.append('isPrimary', String(isPrimary));

    // apiClient handles Authorization automatically via interceptors
    const response = await apiClient.post<ProductImage>('/api/product-images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  async getForProduct(productId: string): Promise<ProductImage[]> {
    const response = await apiClient.get<ProductImage[]>(`/api/product-images/product/${productId}`);
    return response.data;
  },

  async delete(imageId: string): Promise<void> {
    await apiClient.delete(`/api/product-images/${imageId}`);
  },

  async setPrimary(productId: string, imageId: string): Promise<void> {
    await apiClient.put(`/api/product-images/product/${productId}/primary/${imageId}`);
  },
};
