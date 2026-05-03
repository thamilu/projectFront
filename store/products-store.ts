/**
 * Products Store
 * Manages product state and filtering
 */

import { create } from 'zustand';
import { ProductDTO } from '@/types';

interface ProductFilters {
  categoryId?: number;
  brandId?: number;
  shopId?: number;
  minPrice?: number;
  maxPrice?: number;
  keyword?: string;
  inStock?: boolean;
  featured?: boolean;
  tags?: string[];
}

interface ProductsState {
  products: ProductDTO[];
  selectedProduct: ProductDTO | null;
  filters: ProductFilters;
  isLoading: boolean;
  
  // Actions
  setProducts: (products: ProductDTO[]) => void;
  setSelectedProduct: (product: ProductDTO | null) => void;
  setFilters: (filters: ProductFilters) => void;
  clearFilters: () => void;
  setLoading: (loading: boolean) => void;
}

export const useProductsStore = create<ProductsState>((set) => ({
  products: [],
  selectedProduct: null,
  filters: {},
  isLoading: false,

  setProducts: (products) => set({ products }),
  
  setSelectedProduct: (product) => set({ selectedProduct: product }),
  
  setFilters: (filters) => set((state) => ({ 
    filters: { ...state.filters, ...filters } 
  })),
  
  clearFilters: () => set({ filters: {} }),
  
  setLoading: (loading) => set({ isLoading: loading }),
}));
