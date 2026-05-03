/**
 * Payments API Service
 */

import { apiClient } from '../axios';
import type { ApiResponse } from '@/types';

const PAYMENTS_BASE = '/api/payments';
const PAYMENT_METHODS_BASE = '/api/payment-methods';

export interface PaymentMethodDTO {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  description?: string;
}

export interface ProcessPaymentRequest {
  orderId: number;
  paymentMethod: string;
  amount: number;
}

export const paymentsApi = {
  getAvailableMethods: async (): Promise<PaymentMethodDTO[]> => {
    const response = await apiClient.get<ApiResponse<PaymentMethodDTO[]>>(
      `${PAYMENT_METHODS_BASE}/available`
    );
    return response.data.data!;
  },

  processPayment: async (data: ProcessPaymentRequest): Promise<unknown> => {
    const response = await apiClient.post<ApiResponse<unknown>>(
      `${PAYMENTS_BASE}/process`,
      data
    );
    return response.data.data!;
  },

  getByOrder: async (orderId: number): Promise<unknown[]> => {
    const response = await apiClient.get<ApiResponse<unknown[]>>(
      `${PAYMENTS_BASE}/order/${orderId}`
    );
    return response.data.data!;
  },

  verifyPayment: async (paymentId: number): Promise<unknown> => {
    const response = await apiClient.post<ApiResponse<unknown>>(
      `${PAYMENTS_BASE}/verify/${paymentId}`
    );
    return response.data.data!;
  },
};
