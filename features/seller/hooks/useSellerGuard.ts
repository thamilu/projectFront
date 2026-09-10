'use client';

import { useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';
import { sellerApi } from '@/features/seller/api/seller-api';
import { APP_ROUTES } from '@/shared/routes';
import { SELLER_ROLE, SELLER_STATUS } from '@/domains/seller/contracts/seller.constants';
import { logger } from '@/shared/utils/logger';
import { getHttpStatus } from '@/shared/utils/error-utils';

interface UseSellerGuardParams {
  isAuthLoading: boolean;
  isAuthenticated: boolean;
  roles: string[];
  isOnboardPath: boolean;
  pathname: string | null;
}

/**
 * Hook to manage seller authentication guard checks and role synchronizations.
 * Handles race conditions using AbortController and component mount references.
 * Resolves 403 authorization failures with structured, in-memory sync retries.
 */
export function useSellerGuard({
  isAuthLoading,
  isAuthenticated,
  roles,
  isOnboardPath,
  pathname,
}: UseSellerGuardParams) {
  const router = useRouter();
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const syncAttemptRef = useRef(0);

  const isSeller = useMemo(() => roles.some((r) => r.toUpperCase() === SELLER_ROLE), [roles]);

  useEffect(() => {
    isMountedRef.current = true;
    abortControllerRef.current = new AbortController();

    async function verifySellerStatus() {
      // 1. Default auth check (handled by middleware, but client-side safety net)
      if (!isAuthenticated) {
        router.push(APP_ROUTES.AUTH_LOGIN);
        return;
      }

      // 2. Skip guard checks on registration/onboarding paths or non-seller layouts
      if (isOnboardPath) return;
      if (!pathname?.startsWith('/seller')) return;

      // 3. User is authorized as seller, all good
      if (isSeller) return;

      // 4. Role missing - verify backend status to recover active profile
      logger.debug('Role missing — verifying backend profile', {
        component: 'SellerGuard',
      });

      try {
        const profile = await sellerApi.getMyProfile({
          signal: abortControllerRef.current?.signal,
        });

        if (!isMountedRef.current) return;

        if (profile?.status?.toUpperCase() === SELLER_STATUS.ACTIVE) {
          logger.debug('Active profile found — refreshing session', {
            component: 'SellerGuard',
          });
          toast.info('Synchronizing account status...', {
            description: 'Updating your session roles.',
          });

          const result = await signIn('keycloak', { redirect: false });
          if (!isMountedRef.current) return;

          if (result?.error) {
            logger.error('Session refresh failed', {
              component: 'SellerGuard',
              error: result.error,
            });
            toast.error('Session refresh failed. Please sign in again.');
            router.push(APP_ROUTES.AUTH_LOGIN);
          } else {
            toast.success('Session updated. Welcome back!');
          }
          return;
        }

        // If no active profile, redirect to onboarding registration
        logger.debug('No active profile found — redirecting to registration', {
          component: 'SellerGuard',
        });
        if (isMountedRef.current) {
          router.push(APP_ROUTES.SELLER.REGISTER);
        }
      } catch (error: unknown) {
        if ((error as Error).name === 'AbortError') return;
        if (!isMountedRef.current) return;

        const status = getHttpStatus(error);
        logger.error('Seller profile verification failed', {
          component: 'SellerGuard',
          status,
          error: error instanceof Error ? error.message : String(error),
        });

        // Resolve 403 Forbidden specifically with a single in-memory role sync attempt
        if (status === 403 && syncAttemptRef.current < 1) {
          syncAttemptRef.current += 1;
          toast.info('Synchronizing account...', {
            description: 'Updating your seller permissions.',
          });
          await signIn('keycloak', {
            callbackUrl: pathname ?? APP_ROUTES.SELLER.DASHBOARD,
          });
          return;
        }

        router.push(APP_ROUTES.SELLER.REGISTER);
      }
    }

    if (!isAuthLoading) {
      verifySellerStatus();
    }

    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, [isAuthLoading, isAuthenticated, isSeller, isOnboardPath, pathname, router]);

  return { isSeller };
}
