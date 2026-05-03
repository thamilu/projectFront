/**
 * Coupons API Service
 */

import { apiClient } from '../axios';
import type { ApiResponse } from '@/types';

const COUPONS_BASE = '/api/coupons';

export interface CouponDTO {
  id: number;
  code: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  validFrom: string;
  validUntil: string;
  active: boolean;
  usageLimit?: number;
  usageCount: number;
}

export const couponsApi = {
  getActive: async (): Promise<CouponDTO[]> => {
    const response = await apiClient.get<ApiResponse<CouponDTO[]>>(
      `${COUPONS_BASE}/active`
    );
    return response.data.data!;
  },

  getByCode: async (code: string): Promise<CouponDTO> => {
    const response = await apiClient.get<ApiResponse<CouponDTO>>(
      `${COUPONS_BASE}/code/${code}`
    );
    return response.data.data!;
  },

  validate: async (code: string, orderAmount: number): Promise<boolean> => {
    const response = await apiClient.post<ApiResponse<boolean>>(
      `${COUPONS_BASE}/validate`,
      { code, orderAmount }
    );
    return response.data.data || false;
  },

  apply: async (code: string, orderId: number): Promise<unknown> => {
    const response = await apiClient.post<ApiResponse<unknown>>(
      `${COUPONS_BASE}/apply`,
      { code, orderId }
    );
    return response.data.data!;
  },
};
