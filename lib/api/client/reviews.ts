/**
 * Reviews API Service
 */

import { apiClient } from '../axios';
import type { ApiResponse } from '@/types';

const REVIEWS_BASE = '/api/reviews';

export interface ReviewDTO {
  id: number;
  productId: number;
  userId: number;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateReviewRequest {
  productId: number;
  rating: number;
  comment: string;
}

export const reviewsApi = {
  getByProduct: async (productId: number): Promise<ReviewDTO[]> => {
    const response = await apiClient.get<ApiResponse<ReviewDTO[]>>(
      `${REVIEWS_BASE}/product/${productId}`
    );
    return response.data.data!;
  },

  getMyReviews: async (): Promise<ReviewDTO[]> => {
    const response = await apiClient.get<ApiResponse<ReviewDTO[]>>(
      `${REVIEWS_BASE}/my-reviews`
    );
    return response.data.data!;
  },

  create: async (data: CreateReviewRequest): Promise<ReviewDTO> => {
    const response = await apiClient.post<ApiResponse<ReviewDTO>>(REVIEWS_BASE, data);
    return response.data.data!;
  },

  update: async (id: number, data: Partial<CreateReviewRequest>): Promise<ReviewDTO> => {
    const response = await apiClient.put<ApiResponse<ReviewDTO>>(`${REVIEWS_BASE}/${id}`, data);
    return response.data.data!;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${REVIEWS_BASE}/${id}`);
  },
};
