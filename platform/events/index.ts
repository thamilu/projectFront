import { logger } from '@/core/telemetry/logger';

/**
 * Enterprise Decoupled Event System Types
 */
export interface AppEvents {
  CartUpdated: {
    cartId: string;
    itemCount: number;
    totalAmount: number;
  };
  CheckoutStarted: {
    cartId: string;
    totalAmount: number;
  };
  OrderPlaced: {
    orderId: string;
    totalAmount: number;
    items: Array<{ productId: number; quantity: number }>;
  };
  SearchExecuted: {
    query: string;
    resultsCount: number;
  };
  SellerRegistered: {
    sellerId: number;
    shopName: string;
  };
  ProductViewed: {
    productId: number;
    name: string;
    categoryId: number;
  };
}

export type EventKey = keyof AppEvents;
export type EventCallback<K extends EventKey> = (payload: AppEvents[K]) => void;

class EventBus {
  private listeners: { [K in EventKey]?: Array<EventCallback<K>> } = {};

  /**
   * Publish an event to all registered subscribers
   */
  publish<K extends EventKey>(event: K, payload: AppEvents[K]): void {
    logger.info(`📢 [EventBus] Publishing event "${event}"`, { payload });
    
    const callbacks = this.listeners[event];
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(payload);
        } catch (error) {
          logger.error(`❌ [EventBus] Error in subscriber callback for "${event}"`, { error: String(error) });
        }
      });
    }
  }

  /**
   * Subscribe to an event. Returns an unsubscribe function.
   */
  subscribe<K extends EventKey>(event: K, callback: EventCallback<K>): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }

    this.listeners[event]!.push(callback);

    // Return an unsubscribe handler for easy cleanup in useEffect hooks
    return () => {
      this.unsubscribe(event, callback);
    };
  }

  /**
   * Unsubscribe from an event
   */
  unsubscribe<K extends EventKey>(event: K, callback: EventCallback<K>): void {
    const callbacks = this.listeners[event];
    if (callbacks) {
      this.listeners[event] = callbacks.filter((cb) => cb !== callback) as any;
    }
  }
}

export const eventBus = new EventBus();
export default eventBus;
