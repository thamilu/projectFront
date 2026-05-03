/**
 * Custom hook for Server-Sent Events (SSE)
 * 
 * Alternative to WebSocket for real-time updates
 * Simpler but one-way communication only
 */

'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { logger } from '@/lib/observability/logger'

interface UseSSEOptions {
  enabled?: boolean
  reconnect?: boolean
  reconnectInterval?: number
}

export function useSSE<T = unknown>(
  url: string | null,
  options: UseSSEOptions = {}
) {
  const {
    enabled = true,
    reconnect = true,
    reconnectInterval = 3000,
  } = options

  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const connect = useCallback(() => {
    if (!url || !enabled) return

    logger.info('Connecting to SSE', { url })

    const eventSource = new EventSource(url)
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      logger.info('SSE connected', { url })
      setIsConnected(true)
      setError(null)
    }

    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data)
        setData(parsed)
        logger.info('SSE message received', { data: parsed })
      } catch (err) {
        logger.error('Failed to parse SSE message', { error: err })
      }
    }

    eventSource.onerror = (err) => {
      logger.error('SSE error', { error: err })
      setIsConnected(false)
      setError(new Error('SSE connection failed'))

      eventSource.close()
      eventSourceRef.current = null

      // Attempt reconnection
      if (reconnect) {
        reconnectTimeoutRef.current = setTimeout(() => {
          logger.info('Attempting SSE reconnection', { url })
          connect()
        }, reconnectInterval)
      }
    }

    return eventSource
  }, [url, enabled, reconnect, reconnectInterval])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }

    if (eventSourceRef.current) {
      logger.info('Disconnecting SSE')
      eventSourceRef.current.close()
      eventSourceRef.current = null
      setIsConnected(false)
    }
  }, [])

  useEffect(() => {
    if (enabled && url) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [url, enabled, connect, disconnect])

  return {
    data,
    error,
    isConnected,
    disconnect,
    reconnect: connect,
  }
}

/**
 * Hook for order updates via SSE
 */
export function useOrderStream(orderId: string | null) {
  const url = orderId ? `/api/orders/${orderId}/stream` : null

  type OrderStreamPayload = {
    type: 'connected' | 'update'
    data?: Record<string, unknown>
    orderId?: string
    timestamp: string
  }

  const { data, isConnected, error } = useSSE<OrderStreamPayload>(url)

  const [status, setStatus] = useState<string | null>(null)
  const [tracking, setTracking] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    if (!data) return

    if (data.type === 'update') {
      const update = data.data

      if (update?.status && typeof update.status === 'string') {
        setStatus(update.status as string)
      }

      if (update?.tracking && typeof update.tracking === 'object') {
        setTracking(update.tracking as Record<string, unknown>)
      }
    }
  }, [data])

  return {
    status,
    tracking,
    isConnected,
    error,
    lastUpdate: data?.timestamp,
  }
}
