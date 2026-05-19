import { UserDTO } from '@/domains/auth/contracts/auth.types';
import { ProductDTO } from '@/domains/catalog/contracts/catalog.types';

export interface CartItemDTO {
  id: number;
  product: ProductDTO;
  quantity: number;
  price: number;
  subtotal: number;
  createdAt: string;
}

export interface CartDTO {
  id: number;
  user: UserDTO;
  items: CartItemDTO[];
  totalAmount: number;
  createdAt: string;
  updatedAt?: string;
}
