import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sellerApi } from '@/features/seller/api/seller-api';
import { sellerProfileApi } from '@/features/seller/api/seller-profile-api';
import { queryKeys } from '@/lib/query-keys';
import { ProductDTO, PageResponse, PageRequest } from '@/types';
import type {
  SellerOnboardingRequest,
  SellerProfile,
  Store,
  StoreCreateRequest,
} from '@/features/seller/types';

export function useMyStore() {
  return useQuery<SellerProfile | null>({
    queryKey: queryKeys.seller.profile(),
    queryFn: () => sellerProfileApi.getMyProfile(),
    enabled: true,
  });
}

export function useStoreExists() {
  return useQuery<boolean>({
    queryKey: queryKeys.seller.storeExists(),
    queryFn: () => sellerApi.checkStoreExists(),
    enabled: true,
  });
}

export function useCreateStore() {
  const queryClient = useQueryClient();
  return useMutation<Store, unknown, StoreCreateRequest>({
    mutationFn: (storeData) => sellerApi.createStore(storeData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.seller.store() });
      queryClient.invalidateQueries({ queryKey: queryKeys.seller.storeExists() });
    },
  });
}

export function useUpdateStore() {
  const queryClient = useQueryClient();
  return useMutation<SellerProfile, unknown, Partial<SellerOnboardingRequest>>({
    mutationFn: (storeData) => sellerProfileApi.updateProfile(storeData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.seller.profile() });
    },
  });
}

export function useMyProducts(params: PageRequest) {
  return useQuery<PageResponse<ProductDTO>>({
    queryKey: queryKeys.seller.products(params),
    queryFn: () => sellerApi.getMyProducts(params),
    enabled: !!params,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation<ProductDTO, unknown, Partial<ProductDTO>>({
    mutationFn: (productData) => sellerApi.createProduct(productData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.seller.products({}) });
    },
  });
}

export function useUpdateProduct(id: number) {
  const queryClient = useQueryClient();
  return useMutation<ProductDTO, unknown, Partial<ProductDTO>>({
    mutationFn: (productData) => sellerApi.updateProduct(id, productData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.seller.products({}) });
    },
  });
}

export function useDeleteProduct(id: number) {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, void>({
    mutationFn: () => sellerApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.seller.products({}) });
    },
  });
}
