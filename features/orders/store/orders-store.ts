/**
 * Orders Store
 * Manages order state
 */

import { create } from 'zustand';
import { OrderDTO, OrderStatus } from '@/types';

interface OrdersState {
  orders: OrderDTO[];
  selectedOrder: OrderDTO | null;
  isLoading: boolean;
  
  // Actions
  setOrders: (orders: OrderDTO[]) => void;
  setSelectedOrder: (order: OrderDTO | null) => void;
  addOrder: (order: OrderDTO) => void;
  updateOrderStatus: (orderId: number, status: OrderStatus) => void;
  setLoading: (loading: boolean) => void;
}

export const useOrdersStore = create<OrdersState>((set) => ({
  orders: [],
  selectedOrder: null,
  isLoading: false,

  setOrders: (orders) => set({ orders }),
  
  setSelectedOrder: (order) => set({ selectedOrder: order }),
  
  addOrder: (order) => set((state) => ({ 
    orders: [order, ...state.orders] 
  })),
  
  updateOrderStatus: (orderId, status) => set((state) => ({
    orders: state.orders.map((order) =>
      order.id === orderId ? { ...order, orderStatus: status } : order
    ),
  })),
  
  setLoading: (loading) => set({ isLoading: loading }),
}));
