'use client';

import { ReactNode } from 'react';
import { AuthGuard } from '@/features/auth/components/guards/AuthGuard';

export function DeliveryGuard({ children }: { children: ReactNode }) {
  return (
    <AuthGuard requiredRoles={['DELIVERY_AGENT']}>
      {children}
    </AuthGuard>
  );
}
