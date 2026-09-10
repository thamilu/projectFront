/**
 * WebSocket Client for Real-Time Updates
 *
 * Provides real-time communication for:
 * - Order status updates
 * - Inventory changes
 * - Cart synchronization
 * - Admin notifications
 */

import { io, Socket } from 'socket.io-client';
import { logger } from '@/core/telemetry/logger';
import { env } from '@/env';

type EventHandler = (...args: unknown[]) => void;
/** Mints a fresh, single-use WebSocket connection ticket — see /api/ws-ticket. */
type TicketProvider = () => Promise<string>;

class WebSocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private eventHandlers: Map<string, Set<EventHandler>> = new Map();

  /**
   * Initialize WebSocket connection.
   *
   * @param ticketProvider - Fetches a fresh ticket (see /api/ws-ticket)
   * rather than accepting a static string. Connection tickets are
   * single-use and short-lived (~45s) — socket.io-client's built-in
   * reconnection logic (reconnection: true below) would otherwise retry
   * using the SAME already-consumed ticket on every reconnect attempt,
   * failing every single time after the first network blip. Passing `auth`
   * as a function (socket.io-client's documented mechanism for exactly
   * this) makes it re-invoke ticketProvider() on every (re)connection
   * attempt instead of once at construction time.
   */
  connect(userId: string, ticketProvider: TicketProvider): void {
    if (this.socket?.connected || this.isConnecting) {
      logger.info('WebSocket already connected or connecting');
      return;
    }

    this.isConnecting = true;
    const wsUrl = env.NEXT_PUBLIC_WS_URL || 'http://localhost:8090';

    logger.info('Connecting to WebSocket', { wsUrl, userId });

    this.socket = io(wsUrl, {
      auth: (cb) => {
        ticketProvider()
          .then((ticket) => cb({ ticket }))
          .catch((error) => {
            logger.error('Failed to obtain WebSocket ticket', {
              error: error instanceof Error ? error.message : String(error),
            });
            // Signal socket.io-client to abort this attempt rather than
            // connecting with no credential at all.
            cb({});
          });
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
      timeout: 20000,
    });

    this.setupEventListeners(userId);
    this.isConnecting = false;
  }

  /**
   * Setup WebSocket event listeners
   */
  private setupEventListeners(userId: string): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      logger.info('WebSocket connected', {
        socketId: this.socket?.id,
        userId,
      });
      this.reconnectAttempts = 0;

      // Subscribe to user-specific channel
      this.socket?.emit('subscribe', {
        channel: `user:${userId}`,
        timestamp: new Date().toISOString(),
      });

      // Re-register all event handlers. Idempotent via off() before on():
      // socket.io-client reuses the same Socket instance across automatic
      // reconnects (reconnection: true above never creates a new one), and
      // on() below already attaches a handler immediately whenever a socket
      // exists — so a handler registered before this 'connect' handler ever
      // ran (or one still attached from a prior connection) would otherwise
      // pick up a second, duplicate registration here, firing every event
      // twice (and more on each subsequent reconnect). off() is a no-op if
      // the handler isn't already attached, so this stays correct either way.
      this.eventHandlers.forEach((handlers, event) => {
        handlers.forEach((handler) => {
          this.socket?.off(event, handler);
          this.socket?.on(event, handler);
        });
      });
    });

    this.socket.on('disconnect', (reason: unknown) => {
      logger.warn('WebSocket disconnected', { reason, userId });

      if (reason === 'io server disconnect') {
        // Server disconnected - need manual reconnection
        this.socket?.connect();
      }
    });

    this.socket.on('connect_error', (error: unknown) => {
      this.reconnectAttempts++;
      const errMsg = (error as Error)?.message ?? String(error ?? 'unknown');
      logger.error('WebSocket connection error', {
        error: errMsg,
        attempts: this.reconnectAttempts,
        maxAttempts: this.maxReconnectAttempts,
      });

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        logger.error('Max WebSocket reconnection attempts reached');
        this.disconnect();
      }
    });

    this.socket.on('error', (error: unknown) => {
      logger.error('WebSocket error', { error });
    });
  }

  /**
   * Subscribe to an event
   */
  on(event: string, handler: EventHandler): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }

    this.eventHandlers.get(event)!.add(handler);
    this.socket?.on(event, handler);

    // Return unsubscribe function
    return () => {
      this.off(event, handler);
    };
  }

  /**
   * Unsubscribe from an event
   */
  off(event: string, handler: EventHandler): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.eventHandlers.delete(event);
      }
    }

    this.socket?.off(event, handler);
  }

  /**
   * Emit an event to server
   */
  emit(event: string, data: unknown): void {
    if (!this.socket?.connected) {
      logger.warn('Cannot emit - WebSocket not connected', { event });
      return;
    }

    logger.info('Emitting WebSocket event', { event, data });
    this.socket.emit(event, data);
  }

  /**
   * Subscribe to order updates
   */
  subscribeToOrder(orderId: string): void {
    this.emit('subscribe', { channel: `order:${orderId}` });
  }

  /**
   * Unsubscribe from order updates
   */
  unsubscribeFromOrder(orderId: string): void {
    this.emit('unsubscribe', { channel: `order:${orderId}` });
  }

  /**
   * Subscribe to cart updates
   */
  subscribeToCart(userId: string): void {
    this.emit('subscribe', { channel: `cart:${userId}` });
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      logger.info('Disconnecting WebSocket');
      this.socket.disconnect();
      this.socket = null;
      this.eventHandlers.clear();
      this.reconnectAttempts = 0;
    }
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get socket ID
   */
  getSocketId(): string | undefined {
    return this.socket?.id;
  }
}

// Singleton instance
export const wsClient = new WebSocketClient();

// Event type definitions
export interface OrderStatusUpdateEvent {
  orderId: string;
  status: string;
  previousStatus: string;
  timestamp: string;
  message?: string;
}

export interface TrackingUpdateEvent {
  orderId: string;
  tracking: {
    carrier: string;
    trackingNumber: string;
    url?: string;
    status: string;
    estimatedDelivery?: string;
  };
  timestamp: string;
}

export interface InventoryUpdateEvent {
  productId: string;
  sku: string;
  stock: number;
  previousStock: number;
  timestamp: string;
}

export interface CartUpdateEvent {
  userId: string;
  action: 'item_added' | 'item_removed' | 'item_updated' | 'cart_cleared';
  productId?: string;
  quantity?: number;
  timestamp: string;
}
