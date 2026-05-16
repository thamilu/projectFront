'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

// Leaflet accesses window — must never run on server
const MapInner = dynamic(() => import('./MapInner'), {
  ssr: false,
  loading: () => (
    <div className="h-64 w-full animate-pulse rounded-lg bg-muted flex items-center justify-center">
      <Skeleton className="h-full w-full" />
    </div>
  )
})

export interface MapProps {
  center: [number, number]
  zoom?: number
  markers?: Array<{
    position: [number, number]
    label?: string
  }>
}

export default function Map(props: MapProps) {
  return <MapInner {...props} />
}
