import { useCallback, useState, useMemo } from 'react';
import { useAuth } from '@/domains/auth/hooks/use-auth';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { navigation } from '@/shared/utils/navigation';
import { AUTH_CONFIG } from '@/core/config';
import { APP_ROUTES } from '@/shared/routes';

/**
 * Custom hook encapsulating authentication-related business logic for the Header.
 * Returns a stable memoized object reference to prevent child component re-renders.
 */
export function useHeaderAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    user: currentUser,
    isAuthenticated: isUserAuthenticated,
    login,
    logout,
    isSeller,
    isDeliveryAgent,
  } = useAuth();

  const [isPending, setIsPending] = useState(false);

  const handleLogin = useCallback(async () => {
    setIsPending(true);
    try {
      await login(navigation.getCurrentPath());
    } catch (_error) {
      toast.error('Failed to sign in. Please try again.');
      const currentHref = navigation.getCurrentHref();
      const loginUrl = AUTH_CONFIG.keycloakLoginUrl;
      const fallbackUrl = `${loginUrl}${loginUrl.includes('?') ? '&' : '?'}redirect=${encodeURIComponent(currentHref)}`;
      navigation.hardRedirect(fallbackUrl);
    } finally {
      setIsPending(false);
    }
  }, [login]);

  const handleLogout = useCallback(async () => {
    setIsPending(true);
    try {
      queryClient.clear();
      await logout();
      toast.success('Successfully signed out');
    } catch (_error) {
      toast.error('Sign out failed. Redirecting to login.');
      queryClient.clear();
      router.push(APP_ROUTES.AUTH_LOGIN);
    } finally {
      setIsPending(false);
    }
  }, [logout, queryClient, router]);

  return useMemo(
    () => ({
      currentUser,
      isUserAuthenticated,
      isSeller,
      isDeliveryAgent,
      isPending,
      handleLogin,
      handleLogout,
    }),
    [currentUser, isUserAuthenticated, isSeller, isDeliveryAgent, isPending, handleLogin, handleLogout]
  );
}

export type UseHeaderAuthReturn = ReturnType<typeof useHeaderAuth>;
