'use client';

import { useSession } from 'next-auth/react';

export function useKeycloakAuth() {
  const { status } = useSession();
  
  return {
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    error: null as Error | null,
  };
}
