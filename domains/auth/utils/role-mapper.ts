import { UserRole } from '@/domains/auth/contracts/auth.types';

const ROLE_MAPPINGS: ReadonlyMap<string, UserRole> = new Map([
  ['SELLER', UserRole.SELLER],
  ['ROLE_SELLER', UserRole.SELLER],
  ['DELIVERY_AGENT', UserRole.DELIVERY_AGENT],
  ['ROLE_DELIVERY_AGENT', UserRole.DELIVERY_AGENT],
  ['DELIVERY', UserRole.DELIVERY_AGENT],
  ['CUSTOMER', UserRole.CUSTOMER],
  ['ROLE_CUSTOMER', UserRole.CUSTOMER],
]);

export function mapUserRole(rawRole: string | string[] | undefined | null): UserRole | null {
  if (!rawRole) return null;
  const roleString = Array.isArray(rawRole) ? rawRole[0] : rawRole;
  const normalized = roleString.toString().toUpperCase().trim();
  return ROLE_MAPPINGS.get(normalized) ?? null;
}
