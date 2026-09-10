/**
 * Enterprise Auth Guard Component
 *
 * Wraps child components and enforces authentication/authorization
 * requirements. Automatically redirects to login if unauthenticated.
 */

'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { Skeleton } from '@/shared/ui/atoms/skeleton';
import { APP_ROUTES } from '@/shared/routes';
import { logger } from '@/core/telemetry/logger';
import { UserRole } from '@/domains/auth/contracts/auth.types';
import { useAuth } from '@/domains/auth/hooks/use-auth';

export interface AuthGuardProps {
  children: ReactNode;
  /** Required roles (user must have at least one) */
  requiredRoles?: UserRole[];
  /** Required single role (convenience prop matching user specification) */
  requiredRole?: UserRole;
  /** Custom loading fallback */
  fallback?: ReactNode;
}

/**
 * Protects routes and components with authentication and role requirements.
 *
 * Return-URL is handled by useAuth().login() itself, not by this
 * component: called with no callbackUrl argument (as below), it defaults
 * to `window.location.pathname` internally — the user lands back on
 * whatever page they were trying to reach, not a generic default. See
 * use-auth.tsx's login() implementation; do not re-derive/pass a pathname
 * here too, that would just duplicate what's already the default.
 *
 * @example
 * ```tsx
 * // Require authentication only
 * <AuthGuard>
 *   <AccountDashboard />
 * </AuthGuard>
 *
 * // Require specific roles
 * <AuthGuard requiredRoles={[UserRole.SELLER, UserRole.DELIVERY_AGENT]}>
 *   <SellerOrDeliveryPanel />
 * </AuthGuard>
 * ```
 */
export function AuthGuard({
  children,
  requiredRoles = [],
  requiredRole,
  fallback,
}: AuthGuardProps) {
  const { isAuthenticated, isLoading, hasAnyRole, login, user } = useAuth();
  const router = useRouter();
  // Guards against duplicate login() calls if the effect re-runs in quick
  // succession (React Strict Mode's dev-only double-invoke, or a brief
  // isLoading/isAuthenticated flicker around a token refresh) — matches
  // the same ref-guard pattern already used in useAuthRedirect.ts and the
  // login page's own attempt tracking, for the same reason: without it,
  // each re-run would fire an independent, redundant sign-in request.
  const loginTriggered = useRef(false);

  const rolesToCheck = useMemo(
    () => (requiredRole ? [...requiredRoles, requiredRole] : requiredRoles),
    [requiredRoles, requiredRole]
  );

  const isUnauthorized =
    !isLoading && isAuthenticated && rolesToCheck.length > 0 && !hasAnyRole(rolesToCheck);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !loginTriggered.current) {
      loginTriggered.current = true;
      login();
    }
  }, [isLoading, isAuthenticated, login]);

  // Navigation is a side effect — it must never run during render (the
  // previous version called router.push directly in the render body,
  // which is a real anti-pattern: it can log "Cannot update a component
  // while rendering a different component" warnings, double-fires under
  // Strict Mode, and re-fires on every unrelated re-render before the
  // navigation actually completes). router.replace (not push) so a
  // rejected user pressing Back doesn't land right back on this protected
  // page and get redirected again — /unauthorized isn't currently wrapped
  // by any guard (confirmed: it lives under app/(public)/), so this can't
  // loop today, but replace is still the correct choice regardless.
  useEffect(() => {
    if (isUnauthorized) {
      logger.warn('[AuthGuard] Redirecting to /unauthorized due to missing roles', {
        required: rolesToCheck,
        userRoles: user?.roles,
      });
      router.replace(APP_ROUTES.UNAUTHORIZED);
    }
  }, [isUnauthorized, router, rolesToCheck, user?.roles]);

  // Show loading state
  if (isLoading) {
    return (
      fallback ?? (
        <div
          role="status"
          aria-live="polite"
          aria-busy="true"
          aria-label="Checking authentication…"
          className="flex min-h-screen items-center justify-center"
        >
          <div className="space-y-4">
            <Skeleton className="h-12 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
      )
    );
  }

  // Not authenticated - login effect will trigger, or the role-mismatch
  // effect will redirect to /unauthorized — either way, render nothing
  // while that's pending rather than briefly flashing protected content.
  if (!isAuthenticated || isUnauthorized) {
    return null;
  }

  return <>{children}</>;
}
