// src/hooks/useLogin.ts
import { useMutation } from '@tanstack/react-query';
import { logger } from '@/lib/observability/logger';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AxiosError } from 'axios';

import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/auth-store';
import { LoginRequest, TokenResponse } from '@/types/auth.types';

type UseLoginOptions = {
  redirectTo?: string | null;
  disableRedirect?: boolean;
  onSuccess?: (data: TokenResponse) => void;
  onError?: (error: unknown) => void;
};

interface ApiErrorResponse {
  message?: string;
  error?: string;
  status?: number;
}

export const useLogin = (options: UseLoginOptions = {}) => {
  const router = useRouter();
  const { setUser, setTokens, setAuthenticated } = useAuthStore();

  return useMutation<TokenResponse, AxiosError<ApiErrorResponse>, LoginRequest>({
    mutationFn: (credentials: LoginRequest) => authService.login(credentials),
    onSuccess: async (data) => {
      try {
        setTokens(data.access_token, data.refresh_token);
        const userInfo = await authService.getCurrentUser();
        setUser(userInfo);
        setAuthenticated(true);
        toast.success('Login successful!');

        if (!options.disableRedirect) {
          // Role-based redirect: customers go to home page, others to dashboard
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const role = (userInfo as any)?.role || (userInfo as any)?.roles?.[0];
            const isCustomer =
              role === 'CUSTOMER' ||
              role === 'customer' ||
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (Array.isArray((userInfo as any)?.roles) && (userInfo as any).roles.includes('CUSTOMER'));

            const target = options.redirectTo ?? (isCustomer ? '/' : '/customer/dashboard');
            router.push(target);
          } catch (_e) {
            // Fallback to previous default if anything goes wrong
            router.push(options.redirectTo ?? '/customer/dashboard');
          }
        }

        options.onSuccess?.(data);
      } catch (error) {
        logger.error('Error fetching user info:', { error });
        toast.error('Login successful but failed to fetch user info');
      }
    },
    onError: (error) => {
      logger.error('Login error:', { error });

      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Invalid username or password';

      toast.error(message);
      options.onError?.(error);
    },
  });
};
