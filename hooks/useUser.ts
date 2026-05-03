// src/hooks/useUser.ts
import { useQuery } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/auth-store';

export const useUser = () => {
  const { isAuthenticated } = useAuthStore();
  
  return useQuery({
    queryKey: ['user'],
    queryFn: () => authService.getCurrentUser(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
