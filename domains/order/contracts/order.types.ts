import { UserDTO } from '@/domains/auth/contracts/auth.types';
import { ProductDTO } from '@/domains/catalog/contracts/catalog.types';

export enum OrderStatus {
  PLACED = 'PLACED',
  CONFIRMED = 'CONFIRMED',
  PACKED = 'PACKED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  RETURNED = 'RETURNED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export interface OrderItemDTO {
  id: number;
  product: ProductDTO;
  quantity: number;
  price: number;
  discountAmount?: number;
  subtotal: number;
  createdAt: string;
}

export interface OrderDTO {
  id: number;
  orderNumber: string;
  customer: UserDTO;
  items: OrderItemDTO[];
  totalAmount: number;
  shippingAmount?: number;
  taxAmount?: number;
  discountAmount?: number;
  shippingAddress: string;
  billingAddress?: string;
  phone?: string;
  notes?: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  deliveryAgent?: UserDTO;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateOrderRequest {
  shippingAddress: string;
  billingAddress?: string;
  phone?: string;
  notes?: string;
  /**
   * Promo code the shopper applied in the cart.
   *
   * The **code** is sent, never a discount amount: redemption must be
   * validated and applied atomically with order creation on the backend, and a
   * client-supplied figure would be trivially tampered with. `OrderDTO`'s
   * `discountAmount` on the response is the authoritative result.
   *
   * Previously absent entirely, which is why an applied promo silently
   * vanished between the cart and the placed order — the shopper saw a
   * discount, then paid full price.
   */
  couponCode?: string;
}

export interface UpdateOrderStatusRequest {
  orderStatus: OrderStatus;
}

export interface UpdatePaymentStatusRequest {
  paymentStatus: PaymentStatus;
}

export interface OrderFilters {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  startDate?: string;
  endDate?: string;
}
