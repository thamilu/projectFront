import { httpClient as apiClient } from '../index';
import { RequestOptions } from '../../types';

/**
 * [HARDEN] Auth API Service Stub
 */
export const authApi = {
  login: async (credentials: any, options: RequestOptions = {}) => {
    const { data } = await apiClient.post('/api/v1/auth/login', credentials, {
      signal: options.signal,
    });
    return data;
  },

  logout: async (options: RequestOptions = {}) => {
    await apiClient.post('/api/v1/auth/logout', null, {
      signal: options.signal,
    });
  },

  refreshToken: async (token: string, options: RequestOptions = {}) => {
    const { data } = await apiClient.post('/api/v1/auth/refresh', { token }, {
      signal: options.signal,
    });
    return data;
  },
};
