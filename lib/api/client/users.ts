/**
 * Users API Service
 */

import { apiClient } from '../axios';
import type { UserDTO, UserRole, PaginatedResponse, ApiResponse } from '@/types';

const USERS_BASE = '/api/users';

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export const usersApi = {
  /**
   * Get current user
   * GET /api/users/me
   */
  getCurrentUser: async (): Promise<UserDTO> => {
    const response = await apiClient.get<ApiResponse<UserDTO>>(`${USERS_BASE}/me`);
    return response.data.data!;
  },

  /**
   * Update current user profile
   * PUT /api/users/me
   */
  updateCurrentUser: async (data: UpdateUserRequest): Promise<UserDTO> => {
    const response = await apiClient.put<ApiResponse<UserDTO>>(`${USERS_BASE}/me`, data);
    return response.data.data!;
  },

  /**
   * Change password
   * PUT /api/users/me/password
   */
  changePassword: async (data: ChangePasswordRequest): Promise<void> => {
    await apiClient.put(`${USERS_BASE}/me/password`, data);
  },

  /**
   * Get user by ID (Admin)
   * GET /api/users/{id}
   */
  getById: async (id: number): Promise<UserDTO> => {
    const response = await apiClient.get<ApiResponse<UserDTO>>(`${USERS_BASE}/${id}`);
    return response.data.data!;
  },

  /**
   * Update user (Admin)
   * PUT /api/users/{id}
   */
  update: async (id: number, data: UpdateUserRequest): Promise<UserDTO> => {
    const response = await apiClient.put<ApiResponse<UserDTO>>(`${USERS_BASE}/${id}`, data);
    return response.data.data!;
  },

  /**
   * Delete user (Admin)
   * DELETE /api/users/{id}
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${USERS_BASE}/${id}`);
  },

  /**
   * Get all users (Admin)
   * GET /api/users
   */
  getAll: async (params?: { page?: number; size?: number }): Promise<PaginatedResponse<UserDTO>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<UserDTO>>>(
      USERS_BASE,
      { params }
    );
    return response.data.data!;
  },

  /**
   * Get users by role (Admin)
   * GET /api/users/role/{role}
   */
  getByRole: async (
    role: UserRole,
    params?: { page?: number; size?: number }
  ): Promise<PaginatedResponse<UserDTO>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<UserDTO>>>(
      `${USERS_BASE}/role/${role}`,
      { params }
    );
    return response.data.data!;
  },

  /**
   * Search users (Admin)
   * GET /api/users/search
   */
  search: async (
    keyword: string,
    params?: { page?: number; size?: number }
  ): Promise<PaginatedResponse<UserDTO>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<UserDTO>>>(
      `${USERS_BASE}/search`,
      { params: { ...params, keyword } }
    );
    return response.data.data!;
  },

  /**
   * Activate user (Admin)
   * PUT /api/users/{id}/activate
   */
  activate: async (id: number): Promise<UserDTO> => {
    const response = await apiClient.put<ApiResponse<UserDTO>>(`${USERS_BASE}/${id}/activate`);
    return response.data.data!;
  },

  /**
   * Deactivate user (Admin)
   * PUT /api/users/{id}/deactivate
   */
  deactivate: async (id: number): Promise<UserDTO> => {
    const response = await apiClient.put<ApiResponse<UserDTO>>(`${USERS_BASE}/${id}/deactivate`);
    return response.data.data!;
  },

  /**
   * Update user role (Admin)
   * PUT /api/users/{id}/role
   */
  updateRole: async (id: number, role: UserRole): Promise<UserDTO> => {
    const response = await apiClient.put<ApiResponse<UserDTO>>(
      `${USERS_BASE}/${id}/role`,
      { role }
    );
    return response.data.data!;
  },
};
