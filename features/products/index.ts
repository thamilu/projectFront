// Feature: Products
// Centralized exports for products feature module

// Components
export * from './components/ProductCard';
export * from './components/ProductList';
export * from './components/ProductGrid';
export { ProductFilters } from './components/ProductFilters';
export * from './components/ProductPrice';
export * from './components/FeaturedProductsSection';
export * from './components/FlashDealsSection';
export * from './components/CategorySection';
export * from './components/ProductImageUploader';
export * from './components/CategoryRequestModal';

// Hooks
export * from './hooks/use-products';

// API
export * from './api/product-api';

export type * from './types';

// Infrastructure
export * from './query-keys';
