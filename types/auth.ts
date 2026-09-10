import type { Session } from 'next-auth';

export const USER_ROLES = {
  CUSTOMER: 'CUSTOMER',
  SELLER: 'SELLER',
  ADMIN: 'ADMIN',
  MODERATOR: 'MODERATOR',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export interface AppUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  roles: UserRole[];
  firstName: string;
  lastName: string;
}

export interface AppSession extends Session {
  user: AppUser;
  roles: UserRole[];
}

export interface CustomerSessionData {
  userId: string;
  userName: string;
}

export function isAppSession(session: unknown): session is AppSession {
  return (
    typeof session === 'object' &&
    session !== null &&
    'roles' in session &&
    Array.isArray((session as Record<string, unknown>).roles) &&
    'user' in session &&
    typeof (session as Record<string, unknown>).user === 'object'
  );
}

export function hasRole(session: unknown, role: UserRole): boolean {
  return isAppSession(session) && session.roles.includes(role);
}

export function extractCustomerData(
  session: unknown,
  requiredRole: UserRole = 'CUSTOMER'
): CustomerSessionData | null {
  if (!isAppSession(session)) return null;
  if (!session.roles.includes(requiredRole)) return null;
  return {
    userId: session.user.id,
    userName: session.user.name ?? 'Customer',
  };
}
