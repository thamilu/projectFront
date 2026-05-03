import { apiClient } from '../client';
import { API_ENDPOINTS } from '../endpoints';
import type {
  ProductDTO,
  ProductFilters,
  PageRequest,
  PageResponse,
} from '@/types';

interface ProductListParams extends PageRequest, ProductFilters {}

interface CreateProductRequest {
  name: string;
  description: string;
  sku: string;
  price: number;
  discountPrice?: number;
  stockQuantity: number;
  imageUrl?: string;
  categoryId: number;
  brandId?: number;
  shopId: number;
  tagIds?: number[];
  featured?: boolean;
}

interface UpdateProductRequest extends Partial<CreateProductRequest> {
  active?: boolean;
}

class ProductsService {
  async getProducts(params: ProductListParams): Promise<PageResponse<ProductDTO>> {
    const queryParams: Record<string, string | number | boolean | undefined> = {
      page: params.page,
      size: params.size,
      sort: params.sort,
      categoryId: params.categoryId,
      brandId: params.brandId,
      minPrice: params.minPrice,
      maxPrice: params.maxPrice,
      inStock: params.inStock,
      featured: params.featured,
      search: params.search,
    };

    return apiClient.get<PageResponse<ProductDTO>>(API_ENDPOINTS.PRODUCTS.LIST, {
      params: queryParams,
    });
  }

  async getProductById(id: number): Promise<ProductDTO> {
    return apiClient.get<ProductDTO>(API_ENDPOINTS.PRODUCTS.DETAIL(id));
  }

  async searchProducts(
    query: string,
    params: PageRequest
  ): Promise<PageResponse<ProductDTO>> {
    return apiClient.get<PageResponse<ProductDTO>>(API_ENDPOINTS.PRODUCTS.SEARCH, {
      params: {
        q: query,
        page: params.page,
        size: params.size,
        sort: params.sort,
      },
    });
  }

  async getFeaturedProducts(limit: number = 8): Promise<ProductDTO[]> {
    const response = await apiClient.get<PageResponse<ProductDTO>>(
      API_ENDPOINTS.PRODUCTS.FEATURED,
      { params: { size: limit } }
    );
    return response.content;
  }

  async getProductsByCategory(
    categoryId: number,
    params: PageRequest
  ): Promise<PageResponse<ProductDTO>> {
    const queryParams = {
      page: params.page,
      size: params.size,
      sort: params.sort,
    };
    return apiClient.get<PageResponse<ProductDTO>>(
      API_ENDPOINTS.PRODUCTS.BY_CATEGORY(categoryId),
      { params: queryParams }
    );
  }

  async createProduct(data: CreateProductRequest): Promise<ProductDTO> {
    return apiClient.post<ProductDTO, CreateProductRequest>(
      API_ENDPOINTS.PRODUCTS.CREATE,
      data
    );
  }

  async updateProduct(id: number, data: UpdateProductRequest): Promise<ProductDTO> {
    return apiClient.put<ProductDTO, UpdateProductRequest>(
      API_ENDPOINTS.PRODUCTS.UPDATE(id),
      data
    );
  }

  async deleteProduct(id: number): Promise<void> {
    return apiClient.delete<void>(API_ENDPOINTS.PRODUCTS.DELETE(id));
  }

  async toggleProductStatus(id: number, active: boolean): Promise<ProductDTO> {
    return apiClient.patch<ProductDTO, { active: boolean }>(
      API_ENDPOINTS.PRODUCTS.UPDATE(id),
      { active }
    );
  }
}

export const productsService = new ProductsService();
