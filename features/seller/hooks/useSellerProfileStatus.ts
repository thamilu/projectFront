import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';
import { sellerProfileApi } from '@/features/seller/api/seller-profile-api';
import { getLocalPendingFlag, setLocalPendingFlag } from '../utils/storage';
import { getNormalizedRoles, type AppSession } from '../utils/auth';
import { APP_ROUTES } from '@/constants/routes/app-routes';

export type SellerFormStatus = 'IDLE' | 'SUBMITTING' | 'SUCCESS' | 'PENDING' | 'CHECKING';

export function useSellerProfileStatus(
  session: AppSession | null,
  initialStatus?: Extract<SellerFormStatus, 'IDLE' | 'PENDING' | 'SUCCESS'>
) {
  const router = useRouter();
  const [status, setStatus] = useState<SellerFormStatus>(initialStatus ?? 'CHECKING');

  useEffect(() => {
    let cancelled = false;

    async function checkExistingProfile() {
      if (!session) {
        setStatus((current) => (current === 'CHECKING' ? 'IDLE' : current));
        return;
      }

      const hasLocalPending = getLocalPendingFlag();
      // Only set status to PENDING initially if we don't have a reliable initialStatus from the server
      if (hasLocalPending && !cancelled && initialStatus !== 'IDLE') {
        setStatus('PENDING');
      }

      const normalizedRoles = getNormalizedRoles(session);
      const isCustomer =
        normalizedRoles.includes('CUSTOMER') ||
        normalizedRoles.includes('USER') ||
        normalizedRoles.includes('BUYER') ||
        normalizedRoles.length === 0;

      if (!isCustomer && !normalizedRoles.includes('SELLER')) {
        toast.error('Only customers can request seller role', {
          description: 'Please create a customer account first.',
        });
        setStatus('IDLE');
        return;
      }

      try {
        let profile = await sellerProfileApi.getMyProfile();

        if (!profile) {
          const profileExists = await sellerProfileApi.profileExists();
          if (profileExists) {
            setLocalPendingFlag(true);
            if (!cancelled) setStatus('PENDING');
            return;
          } else {
            setLocalPendingFlag(false);
            if (!cancelled) setStatus('IDLE');
            return;
          }
        }

        const currentStatus = String(profile?.status || '').toUpperCase();

        if (currentStatus === 'PENDING') {
          setLocalPendingFlag(true);
          if (!cancelled) setStatus('PENDING');
        } else if (currentStatus === 'ACTIVE') {
          setLocalPendingFlag(false);
          if (!cancelled) {
            setStatus('SUCCESS');

            if (normalizedRoles.includes('SELLER')) {
              toast.success('Account verified!', { description: 'Redirecting to your dashboard...' });
              router.push(APP_ROUTES.SELLER.DASHBOARD);
            } else {
              toast.info('Session update required', {
                description: 'Please click the sync button to finalize your permissions',
              });
            }
          }
          return;
        } else if (currentStatus === 'REJECTED') {
          setLocalPendingFlag(false);
          toast.error('Application Rejected', {
            description: 'Your previous seller application was rejected.',
          });
          if (!cancelled) setStatus('IDLE');
        } else {
          if (!cancelled) setStatus(hasLocalPending ? 'PENDING' : 'IDLE');
        }
      } catch (error: any) {
        const status = error?.status || error?.response?.status;
        const hasLocalPendingAfterError = getLocalPendingFlag();

        const hasAttemptedSync = sessionStorage.getItem('seller_sync_attempted') === 'true';
        if (status === 403 && !hasAttemptedSync) {
          sessionStorage.setItem('seller_sync_attempted', 'true');
          toast.info('Synchronizing account...', {
            description: 'Checking for updated seller permissions.',
          });
          signIn('keycloak', { callbackUrl: window.location.pathname });
          return;
        }

        if (status === 401) {
          setStatus(hasLocalPendingAfterError ? 'PENDING' : 'IDLE');
        } else {
          try {
            const exists = await sellerProfileApi.profileExists();
            if (exists && !cancelled) {
              setLocalPendingFlag(true);
              setStatus('PENDING');
              return;
            } else if (!exists && !cancelled) {
              setLocalPendingFlag(false);
              setStatus('IDLE');
            }
          } catch (existsError: any) {
            if (getLocalPendingFlag() && !cancelled) {
              setStatus('PENDING');
              return;
            }
          }
          setStatus(getLocalPendingFlag() ? 'PENDING' : 'IDLE');
        }
      }
    }

    checkExistingProfile();

    return () => {
      cancelled = true;
    };
  }, [session, router, initialStatus]);

  return { status, setStatus };
}
