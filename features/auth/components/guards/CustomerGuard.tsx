'use client';

import { UserRole } from '@/domains/auth/contracts/auth.types';
import { createRoleGuard } from './createRoleGuard';

/** Restricts access to authenticated users with the CUSTOMER role. */
export const CustomerGuard = createRoleGuard(UserRole.CUSTOMER, 'CustomerGuard');
