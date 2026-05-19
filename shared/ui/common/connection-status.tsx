/**
 * Real-Time Connection Status Indicator Component
 */

'use client'

import { Wifi, WifiOff } from 'lucide-react'
import { Badge } from '@/shared/ui/atoms/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui/atoms/tooltip'
import { useWebSocketStatus, useOrderUpdates } from '@/features/orders/hooks/use-order-updates'

export function ConnectionStatus() {
  const { isConnected } = useWebSocketStatus()

  if (!isConnected) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="gap-1 border-destructive text-destructive">
              <WifiOff className="h-3 w-3" />
              Offline
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Real-time updates disconnected</p>
            <p className="text-xs text-muted-foreground">
              Attempting to reconnect...
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="gap-1 border-green-500 text-green-700">
            <Wifi className="h-3 w-3" />
            Live
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Real-time updates active</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * Order Status Live Badge
 */
interface OrderStatusLiveBadgeProps {
  orderId: string
  initialStatus: string
}

export function OrderStatusLiveBadge({
  orderId,
  initialStatus,
}: OrderStatusLiveBadgeProps) {
  const { status, isConnected } = useOrderUpdates(orderId)

  const currentStatus = status || initialStatus

  return (
    <div className="flex items-center gap-2">
      <Badge>{currentStatus}</Badge>
      {isConnected && (
        <Badge variant="secondary" className="gap-1 text-xs">
          <Wifi className="h-2 w-2" />
          Live
        </Badge>
      )}
    </div>
  )
}
