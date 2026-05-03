import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productApi } from '../api/product-api';
import { PageRequest, ProductFilters } from '@/types';

type CreateProductMutationInput =
  | Partial<Record<string, unknown>>
  | {
      payload: Partial<Record<string, unknown>>;
      correlationId?: string;
    };

function isCreateProductMutationEnvelope(
  input: CreateProductMutationInput
): input is { payload: Partial<Record<string, unknown>>; correlationId?: string } {
  return (
    typeof input === 'object' &&
    input !== null &&
    'payload' in input &&
    typeof input.payload === 'object' &&
    input.payload !== null
  );
}

// Time Complexity: O(1) for hook setup, O(n) for data processing where n is products count
// Space Complexity: O(n) where n is number of products cached
export function useProducts(params: PageRequest & ProductFilters) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => productApi.getProducts(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Time Complexity: O(1)
// Space Complexity: O(1)
export function useProduct(id: number) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => productApi.getProductById(id),
    enabled: !!id,
  });
}

// Time Complexity: O(1) for hook, O(n) for search results
// Space Complexity: O(n) where n is search results count
export function useProductSearch(query: string, params?: PageRequest) {
  return useQuery({
    queryKey: ['products', 'search', query, params],
    queryFn: () => productApi.searchProducts(query, params),
    enabled: query.length > 0,
  });
}

// Time Complexity: O(1)
// Space Complexity: O(n) where n is featured products count
export function useFeaturedProducts() {
  return useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => productApi.getFeaturedProducts(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Time Complexity: O(1)
// Space Complexity: O(n) where n is categories count
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => productApi.getCategories(),
    staleTime: 0, // Always fetch fresh — categories change frequently
    gcTime: 60 * 1000, // Keep in memory for 1 min between navigations
    retry: false,
  });
}

// Time Complexity: O(1)
// Space Complexity: O(n) where n is brands count
export function useBrands() {
  return useQuery({
    queryKey: ['brands'],
    queryFn: () => productApi.getBrands(),
    staleTime: 0,
    gcTime: 60 * 1000,
    retry: false,
  });
}

// Mutations for product management
export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<Record<string, unknown>> }) =>
      productApi.updateProduct(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => productApi.deleteProduct(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProductMutationInput) => {
      const payload = isCreateProductMutationEnvelope(input) ? input.payload : input;
      const correlationId = isCreateProductMutationEnvelope(input)
        ? input.correlationId
        : undefined;
      return productApi.createProduct(payload, { correlationId });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
