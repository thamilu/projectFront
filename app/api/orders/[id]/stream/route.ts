/**
 * Server-Sent Events (SSE) Route for Order Updates
 * 
 * Alternative to WebSocket for one-way server-to-client updates
 * Better for simple use cases where bidirectional communication isn't needed
 * 
 * Usage: EventSource API on client-side
 */

import { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { getRequestLogger } from '@/lib/observability/logger'

/**
 * GET /api/orders/[id]/stream
 * 
 * Stream order updates using Server-Sent Events
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(request: NextRequest, context: any) {
  const paramsObj = await Promise.resolve(context?.params);
  const orderId = String(paramsObj?.id || '');
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID()
  const log = getRequestLogger(requestId)

  try {
    // Verify authentication
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    if (!token) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Verify user owns this order
    // This would typically query your database
    // const order = await verifyOrderOwnership(orderId, token.sub!)

    log.info('Client connected to order stream', {
      orderId,
      userId: token.sub,
    })

    // Create a readable stream
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder()

        // Send initial connection message
        const connectMessage = {
          type: 'connected',
          orderId,
          timestamp: new Date().toISOString(),
        }
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(connectMessage)}\n\n`)
        )

        // Heartbeat to keep connection alive
        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(': heartbeat\n\n'))
          } catch (_error) {
            clearInterval(heartbeat)
          }
        }, 30000) // Every 30 seconds

        // Subscribe to order updates (pseudo-code - implement with Redis Pub/Sub or similar)
        const subscription = subscribeToOrderUpdates(orderId, (update: unknown) => {
          try {
            const message = {
              type: 'update',
              data: update,
              timestamp: new Date().toISOString(),
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(message)}\n\n`))

            const updateType = typeof update === 'object' && update !== null && 'type' in (update as Record<string, unknown>)
              ? (update as Record<string, unknown>).type
              : undefined

            log.info('Order update sent via SSE', { orderId, updateType })
          } catch (error) {
            log.error('Failed to send SSE update', { error, orderId })
          }
        })

        // Cleanup on client disconnect
        request.signal.addEventListener('abort', () => {
          log.info('Client disconnected from order stream', { orderId })
          clearInterval(heartbeat)
          unsubscribeFromOrderUpdates(orderId, subscription)
          controller.close()
        })
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
      },
    })
  } catch (error) {
    log.error('SSE stream error', { error, orderId })
    return new Response('Internal Server Error', { status: 500 })
  }
}

/**
 * Subscribe to order updates (implementation depends on your backend)
 * This could use:
 * - Redis Pub/Sub
 * - Database triggers with polling
 * - Message queue (RabbitMQ, Kafka)
 */
function subscribeToOrderUpdates(
  orderId: string,
  _callback: (update: unknown) => void
): string {
  // Implementation example with Redis Pub/Sub:
  // const redis = new Redis(process.env.REDIS_URL)
  // redis.subscribe(`order:${orderId}`)
  // redis.on('message', (channel, message) => {
  //   callback(JSON.parse(message))
  // })
  // return subscriptionId

  // For now, return a mock subscription ID
  return `sub_${orderId}_${Date.now()}`
}

/**
 * Unsubscribe from order updates
 */
function unsubscribeFromOrderUpdates(orderId: string, subscriptionId: string): void {
  // Implementation depends on your backend
  // redis.unsubscribe(`order:${orderId}`)
  const log = getRequestLogger()
  log.info('Unsubscribed from order updates', { orderId, subscriptionId })
}
