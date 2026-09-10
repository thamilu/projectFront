'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { addressApi, type AddressDTO } from '../api/address-api';
import { toast } from 'sonner';
import { logger } from '@/core/telemetry/logger';

export function useAddresses() {
  const queryClient = useQueryClient();

  const {
    data: addresses = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['addresses'],
    queryFn: addressApi.getAddresses,
  });

  const saveAddressMutation = useMutation({
    mutationFn: async ({ id, address }: { id?: string; address: Partial<AddressDTO> }) => {
      if (id) {
        return addressApi.updateAddress(id, address);
      }
      return addressApi.addAddress(address);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.success(variables.id ? 'Address updated successfully' : 'Address added successfully');
    },
    onError: (err: unknown) => {
      logger.error('Failed to save address', { error: err });
      toast.error('Failed to save address');
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: addressApi.deleteAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.success('Address deleted successfully');
    },
    onError: (err: unknown) => {
      logger.error('Failed to delete address', { error: err });
      toast.error('Failed to delete address');
    },
  });

  const setDefaultAddressMutation = useMutation({
    mutationFn: addressApi.setDefaultAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.success('Default address updated');
    },
    onError: (err: unknown) => {
      logger.error('Failed to set default address', { error: err });
      toast.error('Failed to set default address');
    },
  });

  return {
    addresses,
    isLoading,
    error,
    saveAddress: saveAddressMutation.mutateAsync,
    deleteAddress: deleteAddressMutation.mutateAsync,
    setDefaultAddress: setDefaultAddressMutation.mutateAsync,
    isSaving: saveAddressMutation.isPending,
    isDeleting: deleteAddressMutation.isPending,
    isSettingDefault: setDefaultAddressMutation.isPending,
  };
}
