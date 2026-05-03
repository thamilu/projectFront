const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082';

import { safeFetch, authenticatedFetch } from '@/lib/utils/fetch-utils';
import { handleFetchError } from '@/lib/utils/error-utils';
import { tokenStorage } from '@/lib/axios';

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

    // Upload requires multipart/form-data; use native fetch but attach Authorization from tokenStorage
    const token = typeof window !== 'undefined' ? tokenStorage.getAccessToken() : null;

    const response = await fetch(`${API_BASE}/api/product-images`, {
      method: 'POST',
      body: formData,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      credentials: 'include',
    });

    if (!response.ok) throw await handleFetchError(response);
    return response.json();
  },

  async getForProduct(productId: string): Promise<ProductImage[]> {
    return safeFetch(`${API_BASE}/api/product-images/product/${productId}`) as Promise<
      ProductImage[]
    >;
  },

  async delete(imageId: string): Promise<void> {
    const token = typeof window !== 'undefined' ? tokenStorage.getAccessToken() : null;
    const url = `${API_BASE}/api/product-images/${imageId}`;
    await authenticatedFetch<void>(url, { method: 'DELETE', accessToken: token ?? undefined });
  },

  async setPrimary(productId: string, imageId: string): Promise<void> {
    const token = typeof window !== 'undefined' ? tokenStorage.getAccessToken() : null;
    const url = `${API_BASE}/api/product-images/product/${productId}/primary/${imageId}`;
    await authenticatedFetch<void>(url, { method: 'PUT', accessToken: token ?? undefined });
  },
};
