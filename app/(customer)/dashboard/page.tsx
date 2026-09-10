'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { APP_ROUTES } from '@/shared/routes';
import { useAuth } from '@/domains/auth/hooks/use-auth';

/**
 * /dashboard — Role-based redirect hub.
 * Sends users to their respective dashboard based on their role:
 * - SELLER        → /seller
 * - DELIVERY_AGENT → /delivery
 * - CUSTOMER/default → / (home) — there is no dedicated customer dashboard
 *   page; see app/(customer)/account/page.tsx for the customer's "my
 *   account" hub if that's what's actually wanted here instead.
 *
 * Deliberately does NOT call authService.resolveDashboardRoute() (the
 * app's single source of truth for this same role→route decision — see
 * features/auth/services/role-dashboard-map.ts): that function's
 * DEFAULT_DASHBOARD_ROUTE is literally APP_ROUTES.DASHBOARD, i.e. this
 * page's own route — using it here for the customer/no-match case would
 * redirect this page to itself. Uses useAuth()'s validated isSeller/
 * isDeliveryAgent (backed by mapUserRole()'s allowlist) instead of raw,
 * unchecked session.roles strings, so this stays consistent with every
 * other role check in the app without reintroducing that self-redirect risk.
 */
export default function DashboardRedirectPage() {
  const { isAuthenticated, isLoading, isSeller, isDeliveryAgent } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace(APP_ROUTES.AUTH_LOGIN);
      return;
    }

    if (isSeller) {
      router.replace(APP_ROUTES.SELLER.DASHBOARD);
    } else if (isDeliveryAgent) {
      router.replace(APP_ROUTES.DELIVERY.DASHBOARD);
    } else {
      router.replace(APP_ROUTES.HOME);
    }
  }, [isLoading, isAuthenticated, isSeller, isDeliveryAgent, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-muted-foreground flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">Redirecting to your dashboard…</p>
      </div>
    </div>
  );
}
