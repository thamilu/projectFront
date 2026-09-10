'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '../skeleton';

interface MapProps {
  center: [number, number];
  zoom?: number;
  markers?: Array<{ position: [number, number]; popupContent: string }>;
  className?: string;
}

// Dynamically import the inner map component (with Leaflet dependencies) only on client side
const DynamicMapInner = dynamic(() => import('./map-component-inner'), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 w-full items-center justify-center rounded-xl bg-slate-100">
      <Skeleton className="h-full w-full rounded-xl" />
    </div>
  ),
});

export default function MapComponent(props: MapProps) {
  return <DynamicMapInner {...props} />;
}
