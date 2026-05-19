/**
 * Inventory Domain Contract - Core Type Definitions
 */

export interface StockLevel {
  productId: string;
  sku: string;
  quantityAvailable: number;
  quantityReserved: number;
  lowStockThreshold: number;
  isOutOfStock: boolean;
  isLowStock: boolean;
}

export interface StockReservation {
  reservationId: string;
  productId: string;
  quantity: number;
  expiresAt: string;
  status: 'active' | 'completed' | 'released';
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  sellerId: string;
  address: {
    line1: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  isActive: boolean;
}
