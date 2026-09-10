import { ProductDTO } from '@/domains/catalog/contracts/catalog.types';

export interface WishlistItemDTO {
  id: number;
  productId: number | string;
  product: ProductDTO;
  createdAt?: string;
}
