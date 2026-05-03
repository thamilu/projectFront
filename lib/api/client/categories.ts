/**
 * Categories API Service
 */

import { apiClient } from '../axios';
import type { CategoryDTO, ApiResponse } from '@/types';

const CATEGORIES_BASE = '/api/categories';

export interface CategoryCreateRequest {
  name: string;
  description?: string;
  imageUrl?: string;
  parentCategoryId?: number;
  active?: boolean;
}

export const categoriesApi = {
  getAll: async (): Promise<CategoryDTO[]> => {
    const response = await apiClient.get<ApiResponse<CategoryDTO[]>>(CATEGORIES_BASE);
    return response.data.data!;
  },

  getById: async (id: number): Promise<CategoryDTO> => {
    const response = await apiClient.get<ApiResponse<CategoryDTO>>(`${CATEGORIES_BASE}/${id}`);
    return response.data.data!;
  },

  search: async (keyword: string): Promise<CategoryDTO[]> => {
    const response = await apiClient.get<ApiResponse<CategoryDTO[]>>(
      `${CATEGORIES_BASE}/search`,
      { params: { keyword } }
    );
    return response.data.data!;
  },

  create: async (data: CategoryCreateRequest): Promise<CategoryDTO> => {
    const response = await apiClient.post<ApiResponse<CategoryDTO>>(CATEGORIES_BASE, data);
    return response.data.data!;
  },

  update: async (id: number, data: Partial<CategoryCreateRequest>): Promise<CategoryDTO> => {
    const response = await apiClient.put<ApiResponse<CategoryDTO>>(`${CATEGORIES_BASE}/${id}`, data);
    return response.data.data!;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${CATEGORIES_BASE}/${id}`);
  },
};
