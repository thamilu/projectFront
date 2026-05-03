/**
 * Authentication API Service
 * Handles all authentication-related API calls
 */

import { apiClient } from '../axios';
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  UserDTO,
  ApiResponse,
} from '@/types';

const AUTH_BASE = '/api/auth';

export const authApi = {
  /**
   * Register a new user
   * POST /api/auth/register
   */
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      `${AUTH_BASE}/register`,
      data
    );
    const payload = response.data.data ?? response.data;
    return payload as AuthResponse;
  },

  /**
   * Login user
   * POST /api/auth/login
   */
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      `${AUTH_BASE}/login`,
      data
    );
    const payload = response.data.data ?? response.data;
    return payload as AuthResponse;
  },

  /**
   * Get current user profile
   * GET /api/auth/me
   */
  getCurrentUser: async (): Promise<UserDTO> => {
    const response = await apiClient.get<ApiResponse<UserDTO>>(`${AUTH_BASE}/me`);
    return response.data.data!;
  },

  /**
   * Refresh authentication token
   * POST /api/auth/refresh
   */
  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      `${AUTH_BASE}/refresh`,
      { refreshToken }
    );
    return response.data.data!;
  },

  /**
   * Logout user
   * POST /api/auth/logout
   */
  logout: async (): Promise<void> => {
    await apiClient.post(`${AUTH_BASE}/logout`);
  },

  /**
   * Logout from all devices
   * POST /api/auth/logout-all
   */
  logoutAll: async (): Promise<void> => {
    await apiClient.post(`${AUTH_BASE}/logout-all`);
  },

  /**
   * Request password reset
   * POST /api/auth/forgot-password
   */
  forgotPassword: async (email: string): Promise<void> => {
    await apiClient.post(`${AUTH_BASE}/forgot-password`, { email });
  },

  /**
   * Reset password with token
   * POST /api/auth/reset-password
   */
  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await apiClient.post(`${AUTH_BASE}/reset-password`, {
      token,
      newPassword,
    });
  },

  /**
   * Change password (authenticated)
   * POST /api/auth/change-password
   */
  changePassword: async (
    currentPassword: string,
    newPassword: string
  ): Promise<void> => {
    await apiClient.post(`${AUTH_BASE}/change-password`, {
      currentPassword,
      newPassword,
    });
  },

  /**
   * Verify email address
   * POST /api/auth/verify-email
   */
  verifyEmail: async (token: string): Promise<void> => {
    await apiClient.post(`${AUTH_BASE}/verify-email`, { token });
  },

  /**
   * Resend verification email
   * POST /api/auth/resend-verification
   */
  resendVerification: async (email: string): Promise<void> => {
    await apiClient.post(`${AUTH_BASE}/resend-verification`, { email });
  },

  /**
   * Validate token
   * POST /api/auth/validate-token
   */
  validateToken: async (token: string): Promise<boolean> => {
    try {
      const response = await apiClient.post<ApiResponse<boolean>>(
        `${AUTH_BASE}/validate-token`,
        { token }
      );
      return response.data.data || false;
    } catch {
      return false;
    }
  },
};
