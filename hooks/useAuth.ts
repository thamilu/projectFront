/**
 * @deprecated Use `@/hooks/use-auth` instead.
 * This file is the legacy Zustand-store-based auth hook.
 * The canonical hook is `hooks/use-auth.ts` (NextAuth / fetch-based).
 */
// src/hooks/useAuth.ts
import { useEffect } from 'react';
import { logger } from '@/lib/observability/logger';
import { useAuthStore } from '@/store/auth-store';
import { authService } from '@/services/authService';
import { tokenStorage } from '@/lib/axios';

export const useAuth = () => {
  const { user, isAuthenticated, isLoading, setUser, setAuthenticated, setLoading } = useAuthStore();
  
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        
        // Check if user is authenticated
        if (authService.isAuthenticated()) {
          // Fetch current user
          const userData = await authService.getCurrentUser();
          setUser(userData);
          setAuthenticated(true);
        } else {
          setAuthenticated(false);
          setUser(null);
        }
      } catch (error: unknown) {
        logger.error('Auth initialization error:', { error });
        setAuthenticated(false);
        setUser(null);
        tokenStorage.clearTokens();
      } finally {
        setLoading(false);
      }
    };
    
    initializeAuth();
  }, [setUser, setAuthenticated, setLoading]);
  
  return {
    user,
    isAuthenticated,
    isLoading,
  };
};
