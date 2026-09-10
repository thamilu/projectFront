'use client';

import { useEffect, useRef, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { APP_ROUTES } from '@/shared/routes';
import { logger } from '@/core/telemetry/logger';
import { toast } from 'sonner';

interface UseSellerSessionSyncProps {
  status: string;
  isSeller: boolean;
  /** useAuth().refreshSession — always defined, never throws, returns success as a boolean. */
  refreshSession: (data?: Record<string, unknown>) => Promise<boolean>;
}

export function useSellerSessionSync({ status, isSeller, refreshSession }: UseSellerSessionSyncProps) {
  const router = useRouter();
  const syncAttempted = useRef(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Auto-sync when approved
  useEffect(() => {
    if (status !== 'SUCCESS' || isSeller || syncAttempted.current) return;

    syncAttempted.current = true;
    setIsSyncing(true);

    const sync = async () => {
      logger.debug('[SellerRegistration] Approved but role not synced. Refreshing session...');
      const success = await refreshSession({ forceSync: true, timestamp: Date.now() });
      if (success) {
        logger.debug('[SellerRegistration] Session update request sent.');
      } else {
        // refreshSession() itself never throws — a false return means the
        // lighter session update failed, so fall back to a full re-auth
        // round-trip as the last resort, matching prior behavior.
        logger.error('[SessionSync] Auto-sync failed — falling back to full sign-in');
        await signIn('keycloak', { redirect: false });
      }
      setIsSyncing(false);
    };

    void sync();
  }, [status, isSeller, refreshSession]);

  // Prefetch dashboard page on load to ensure seamless transition
  useEffect(() => {
    router.prefetch(APP_ROUTES.SELLER.DASHBOARD);
  }, [router]);

  // Redirect when role confirmed
  useEffect(() => {
    if (isSeller && status === 'SUCCESS') {
      logger.debug('[SellerRegistration] Role synced. Redirecting to dashboard...');
      router.push(APP_ROUTES.SELLER.DASHBOARD);
    }
  }, [isSeller, status, router]);

  // Manual force sync
  const handleForceSync = async () => {
    setIsSyncing(true);
    logger.debug('[SellerRegistration] Manual force permission sync initiated...');
    const success = await refreshSession({ forceSync: true, timestamp: Date.now() });
    if (success) {
      logger.debug('[SellerRegistration] Manual session sync completed successfully.');
      toast.success('Permissions synchronized successfully!');
    } else {
      logger.error('[SessionSync] Manual sync failed');
      toast.error('Sync failed. Redirecting to sign in...');
      await signIn('keycloak');
    }
    setIsSyncing(false);
  };

  return { isSyncing, handleForceSync };
}
