import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sellerApi } from '../api/seller-api';
import { PageRequest, ProductDTO } from '@/types';
import type { Store, StoreCreateRequest, StoreUpdateRequest } from '@/features/seller/types';
import { toast } from 'sonner';

// Time Complexity: O(1) for hook setup
// Space Complexity: O(1)
export function useSellerStore() {
  return useQuery<Store | null>({
    queryKey: ['seller', 'store'],
    queryFn: sellerApi.getMyStore,
  });
}

// Time Complexity: O(1)
// Space Complexity: O(1)
export function useStoreExists() {
  return useQuery({
    queryKey: ['seller', 'store', 'exists'],
    queryFn: sellerApi.checkStoreExists,
  });
}

// Time Complexity: O(1)
// Space Complexity: O(n) where n is products count
export function useSellerProducts(params: PageRequest) {
  return useQuery({
    queryKey: ['seller', 'products', params],
    queryFn: () => sellerApi.getMyProducts(params),
  });
}

// Time Complexity: O(1)
// Space Complexity: O(1)
export function useCreateStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (storeData: StoreCreateRequest) => sellerApi.createStore(storeData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'store'] });
      toast.success('Store created successfully');
    },
    onError: () => {
      toast.error('Failed to create store');
    },
  });
}

// Time Complexity: O(1)
// Space Complexity: O(1)
export function useUpdateStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (storeData: Partial<StoreUpdateRequest>) => sellerApi.updateStore(storeData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'store'] });
      toast.success('Store updated successfully');
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      const errorMsg = error?.response?.data?.message || error?.message || 'Failed to update store';
      toast.error('Failed to update store', { description: errorMsg });
    },
  });
}

// Time Complexity: O(1)
// Space Complexity: O(1)
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productData: Partial<ProductDTO>) => sellerApi.createProduct(productData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'products'] });
      toast.success('Product created successfully');
    },
    onError: () => {
      toast.error('Failed to create product');
    },
  });
}

// Time Complexity: O(1)
// Space Complexity: O(1)
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ProductDTO> }) =>
      sellerApi.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'products'] });
      toast.success('Product updated successfully');
    },
    onError: () => {
      toast.error('Failed to update product');
    },
  });
}

// Time Complexity: O(1)
// Space Complexity: O(1)
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: number) => sellerApi.deleteProduct(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'products'] });
      toast.success('Product deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete product');
    },
  });
}
