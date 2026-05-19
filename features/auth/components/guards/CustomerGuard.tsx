'use client';

import { ReactNode } from 'react';
import { AuthGuard } from './AuthGuard';

export function CustomerGuard({ children }: { children: ReactNode }) {
  return (
    <AuthGuard requiredRoles={['CUSTOMER']}>
      {children}
    </AuthGuard>
  );
}
