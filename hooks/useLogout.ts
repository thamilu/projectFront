// src/hooks/useLogout.ts
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth-store';
import { queryClient } from '@/lib/query-client';
import { logger } from '@/lib/observability/logger';
import { logoutAndRedirect } from '@/lib/auth/client-logout';
import { APP_ROUTES } from '@/constants/routes/app-routes';

export const useLogout = () => {
  const { logout: clearAuthState } = useAuthStore();
  
  return useMutation({
    mutationFn: () => logoutAndRedirect({ redirectTo: APP_ROUTES.AUTH_LOGIN }),
    onSuccess: () => {
      // Clear auth state
      clearAuthState();
      
      // Clear all queries
      queryClient.clear();
      
      toast.success('Logged out successfully');
    },
    onError: (error: unknown) => {
      logger.error('Logout error:', { error });
      // Even if logout fails, clear local state
      clearAuthState();
      queryClient.clear();
    },
  });
};
