'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { APP_ROUTES } from '@/constants/routes/app-routes';
import { useAuth } from '@/hooks/use-auth-nextauth';
import { signIn } from 'next-auth/react';
import { sellerProfileApi } from '@/features/seller/api/seller-profile-api';
import { toast } from 'sonner';

interface SellerGuardProps {
  children: React.ReactNode;
}

/**
 * SellerGuard - Centralized route protection for sellers
 * Enforces that a user has a SELLER role.
 */
export function SellerGuard({ children }: SellerGuardProps) {
  console.log('[SellerGuard] Component MOUNTING - Top Level');
  const { user, isLoading: isAuthLoading, isAuthenticated } = useAuth();

  // Derived state
  const isUnauthenticated = !isAuthenticated;

  const router = useRouter();
  const pathname = usePathname();

  const roles = (user?.roles || []).map((r: string) => r.toUpperCase());
  const isSeller = roles.includes('SELLER');
  // Use startsWith to be safe against trailing slashes or sub-routes
  const isOnboardPath = pathname?.startsWith('/seller/register');

  useEffect(() => {
    let isMounted = true;

    async function verifySellerStatus() {
      // 1. Default auth check
      if (isUnauthenticated) {
        router.push(APP_ROUTES.AUTH_LOGIN);
        return;
      }

      // 2. Allow onboarding path for everyone authenticated
      if (isOnboardPath) {
        return;
      }

      // 3. Prevent redirect loops when navigating AWAY from the seller layout
      if (pathname && !pathname.startsWith('/seller')) {
        return;
      }

      // 4. For other seller paths, check SELLER role
      if (isSeller) {
        return; // All good
      }

      // 5. ROLE MISSING - Deep check with backend before redirecting
      console.log('[SellerGuard] Role missing, checking backend status...');
      try {
        const profile = await sellerProfileApi.getMyProfile();
        if (!isMounted) return;

        if (profile?.status?.toUpperCase() === 'ACTIVE') {
          console.log('[SellerGuard] Found ACTIVE backend profile but NO role. Refreshing session...');
          toast.info('Synchronizing account status...', {
            description: 'We found your verified seller profile. Updating your session roles.',
          });

          // Trigger session refresh via Keycloak (will re-run JWT callback)
          signIn('keycloak', { redirect: false });
          return;
        }

        // If not active, but we're on a dashboard route, redirect to registration
        console.log('[SellerGuard] Access denied (No active profile). Redirecting to onboarding.');
        router.push(APP_ROUTES.SELLER.REGISTER);
      } catch (error: any) {
        const status = error?.status || error?.response?.status;
        console.error('[SellerGuard] Profile fetch error:', {
          status,
          message: error?.message || error?.response?.data?.message,
          error
        });

        // Handle 403 Forbidden specifically as a sync issue
        const hasAttemptedSync = sessionStorage.getItem('seller_sync_attempted') === 'true';

        if (status === 403 && !hasAttemptedSync) {
          console.log('[SellerGuard] 403 Forbidden - Role sync issue suspected. Attempting refresh...');
          sessionStorage.setItem('seller_sync_attempted', 'true');
          toast.info('Synchronizing account...', {
            description: 'Updating your seller permissions.',
          });

          // Re-authenticating with Keycloak will pull fresh roles into the JWT
          signIn('keycloak', { callbackUrl: pathname || APP_ROUTES.SELLER.DASHBOARD });
          return;
        }

        if (isMounted) {
          router.push(APP_ROUTES.SELLER.REGISTER);
        }
      }
    }

    if (!isAuthLoading) {
      verifySellerStatus();
    }

    return () => {
      isMounted = false;
    };
  }, [isAuthLoading, isUnauthenticated, isSeller, isOnboardPath, router, pathname]);

  // If we're on the onboarding page, don't block (otherwise we get infinite loops)
  if (isOnboardPath) {
    return <>{children}</>;
  }

  if (isAuthLoading) {
    return (
      <div className="flex min-h-96 flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="text-muted-foreground animate-pulse font-medium">
          Verifying seller status...
        </p>
      </div>
    );
  }

  // User is authenticated and has the SELLER role
  return <>{children}</>;
}
