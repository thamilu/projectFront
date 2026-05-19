'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import { APP_ROUTES } from '@/shared/constants/routes/app-routes';

/**
 * /dashboard — Role-based redirect hub.
 * Sends users to their respective dashboard based on their role:
 * - SELLER        → /seller
 * - DELIVERY_AGENT → /delivery
 * - CUSTOMER/default → /customer/dashboard
 */
export default function DashboardRedirectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      router.replace(APP_ROUTES.AUTH_LOGIN);
      return;
    }

    const roles: string[] = (session as any)?.roles ?? [];

    if (roles.includes('SELLER')) {
      router.replace(APP_ROUTES.SELLER.DASHBOARD);
    } else if (roles.includes('DELIVERY_AGENT')) {
      router.replace(APP_ROUTES.DELIVERY.DASHBOARD);
    } else {
      router.replace(APP_ROUTES.HOME);
    }
  }, [session, status, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">Redirecting to your dashboard…</p>
      </div>
    </div>
  );
}
