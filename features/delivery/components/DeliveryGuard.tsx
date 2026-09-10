'use client';

import { UserRole } from '@/domains/auth/contracts/auth.types';
import { createRoleGuard } from '@/features/auth/components/guards/createRoleGuard';

/** Restricts access to authenticated users with the DELIVERY_AGENT role. */
export const DeliveryGuard = createRoleGuard(UserRole.DELIVERY_AGENT, 'DeliveryGuard');
