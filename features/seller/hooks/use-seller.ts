'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sellerApi } from '../api/seller-api';
import { productsApi } from '@/domains/catalog/infrastructure/api/catalog-api';
import { queryKeys } from '@/core/cache/query-keys';

export function useSellerProfile() {
  return useQuery({
    queryKey: queryKeys.seller.profile,
    queryFn: () => sellerApi.getMyProfile(),
  });
}

export function useUpdateSellerProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sellerApi.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.seller.profile });
    },
  });
}

export function useSellerProducts(params?: any) {
  return useQuery({
    queryKey: queryKeys.seller.products(params),
    queryFn: () => sellerApi.getMyProducts(params),
  });
}

export function useSellerStore() {
  return useQuery({
    queryKey: queryKeys.seller.store,
    queryFn: () => sellerApi.getMyStore(),
    retry: (failureCount, error: any) => {
      // Never retry on client errors (4xx) — they won't self-resolve
      if (error?.statusCode >= 400 && error?.statusCode < 500) return false;
      return failureCount < 2;
    },
  });
}

export function useCreateStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sellerApi.createStore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.seller.store });
    },
  });
}

export function useUpdateStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sellerApi.updateStore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.seller.store });
    },
  });
}

export function useMasterProducts(params?: any) {
  return useQuery({
    queryKey: ['seller', 'master-products', params],
    queryFn: () => productsApi.getMasterProducts(params),
  });
}
