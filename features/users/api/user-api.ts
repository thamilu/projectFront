import apiClient from '@/lib/axios';
import { UserDTO, PageResponse, PageRequest } from '@/types';

// Time Complexity: O(1) - single HTTP request
// Space Complexity: O(n) where n is number of users
export const userApi = {
  getUsers: async (params: PageRequest): Promise<PageResponse<UserDTO>> => {
    const { data } = await apiClient.get<PageResponse<UserDTO>>('/users', { params });
    return data;
  },

  getUserById: async (id: number): Promise<UserDTO> => {
    const { data } = await apiClient.get<UserDTO>(`/users/${id}`);
    return data;
  },

  updateUser: async (id: number, userData: Partial<UserDTO>): Promise<UserDTO> => {
    const { data } = await apiClient.put<UserDTO>(`/users/${id}`, userData);
    return data;
  },

  deleteUser: async (id: number): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },

  toggleUserStatus: async (id: number): Promise<UserDTO> => {
    const { data } = await apiClient.patch<UserDTO>(`/users/${id}/toggle-status`);
    return data;
  },
};
