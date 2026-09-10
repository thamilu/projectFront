import { apiClient } from '@/core/client';
import { RequestOptions } from '@/core/client/types';
import { RegisterRequest, AuthResponse } from '@/domains/auth/contracts/auth.types';

/**
 * [HARDEN] Auth API Service
 */
export const authApi = {
  login: async (credentials: any, options: RequestOptions = {}): Promise<any> => {
    const { data } = await apiClient.post('/api/v1/auth/login', credentials, {
      signal: options.signal,
    });
    return data;
  },

  register: async (
    credentials: RegisterRequest,
    options: RequestOptions = {}
  ): Promise<AuthResponse> => {
    const { data } = await apiClient.post('/api/v1/auth/register', credentials, {
      signal: options.signal,
    });
    // Normalization to match expected unified AuthResponse
    if (data && data.success && data.data) {
      const d = data.data;
      return {
        token: d.token,
        user: {
          id: d.userId,
          username: d.username,
          email: d.email,
          firstName: d.firstName || '',
          lastName: d.lastName || '',
          role: d.role,
          active: d.active !== undefined ? d.active : true,
          createdAt: d.createdAt || new Date().toISOString(),
        },
      };
    }
    return data;
  },

  logout: async (options: RequestOptions = {}): Promise<void> => {
    await apiClient.post('/api/v1/auth/logout', null, {
      signal: options.signal,
    });
  },

  refreshToken: async (token: string, options: RequestOptions = {}): Promise<any> => {
    const { data } = await apiClient.post(
      '/api/v1/auth/refresh',
      { token },
      {
        signal: options.signal,
      }
    );
    return data;
  },
};

export default authApi;
