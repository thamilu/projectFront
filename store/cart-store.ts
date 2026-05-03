import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { CartDTO, CartItemDTO } from '@/types';

/** Calculates precise cart total from items, avoiding floating point drift. */
function calcCartTotal(items: CartItemDTO[]): number {
  return Number(items.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));
}


/**
 * Cart State Interface
 * 
 * Performance Optimizations:
 * - Memoized selectors for computed values
 * - Immutable state updates
 * - Minimal re-renders via selector specificity
 */
interface CartState {
  cart: CartDTO | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setCart: (cart: CartDTO | null) => void;
  addItem: (item: CartItemDTO) => void;
  removeItem: (itemId: number) => void;
  updateQuantity: (itemId: number, quantity: number) => void;
  clearCart: () => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  // Backwards-compatible computed helpers
  getItemCount: () => number;
  getTotal: () => number;
}

/**
 * Cart Store with Performance Optimizations
 * 
 * Time Complexity Analysis:
 * - setCart: O(1)
 * - addItem: O(n) where n = number of cart items (unavoidable)
 * - removeItem: O(n) - filter operation
 * - updateQuantity: O(n) - map operation
 * - Selectors: O(n) but memoized by React Query/components
 * 
 * Space Complexity: O(n) where n = number of cart items
 */
export const useCartStore = create<CartState>()(
  devtools(
    (set, get) => ({
      cart: null,
      isLoading: false,
      error: null,

      /**
       * Set entire cart (from API)
       * Time Complexity: O(1)
       */
      setCart: (cart) => 
        set({ cart, error: null }, false, 'cart/setCart'),

      /**
       * Add item to cart with merge logic
       * Time Complexity: O(n)
       * 
       * OPTIMIZATION: Single pass through items array
       */
      addItem: (item) =>
        set((state) => {
          if (!state.cart) {
            console.warn('[Cart] Cannot add item: cart is null');
            return { error: 'Cart not initialized' };
          }

          const existingIndex = state.cart.items.findIndex(
            (i) => i.product.id === item.product.id
          );

          let newItems: CartItemDTO[];
          
          if (existingIndex >= 0) {
            // Merge quantities for existing item
            const existing = state.cart.items[existingIndex];
            const newQuantity = existing.quantity + item.quantity;
            const newSubtotal = Number((existing.price * newQuantity).toFixed(2));
            
            newItems = [
              ...state.cart.items.slice(0, existingIndex),
              {
                ...existing,
                quantity: newQuantity,
                subtotal: newSubtotal,
              },
              ...state.cart.items.slice(existingIndex + 1),
            ];
          } else {
            // Add new item
            newItems = [...state.cart.items, item];
          }

          // Calculate total with precision (avoid floating point errors)
          const totalAmount = calcCartTotal(newItems);

          return {
            cart: {
              ...state.cart,
              items: newItems,
              totalAmount,
            },
            error: null,
          };
        }, false, 'cart/addItem'),

      /**
       * Remove item from cart
       * Time Complexity: O(n)
       */
      removeItem: (itemId) =>
        set((state) => {
          if (!state.cart) {
            console.warn('[Cart] Cannot remove item: cart is null');
            return { error: 'Cart not initialized' };
          }

          const newItems = state.cart.items.filter((item) => item.id !== itemId);
          
          const totalAmount = calcCartTotal(newItems);

          return {
            cart: {
              ...state.cart,
              items: newItems,
              totalAmount,
            },
            error: null,
          };
        }, false, 'cart/removeItem'),

      /**
       * Update item quantity
       * Time Complexity: O(n)
       */
      updateQuantity: (itemId, quantity) =>
        set((state) => {
          if (!state.cart) {
            console.warn('[Cart] Cannot update quantity: cart is null');
            return { error: 'Cart not initialized' };
          }

          if (quantity < 0) {
            console.warn('[Cart] Invalid quantity:', quantity);
            return { error: 'Quantity must be positive' };
          }

          const newItems = state.cart.items.map((item) => {
            if (item.id === itemId) {
              const newSubtotal = Number((item.price * quantity).toFixed(2));
              return {
                ...item,
                quantity,
                subtotal: newSubtotal,
              };
            }
            return item;
          });

          const totalAmount = calcCartTotal(newItems);

          return {
            cart: {
              ...state.cart,
              items: newItems,
              totalAmount,
            },
            error: null,
          };
        }, false, 'cart/updateQuantity'),

      /**
       * Clear cart
       * Time Complexity: O(1)
       */
      clearCart: () => 
        set({ cart: null, error: null }, false, 'cart/clearCart'),

      /**
       * Set loading state
       * Time Complexity: O(1)
       */
      setLoading: (isLoading) => 
        set({ isLoading }, false, 'cart/setLoading'),

      /**
       * Set error state
       * Time Complexity: O(1)
       */
      setError: (error) => 
        set({ error }, false, 'cart/setError'),
      
      // Backwards-compatible computed helpers
      getItemCount: () => {
        const cart = get().cart;
        return cart?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
      },
      getTotal: () => {
        const cart = get().cart;
        return cart?.totalAmount ?? 0;
      },
    }),
    { name: 'CartStore' }
  )
);

// ============================================================================
// Memoized Selectors (Use these in components)
// ============================================================================

/**
 * Select cart items count
 * 
 * USAGE IN COMPONENT:
 * ```tsx
 * const itemCount = useCartStore(selectCartItemCount);
 * ```
 * 
 * This prevents re-renders when other cart properties change.
 */
export const selectCartItemCount = (state: CartState): number =>
  state.cart?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

/**
 * Select cart total amount
 */
export const selectCartTotal = (state: CartState): number => 
  state.cart?.totalAmount ?? 0;

const EMPTY_ITEMS: CartItemDTO[] = [];

/**
 * Select cart items
 */
export const selectCartItems = (state: CartState): CartItemDTO[] => 
  state.cart?.items ?? EMPTY_ITEMS;

/**
 * Select cart loading state
 */
export const selectCartLoading = (state: CartState): boolean => 
  state.isLoading;

/**
 * Select cart error
 */
export const selectCartError = (state: CartState): string | null => 
  state.error;

/**
 * Check if cart is empty
 */
export const selectIsCartEmpty = (state: CartState): boolean =>
  !state.cart || (state.cart.items?.length ?? 0) === 0;

/**
 * Check if product is in cart
 */
export const selectIsProductInCart = (productId: number) => (state: CartState): boolean =>
  state.cart?.items.some((item) => item.product.id === productId) ?? false;

