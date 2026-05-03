import { useQuery } from '@tanstack/react-query';
import { productApi } from '@/features/products/api/product-api';
import { queryKeys } from '@/lib/query-keys';
import { withDefaults } from '@/lib/utils/pagination';
import {
  ProductDTO,
  PageResponse,
  PageRequest,
  ProductFilters,
  CategoryDTO,
  BrandDTO,
  TagDTO,
} from '@/types';

export function useProducts(params?: PageRequest & ProductFilters) {
  const p = withDefaults<PageRequest & ProductFilters>(params);

  return useQuery<PageResponse<ProductDTO>>({
    queryKey: queryKeys.products.list(p),
    queryFn: () => productApi.getProducts(p),
  });
}

export function useProduct(id: number) {
  return useQuery<ProductDTO>({
    queryKey: queryKeys.products.detail(id),
    queryFn: () => productApi.getProductById(id),
    enabled: !!id,
  });
}

export function useSearchProducts(query: string, params?: PageRequest) {
  return useQuery<PageResponse<ProductDTO>>({
    queryKey: queryKeys.products.search(query, params || {}),
    queryFn: () => productApi.searchProducts(query, params),
    enabled: !!query,
  });
}

export function useFeaturedProducts() {
  return useQuery<ProductDTO[]>({
    queryKey: queryKeys.products.featured(),
    queryFn: () => productApi.getFeaturedProducts(),
  });
}

export function useCategories() {
  return useQuery<CategoryDTO[]>({
    queryKey: queryKeys.products.categories(),
    queryFn: () => productApi.getCategories(),
  });
}

export function useBrands() {
  return useQuery<BrandDTO[]>({
    queryKey: queryKeys.products.brands(),
    queryFn: () => productApi.getBrands(),
  });
}

export function useTags() {
  return useQuery<TagDTO[]>({
    queryKey: queryKeys.products.tags(),
    queryFn: () => productApi.getTags(),
  });
}
