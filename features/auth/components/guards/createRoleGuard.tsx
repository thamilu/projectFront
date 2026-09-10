'use client';

import type { ComponentType, ReactNode } from 'react';
import { UserRole } from '@/domains/auth/contracts/auth.types';
import { AuthGuard } from './AuthGuard';

export interface RoleGuardProps {
  children: ReactNode;
  /** Overrides AuthGuard's default loading skeleton. */
  fallback?: ReactNode;
}

/**
 * Builds a single-role convenience wrapper around {@link AuthGuard}.
 *
 * Role-specific guards (CustomerGuard, DeliveryGuard, ...) are pure
 * compositions with no logic of their own — this factory is the single
 * implementation behind all of them, so adding a new role-gated area
 * never means hand-copying another near-identical file, and a role swap
 * typo can't slip into a divergent bespoke implementation.
 */
export function createRoleGuard(
  role: UserRole,
  displayName: string
): ComponentType<RoleGuardProps> {
  function RoleGuard({ children, fallback }: RoleGuardProps) {
    return (
      <AuthGuard requiredRole={role} fallback={fallback}>
        {children}
      </AuthGuard>
    );
  }
  RoleGuard.displayName = displayName;
  return RoleGuard;
}
