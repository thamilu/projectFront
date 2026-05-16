'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/use-auth';
import { APP_ROUTES } from '@/constants/routes/app-routes';
import { Loader2 } from 'lucide-react';

/**
 * Role-Based Redirect Component
 * 
 * Automatically redirects the user to their appropriate dashboard
 * based on their primary role.
 */
export function RoleBasedRedirect() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, isSeller, isDeliveryAgent } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push(APP_ROUTES.AUTH_LOGIN);
      return;
    }

    if (isSeller) {
      router.push(APP_ROUTES.SELLER.DASHBOARD);
    } else if (isDeliveryAgent) {
      router.push(APP_ROUTES.DELIVERY.DASHBOARD);
    } else {
      router.push(APP_ROUTES.DASHBOARD);
    }
  }, [isLoading, isAuthenticated, isSeller, isDeliveryAgent, router]);

  return (
    <div className="flex h-[50vh] w-full flex-col items-center justify-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground font-medium">
        Redirecting you to your dashboard...
      </p>
    </div>
  );
}
