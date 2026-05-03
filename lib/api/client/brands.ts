/**
 * Brands API Service
 */

import { apiClient } from '../axios';
import type { BrandDTO, ApiResponse } from '@/types';

const BRANDS_BASE = '/api/brands';

export interface BrandCreateRequest {
  name: string;
  description?: string;
  logoUrl?: string;
  active?: boolean;
}

export const brandsApi = {
  getAll: async (): Promise<BrandDTO[]> => {
    const response = await apiClient.get<ApiResponse<BrandDTO[]>>(BRANDS_BASE);
    return response.data.data!;
  },

  getById: async (id: number): Promise<BrandDTO> => {
    const response = await apiClient.get<ApiResponse<BrandDTO>>(`${BRANDS_BASE}/${id}`);
    return response.data.data!;
  },

  search: async (keyword: string): Promise<BrandDTO[]> => {
    const response = await apiClient.get<ApiResponse<BrandDTO[]>>(
      `${BRANDS_BASE}/search`,
      { params: { keyword } }
    );
    return response.data.data!;
  },

  create: async (data: BrandCreateRequest): Promise<BrandDTO> => {
    const response = await apiClient.post<ApiResponse<BrandDTO>>(BRANDS_BASE, data);
    return response.data.data!;
  },

  update: async (id: number, data: Partial<BrandCreateRequest>): Promise<BrandDTO> => {
    const response = await apiClient.put<ApiResponse<BrandDTO>>(`${BRANDS_BASE}/${id}`, data);
    return response.data.data!;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BRANDS_BASE}/${id}`);
  },
};
