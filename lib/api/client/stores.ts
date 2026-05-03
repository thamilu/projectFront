import { apiClient } from '../axios';
import type { StoreDTO, PaginatedResponse, ApiResponse } from '@/types';

const STORES_BASE = '/api/v1/stores';

export interface StoreCreateRequest {
  storeName: string;
  description: string;
  logoUrl?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export const storesApi = {
  getAll: async (params?: {
    page?: number;
    size?: number;
  }): Promise<PaginatedResponse<StoreDTO>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<StoreDTO>>>(STORES_BASE, {
      params,
    });
    return response.data.data!;
  },

  getById: async (id: number | string): Promise<StoreDTO> => {
    const response = await apiClient.get<ApiResponse<StoreDTO>>(`${STORES_BASE}/${id}`);
    return response.data.data!;
  },

  search: async (
    keyword: string,
    params?: { page?: number; size?: number }
  ): Promise<PaginatedResponse<StoreDTO>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<StoreDTO>>>(
      `${STORES_BASE}/search`,
      {
        params: { ...params, keyword },
      }
    );
    return response.data.data!;
  },

  create: async (data: StoreCreateRequest): Promise<StoreDTO> => {
    const response = await apiClient.post<ApiResponse<StoreDTO>>(STORES_BASE, data);
    return response.data.data!;
  },

  update: async (id: number | string, data: Partial<StoreCreateRequest>): Promise<StoreDTO> => {
    const response = await apiClient.put<ApiResponse<StoreDTO>>(`${STORES_BASE}/${id}`, data);
    return response.data.data!;
  },

  delete: async (id: number | string): Promise<void> => {
    await apiClient.delete(`${STORES_BASE}/${id}`);
  },
};
