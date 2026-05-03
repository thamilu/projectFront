/**
 * Custom hook for real-time order updates via WebSocket
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import {
  wsClient,
  OrderStatusUpdateEvent,
  TrackingUpdateEvent,
} from '@/lib/realtime/websocket-client'
// OrderStatus type may be defined in orders feature; fallback to string
// import { OrderStatus } from '@/features/orders/types/order.types'
import { toast } from 'sonner'
import { logger } from '@/lib/observability/logger'

export function useOrderUpdates(orderId: string) {
  const { data: session } = useSession()
  const [status, setStatus] = useState<string | null>(null)
  const [tracking, setTracking] = useState<Record<string, unknown> | null>(null)
  const [lastUpdate, setLastUpdate] = useState<string | null>(null)

  useEffect(() => {
    if (!session?.accessToken || !orderId || !session.user?.id) return

    // Connect WebSocket
    wsClient.connect(session.user.id, session.accessToken)

    // Subscribe to order-specific updates
    wsClient.subscribeToOrder(orderId)

    logger.info('Subscribed to order updates', { orderId })

    // Handle status updates
    const unsubscribeStatus = wsClient.on(
      `order:${orderId}:status_changed`,
      (...args: unknown[]) => {
        const data = args[0] as OrderStatusUpdateEvent;
        logger.info('Order status updated', { payload: data })
        setStatus(data.status)
        setLastUpdate(data.timestamp)

        // Show user-friendly notification
        const statusMessages: Record<string, string> = {
          CONFIRMED: 'Your order has been confirmed!',
          PROCESSING: 'Your order is being processed',
          SHIPPED: 'Your order has been shipped!',
          DELIVERED: 'Your order has been delivered!',
          CANCELLED: 'Your order has been cancelled',
        }

        const message = statusMessages[data.status] || `Order status: ${data.status}`
        toast.success(message)
      }
    )

    // Handle tracking updates
    const unsubscribeTracking = wsClient.on(
      `order:${orderId}:tracking_updated`,
      (...args: unknown[]) => {
        const data = args[0] as TrackingUpdateEvent;
        logger.info('Tracking information updated', { payload: data })
        const trackingData = data.tracking as Record<string, unknown> | undefined
        if (trackingData) setTracking(trackingData)
        setLastUpdate(data.timestamp)

        toast.info('Tracking information updated', {
          description: `Carrier: ${data.tracking.carrier}`,
        })
      }
    )

    // Cleanup on unmount
    return () => {
      unsubscribeStatus()
      unsubscribeTracking()
      wsClient.unsubscribeFromOrder(orderId)
      logger.info('Unsubscribed from order updates', { orderId })
    }
  }, [orderId, session])

  return {
    status,
    tracking,
    lastUpdate,
    isConnected: wsClient.isConnected(),
  }
}

/**
 * Hook for real-time inventory updates
 */
export function useInventoryUpdates(productId: string) {
  const [stock, setStock] = useState<number | null>(null)
  const [lastUpdate, setLastUpdate] = useState<string | null>(null)

  useEffect(() => {
    if (!productId) return

    const unsubscribe = wsClient.on(
      `product:${productId}:stock_changed`,
      (...args: unknown[]) => {
        const data = args[0] as Record<string, unknown>;
        logger.info('Stock updated', { payload: data })
        const stockVal = data.stock as unknown
        const ts = data.timestamp as string | undefined
        if (typeof stockVal === 'number') setStock(stockVal)
        if (ts) setLastUpdate(ts)

        if (typeof stockVal === 'number') {
          if (stockVal === 0) {
            toast.warning('This product is now out of stock')
          } else if (stockVal < 10) {
            toast.info(`Only ${stockVal} items left in stock!`)
          }
        }
      }
    )

    return () => {
      unsubscribe()
    }
  }, [productId])

  return {
    stock,
    lastUpdate,
  }
}

/**
 * Hook for real-time cart synchronization
 */
export function useCartSync() {
  const { data: session } = useSession()
  const [syncedAt, setSyncedAt] = useState<string | null>(null)

  const syncCart = useCallback(() => {
    if (!session?.user?.id) return

    wsClient.emit('sync_cart', {
      userId: session.user.id,
      timestamp: new Date().toISOString(),
    })
  }, [session])

  useEffect(() => {
    if (!session?.accessToken || !session.user?.id) return

    wsClient.connect(session.user.id, session.accessToken)
    wsClient.subscribeToCart(session.user.id)

    const unsubscribe = wsClient.on(
      `cart:${session.user.id}:updated`,
      (...args: unknown[]) => {
        const data = args[0] as Record<string, unknown>;
        logger.info('Cart synced from another device', { payload: data })
        const ts = data.timestamp as string | undefined
        if (ts) setSyncedAt(ts)

        toast.info('Cart updated from another device', {
          description: 'Refreshing cart...',
        })

        // Trigger cart refresh
        window.dispatchEvent(new CustomEvent('cart:sync'))
      }
    )

    return () => {
      unsubscribe()
    }
  }, [session])

  return {
    syncCart,
    syncedAt,
  }
}

/**
 * Hook for WebSocket connection status
 */
export function useWebSocketStatus() {
  const [isConnected, setIsConnected] = useState(false)
  const { data: session } = useSession()

  useEffect(() => {
    if (!session?.accessToken) return

    const checkConnection = setInterval(() => {
      setIsConnected(wsClient.isConnected())
    }, 1000)

    return () => {
      clearInterval(checkConnection)
    }
  }, [session])

  return { isConnected }
}
