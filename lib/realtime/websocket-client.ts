/**
 * WebSocket Client for Real-Time Updates
 * 
 * Provides real-time communication for:
 * - Order status updates
 * - Inventory changes
 * - Cart synchronization
 * - Admin notifications
 */

import { io, Socket } from 'socket.io-client'
import { logger } from '@/lib/observability/logger'

type EventHandler = (...args: unknown[]) => void

class WebSocketClient {
  private socket: Socket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private isConnecting = false
  private eventHandlers: Map<string, Set<EventHandler>> = new Map()

  /**
   * Initialize WebSocket connection
   */
  connect(userId: string, token: string): void {
    if (this.socket?.connected || this.isConnecting) {
      logger.info('WebSocket already connected or connecting')
      return
    }

    this.isConnecting = true
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8082'

    logger.info('Connecting to WebSocket', { wsUrl, userId })

    this.socket = io(wsUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
      timeout: 20000,
    })

    this.setupEventListeners(userId)
    this.isConnecting = false
  }

  /**
   * Setup WebSocket event listeners
   */
  private setupEventListeners(userId: string): void {
    if (!this.socket) return

    this.socket.on('connect', () => {
      logger.info('WebSocket connected', {
        socketId: this.socket?.id,
        userId,
      })
      this.reconnectAttempts = 0

      // Subscribe to user-specific channel
      this.socket?.emit('subscribe', {
        channel: `user:${userId}`,
        timestamp: new Date().toISOString(),
      })

      // Re-register all event handlers
      this.eventHandlers.forEach((handlers, event) => {
        handlers.forEach((handler) => {
          this.socket?.on(event, handler)
        })
      })
    })

    this.socket.on('disconnect', (reason: unknown) => {
      logger.warn('WebSocket disconnected', { reason, userId })

      if (reason === 'io server disconnect') {
        // Server disconnected - need manual reconnection
        this.socket?.connect()
      }
    })

    this.socket.on('connect_error', (error: unknown) => {
      this.reconnectAttempts++
      const errMsg = (error as Error)?.message ?? String(error ?? 'unknown')
      logger.error('WebSocket connection error', {
        error: errMsg,
        attempts: this.reconnectAttempts,
        maxAttempts: this.maxReconnectAttempts,
      })

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        logger.error('Max WebSocket reconnection attempts reached')
        this.disconnect()
      }
    })

    this.socket.on('error', (error: unknown) => {
      logger.error('WebSocket error', { error })
    })
  }

  /**
   * Subscribe to an event
   */
  on(event: string, handler: EventHandler): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set())
    }

    this.eventHandlers.get(event)!.add(handler)
    this.socket?.on(event, handler)

    // Return unsubscribe function
    return () => {
      this.off(event, handler)
    }
  }

  /**
   * Unsubscribe from an event
   */
  off(event: string, handler: EventHandler): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.delete(handler)
      if (handlers.size === 0) {
        this.eventHandlers.delete(event)
      }
    }

    this.socket?.off(event, handler)
  }

  /**
   * Emit an event to server
   */
  emit(event: string, data: unknown): void {
    if (!this.socket?.connected) {
      logger.warn('Cannot emit - WebSocket not connected', { event })
      return
    }

    logger.info('Emitting WebSocket event', { event, data })
    this.socket.emit(event, data)
  }

  /**
   * Subscribe to order updates
   */
  subscribeToOrder(orderId: string): void {
    this.emit('subscribe', { channel: `order:${orderId}` })
  }

  /**
   * Unsubscribe from order updates
   */
  unsubscribeFromOrder(orderId: string): void {
    this.emit('unsubscribe', { channel: `order:${orderId}` })
  }

  /**
   * Subscribe to cart updates
   */
  subscribeToCart(userId: string): void {
    this.emit('subscribe', { channel: `cart:${userId}` })
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      logger.info('Disconnecting WebSocket')
      this.socket.disconnect()
      this.socket = null
      this.eventHandlers.clear()
      this.reconnectAttempts = 0
    }
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.socket?.connected || false
  }

  /**
   * Get socket ID
   */
  getSocketId(): string | undefined {
    return this.socket?.id
  }
}

// Singleton instance
export const wsClient = new WebSocketClient()

// Event type definitions
export interface OrderStatusUpdateEvent {
  orderId: string
  status: string
  previousStatus: string
  timestamp: string
  message?: string
}

export interface TrackingUpdateEvent {
  orderId: string
  tracking: {
    carrier: string
    trackingNumber: string
    url?: string
    status: string
    estimatedDelivery?: string
  }
  timestamp: string
}

export interface InventoryUpdateEvent {
  productId: string
  sku: string
  stock: number
  previousStock: number
  timestamp: string
}

export interface CartUpdateEvent {
  userId: string
  action: 'item_added' | 'item_removed' | 'item_updated' | 'cart_cleared'
  productId?: string
  quantity?: number
  timestamp: string
}
