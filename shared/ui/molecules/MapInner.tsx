'use client'

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import type { MapProps } from './Map'

// Fix for default marker icons in Leaflet with Next.js
if (typeof window !== 'undefined') {
  const DefaultIcon = L.icon({
    iconUrl: '/images/marker-icon.png',
    shadowUrl: '/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  })

  L.Marker.prototype.options.icon = DefaultIcon
}

export default function MapInner({ center, zoom = 13, markers = [] }: MapProps) {
  return (
    <div className="h-64 w-full rounded-lg overflow-hidden border">
      <MapContainer 
        center={center} 
        zoom={zoom} 
        scrollWheelZoom={false} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((marker, index) => (
          <Marker key={index} position={marker.position}>
            {marker.label && <Popup>{marker.label}</Popup>}
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
