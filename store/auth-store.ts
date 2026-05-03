import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { UserInfo, AuthState as AuthStateType } from '@/types/auth.types';

interface AuthState extends AuthStateType {
  // Actions
  setUser: (user: UserInfo | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  logout: () => void;
  reset: () => void;
}

const initialState: AuthStateType = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

/**
 * Transient Auth Store
 * 
 * NOTE: This store is now purely for transient UI state.
 * The source of truth for authentication is the NextAuth session.
 * We no longer persist this store to localStorage.
 */
export const useAuthStore = create<AuthState>()(
  devtools(
    (set) => ({
      ...initialState,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      setLoading: (isLoading) => set({ isLoading }),

      logout: () => {
        set(initialState);
      },

      reset: () => {
        set(initialState);
      },
    }),
    { name: 'auth-store' }
  )
);
