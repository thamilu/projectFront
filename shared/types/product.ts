import type {
  CategoryDTO,
  BrandDTO,
  ProductDTO,
  BackendProductRequest as DomainBackendProductRequest,
  ProductFilters as DomainProductFilters,
  TagDTO,
} from '@/domains/catalog/contracts/catalog.types';

// Backward compatibility type aliases
export type Category = CategoryDTO;
export type Brand = BrandDTO;
export type Product = ProductDTO;
export type BackendProductRequest = DomainBackendProductRequest;
export type ProductFilters = DomainProductFilters;

// Explicit exports for domain DTOs
export type { CategoryDTO, BrandDTO, ProductDTO, TagDTO };
