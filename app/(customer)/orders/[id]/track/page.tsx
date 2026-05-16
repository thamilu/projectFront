'use client';

import { use } from 'react';
import { CheckCircle2, Clock, Package, Truck, MapPin, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';

const MapComponent = dynamic(() => import('@/components/ui/map-component'), { ssr: false });

const STEPS = [
  { key: 'placed', label: 'Order Placed', icon: CheckCircle2 },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
  { key: 'packed', label: 'Packed', icon: Package },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: MapPin },
];

const MOCK_EVENTS = [
  { time: '2026-02-25 10:30', status: 'Out for delivery', location: 'Bangalore Hub' },
  { time: '2026-02-25 06:00', status: 'Reached delivery hub', location: 'Bangalore Sortation' },
  { time: '2026-02-24 22:00', status: 'In transit', location: 'Chennai Warehouse' },
  { time: '2026-02-24 14:00', status: 'Packed & dispatched', location: 'Seller Warehouse' },
  { time: '2026-02-24 09:00', status: 'Order confirmed', location: 'E-Shop' },
];

export default function OrderTrackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const currentStep = 3; // 0-indexed: 3 = Shipped

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="container mx-auto max-w-2xl px-4 py-10"
    >
      <h1 className="mb-1 text-2xl font-bold">Track Order</h1>
      <p className="mb-6 text-sm text-muted-foreground">Order ID: #{id}</p>

      {/* Progress Steps */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative flex justify-between">
            {/* Connector line */}
            <div className="absolute left-0 right-0 top-5 h-0.5 bg-muted" />
            <div
              className="absolute left-0 top-5 h-0.5 bg-primary transition-all"
              style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
            />
            {STEPS.map((step, i) => {
              const done = i <= currentStep;
              const Icon = step.icon;
              return (
                <div key={step.key} className="relative flex flex-col items-center gap-2">
                  <div className={`z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 ${done ? 'border-primary bg-primary text-primary-foreground' : 'border-muted bg-background text-muted-foreground'}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className={`text-xs font-medium ${done ? 'text-primary' : 'text-muted-foreground'}`}>{step.label}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Estimated Delivery */}
      <Card className="mb-6 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
        <CardContent className="flex items-center gap-3 pt-5">
          <Clock className="h-5 w-5 text-green-600" />
          <div>
            <p className="font-semibold text-green-800 dark:text-green-300">Expected delivery: Today by 8 PM</p>
            <p className="text-sm text-green-700 dark:text-green-400">Your package is out for delivery</p>
          </div>
        </CardContent>
      </Card>

      {/* Map View */}
      <div className="mb-6 h-64 rounded-xl border bg-muted w-full overflow-hidden shadow-sm">
        <MapComponent 
          center={[12.9716, 77.5946]} 
          zoom={12} 
          markers={[
            { position: [12.9716, 77.5946], popupContent: 'Your Location' },
            { position: [12.9352, 77.6245], popupContent: 'Delivery Agent' }
          ]} 
        />
      </div>

      {/* Delivery Agent */}
      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">Delivery Agent</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="font-medium">Ravi Kumar</p>
            <p className="text-sm text-muted-foreground">DeliveryPro · Agent ID #DA-4821</p>
          </div>
          <a href="tel:+919876543210" className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted">
            <Phone className="h-4 w-4" /> Call
          </a>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader><CardTitle className="text-base">Tracking Timeline</CardTitle></CardHeader>
        <CardContent>
          <div className="relative space-y-4 pl-6">
            <div className="absolute left-2 top-0 h-full w-px bg-muted" />
            {MOCK_EVENTS.map((e, i) => (
              <div key={i} className="relative">
                <div className={`absolute -left-4 top-1 h-3 w-3 rounded-full border-2 ${i === 0 ? 'border-primary bg-primary' : 'border-muted bg-background'}`} />
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className={`text-sm font-medium ${i === 0 ? 'text-primary' : ''}`}>{e.status}</p>
                    <p className="text-xs text-muted-foreground">{e.location}</p>
                  </div>
                  <p className="shrink-0 text-xs text-muted-foreground">{e.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
