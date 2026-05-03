'use client';

import { MapPin, Navigation, Package, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';

const MapComponent = dynamic(() => import('@/components/ui/map-component'), { ssr: false });


const ASSIGNMENTS = [
  { id: '1', orderId: 'ORD-9921', customer: 'Priya S.', address: '12 MG Road, Bangalore', distance: '3.2 km', eta: '15 mins', status: 'En Route' },
  { id: '2', orderId: 'ORD-9845', customer: 'Rahul M.', address: '45 Koramangala, Bangalore', distance: '5.8 km', eta: '25 mins', status: 'Pending' },
];

export default function DeliveryMapPage() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="container mx-auto max-w-3xl px-4 py-10"
    >
      <h1 className="mb-6 text-2xl font-bold">Delivery Map</h1>

      {/* Map Implementation */}
      <div className="mb-6 h-64 rounded-xl border bg-muted w-full overflow-hidden shadow-sm">
        <MapComponent 
          center={[12.9716, 77.5946]} 
          zoom={12} 
          markers={[
            { position: [12.9716, 77.5946], popupContent: '12 MG Road' },
            { position: [12.9352, 77.6245], popupContent: '45 Koramangala' }
          ]} 
        />
      </div>


      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> Today's Assignments</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {ASSIGNMENTS.map(a => (
              <div key={a.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{a.orderId}</p>
                      <Badge className={a.status === 'En Route'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-xs'
                        : 'bg-muted text-muted-foreground text-xs'}>
                        {a.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{a.customer}</p>
                    <p className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" /> {a.address}
                    </p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" /> ETA: {a.eta} · {a.distance}
                    </p>
                  </div>
                  <Button size="sm" className="gap-1" asChild>
                    <a href={`https://maps.google.com?q=${encodeURIComponent(a.address)}`} target="_blank" rel="noopener noreferrer">
                      <Navigation className="h-3.5 w-3.5" /> Navigate
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
