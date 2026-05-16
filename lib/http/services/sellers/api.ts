import { httpClient as apiClient } from '../index';
import { RequestOptions } from '../../types';

/**
 * [HARDEN] Sellers API Service Stub
 */
export const sellersApi = {
  getProfile: async (options: RequestOptions = {}) => {
    const { data } = await apiClient.get('/api/v1/sellers/profile', {
      signal: options.signal,
    });
    return data;
  },

  updateProfile: async (payload: any, options: RequestOptions = {}) => {
    const { data } = await apiClient.put('/api/v1/sellers/profile', payload, {
      signal: options.signal,
    });
    return data;
  },

  getDashboardStats: async (options: RequestOptions = {}) => {
    const { data } = await apiClient.get('/api/v1/sellers/dashboard/stats', {
      signal: options.signal,
    });
    return data;
  },
};
