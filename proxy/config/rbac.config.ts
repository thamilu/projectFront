import { APP_ROUTES } from '@/shared/routes';

export interface RbacRule {
  /** Route prefix this rule applies to */
  prefix: string;
  /** Required role to access non-onboard paths */
  requiredRole: string;
  /** Onboarding path that bypasses role check */
  onboardPath?: string;
  /** Where to redirect if role check fails */
  redirectTo: string;
  /** Where to redirect if user already has the role (on onboard path) */
  alreadyEnrolledRedirect?: string;
}

/**
 * Deliberately no rule for customer-facing pages (/account, /cart, /orders,
 * /wishlist, etc.). A CUSTOMER-role rule existed here previously, but its
 * prefix ('/customer') never matched any real path — those pages live
 * under the app/(customer) route GROUP, which adds no URL segment — so it
 * was silently dead code, not an enforced restriction. Confirmed as the
 * intended policy (not just an accident worth preserving): any
 * authenticated user, regardless of role, may use customer-facing pages —
 * a seller or delivery agent can also shop as a customer. Authentication
 * itself (not role) is still enforced for these paths by
 * proxy/handlers/auth-guard.ts's PROTECTED_ROUTE_PREFIXES. If a future
 * requirement needs a real customer-only restriction, add a rule here with
 * the actual resolved path prefixes (/account, /cart, /checkout, /orders,
 * /wishlist, /dashboard, /settings, /notifications), not '/customer'.
 */
export const RBAC_RULES: readonly RbacRule[] = [
  {
    prefix: '/seller',
    requiredRole: 'SELLER',
    onboardPath: APP_ROUTES.SELLER.REGISTER,
    redirectTo: APP_ROUTES.SELLER.REGISTER,
    alreadyEnrolledRedirect: APP_ROUTES.SELLER.DASHBOARD,
  },
  {
    prefix: '/delivery',
    requiredRole: 'DELIVERY_AGENT',
    redirectTo: APP_ROUTES.AUTH_LOGIN,
  },
  {
    prefix: '/admin',
    requiredRole: 'ADMIN',
    redirectTo: APP_ROUTES.AUTH_LOGIN,
  },
] as const;
