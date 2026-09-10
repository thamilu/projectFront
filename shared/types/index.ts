export type {
  ProductDTO,
  CategoryDTO,
  BrandDTO,
  TagDTO,
  ProductFilters,
  BackendProductRequest,
} from '@/domains/catalog/contracts/catalog.types';
export type { StoreDTO, ShopDTO } from '@/domains/seller/contracts/seller.types';

// Pagination

export interface PageRequest {
  page: number;
  size: number;
  sort?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// Backwards-compatible alias used across the frontend
export type PaginatedResponse<T> = PageResponse<T>;
