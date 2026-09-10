/**
 * Reviews API
 * @module features/reviews/api/reviews-api
 */

import { apiClient } from '@/core/client';
import { API_ENDPOINTS } from '@/shared/constants/api/endpoints';
import { toPageResponse } from '@/shared/utils/api-helpers';
import type { PageRequest, PageResponse } from '@/shared/types';
import type {
  CreateReviewDto,
  MyReview,
  Review,
  UpdateReviewDto,
} from '../types/review.types';

const DEFAULT_REVIEWS_PAGE: PageRequest = { page: 0, size: 10 };

export const reviewsApi = {
  /**
   * `toPageResponse` normalizes whichever shape the backend returns — a raw
   * array, `{ content: [...] }`, or the `{ data: { content: [...] } }`
   * wrapper used elsewhere in this codebase — into a consistent
   * `PageResponse<Review>` (content + totalElements/totalPages/last), the
   * same contract every other paginated list in this app already uses.
   */
  getReviews: async (
    productId: string,
    params: PageRequest = DEFAULT_REVIEWS_PAGE
  ): Promise<PageResponse<Review>> => {
    const { data: resp } = await apiClient.get<any>(API_ENDPOINTS.PRODUCTS.REVIEWS(productId), {
      params,
    });
    return toPageResponse<Review>(resp, params);
  },

  /**
   * Reviews authored by the signed-in customer.
   *
   * Normalised through `toPageResponse` for the same reason `getReviews` is:
   * the backend's envelope shape varies by endpoint, and every paginated list
   * in this app consumes one consistent contract.
   */
  getMyReviews: async (params: PageRequest = DEFAULT_REVIEWS_PAGE): Promise<PageResponse<MyReview>> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: resp } = await apiClient.get<any>(API_ENDPOINTS.USERS.REVIEWS, { params });
    return toPageResponse<MyReview>(resp, params);
  },

  createReview: async (review: CreateReviewDto) => {
    return apiClient.post(API_ENDPOINTS.REVIEWS.CREATE, review);
  },

  updateReview: async (reviewId: string, review: UpdateReviewDto) => {
    return apiClient.put(API_ENDPOINTS.REVIEWS.UPDATE(reviewId), review);
  },

  deleteReview: async (reviewId: string) => {
    return apiClient.delete(API_ENDPOINTS.REVIEWS.DELETE(reviewId));
  },

  markHelpful: async (reviewId: string) => {
    return apiClient.post(API_ENDPOINTS.REVIEWS.HELPFUL(reviewId));
  },
};
