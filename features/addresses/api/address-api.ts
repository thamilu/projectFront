import { apiClient } from '@/core/client';
import { API_ENDPOINTS } from '@/shared/constants/api/endpoints';

export interface AddressDTO {
  id: string;
  type: 'Home' | 'Work' | 'Other';
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  isDefault: boolean;
}

export const addressApi = {
  getAddresses: async (): Promise<AddressDTO[]> => {
    const { data } = await apiClient.get<AddressDTO[] | { data: AddressDTO[] }>(
      API_ENDPOINTS.USERS.ADDRESSES
    );
    return Array.isArray(data) ? data : (data as any)?.data || [];
  },

  addAddress: async (address: Partial<AddressDTO>): Promise<AddressDTO> => {
    const { data } = await apiClient.post<AddressDTO | { data: AddressDTO }>(
      API_ENDPOINTS.USERS.ADD_ADDRESS,
      address
    );
    return 'data' in data && data.data ? data.data : (data as AddressDTO);
  },

  updateAddress: async (id: string, address: Partial<AddressDTO>): Promise<AddressDTO> => {
    const { data } = await apiClient.put<AddressDTO | { data: AddressDTO }>(
      API_ENDPOINTS.USERS.UPDATE_ADDRESS(id),
      address
    );
    return 'data' in data && data.data ? data.data : (data as AddressDTO);
  },

  deleteAddress: async (id: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.USERS.DELETE_ADDRESS(id));
  },

  setDefaultAddress: async (id: string): Promise<void> => {
    await apiClient.put(`${API_ENDPOINTS.USERS.ADDRESSES}/${id}/default`);
  },
};

export default addressApi;
