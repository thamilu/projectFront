import { components } from '@/shared/types/generated/api';

type RawUserRole = components['schemas']['RoleChangeRequest']['newRole'];

export const USER_ROLES = {
  ADMIN: 'ADMIN',
  CUSTOMER: 'CUSTOMER',
  SELLER: 'SELLER',
  DELIVERY_AGENT: 'DELIVERY_AGENT',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

// Compile-time assertion checking that USER_ROLES aligns with OpenAPI RawUserRole
const _userRoleCheck: Record<UserRole, RawUserRole> = {
  ADMIN: 'ADMIN',
  CUSTOMER: 'CUSTOMER',
  SELLER: 'SELLER',
  DELIVERY_AGENT: 'DELIVERY_AGENT',
};
