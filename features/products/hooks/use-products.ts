import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productApi } from '../api/product-api';
import { productKeys } from '../query-keys';
import { withDefaults } from '@/shared/utils/pagination';
import { PageResponse, PageRequest } from '@/shared/types';
import { ProductDTO, ProductFilters, CategoryDTO, BrandDTO, TagDTO } from '@/domains/catalog/contracts/catalog.types';

export function useProducts(params?: PageRequest & ProductFilters) {
  const p = withDefaults<PageRequest & ProductFilters>(params);

  return useQuery<PageResponse<ProductDTO>>({
    queryKey: productKeys.list(p),
    queryFn: () => productApi.getProducts(p),
  });
}

export function useProduct(id: string | number) {
  return useQuery<ProductDTO>({
    queryKey: productKeys.detail(id),
    queryFn: () => productApi.getProductById(id),
    enabled: !!id,
  });
}

export function useSearchProducts(query: string, params?: PageRequest) {
  return useQuery<PageResponse<ProductDTO>>({
    queryKey: productKeys.search(query),
    queryFn: () => productApi.searchProducts(query, params),
    enabled: !!query,
  });
}

export function useFeaturedProducts() {
  return useQuery<ProductDTO[]>({
    queryKey: productKeys.featured(),
    queryFn: () => productApi.getFeaturedProducts(),
  });
}

export function useCategories() {
  return useQuery<CategoryDTO[]>({
    queryKey: productKeys.categories(),
    queryFn: () => productApi.getCategories(),
  });
}

export function useBrands() {
  return useQuery<BrandDTO[]>({
    queryKey: productKeys.brands(),
    queryFn: () => productApi.getBrands(),
  });
}

export function useTags() {
  return useQuery<TagDTO[]>({
    queryKey: productKeys.tags(),
    queryFn: () => productApi.getTags(),
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ payload, correlationId }: { payload: Record<string, unknown>; correlationId?: string }) =>
      productApi.create(payload, { correlationId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
