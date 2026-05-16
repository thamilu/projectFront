/**
 * Authentication Service [HARDEN]
 * 
 * Orchestrates complex authentication logic, token management, 
 * and session normalization outside of components/hooks.
 */

import { getSession, signIn, signOut } from 'next-auth/react';
import { logger } from '@/lib/observability/logger';
import { APP_ROUTES } from '@/constants/routes/app-routes';
import { UserRole } from '@/types';

export const authService = {
  /**
   * Normalizes the session data into a domain-friendly format
   */
  getNormalizedSession: async () => {
    try {
      const session = await getSession();
      if (!session) return null;

      return {
        user: session.user,
        accessToken: (session as any).accessToken,
        roles: (session as any).roles || [],
        expiresAt: (session as any).expiresAt,
      };
    } catch (error) {
      logger.error('Failed to get normalized session', { error });
      return null;
    }
  },

  /**
   * Orchestrates the login flow with optional redirect
   */
  initiateLogin: async (callbackUrl?: string) => {
    logger.info('Initiating login flow', { callbackUrl });
    try {
      await signIn('keycloak', { 
        callbackUrl: callbackUrl || window.location.pathname 
      });
    } catch (error) {
      logger.error('Login flow failed', { error });
      throw error;
    }
  },

  /**
   * Orchestrates the logout flow
   */
  initiateLogout: async (callbackUrl?: string) => {
    logger.info('Initiating logout flow');
    try {
      await signOut({ 
        callbackUrl: callbackUrl || APP_ROUTES.HOME 
      });
    } catch (error) {
      logger.error('Logout flow failed', { error });
      throw error;
    }
  },

  /**
   * Checks if the user has specific roles
   */
  checkPermissions: (userRoles: string[], requiredRoles: UserRole[] | string[]): boolean => {
    if (!requiredRoles.length) return true;
    return requiredRoles.some(role => userRoles.includes(role));
  },

  /**
   * Resolves the primary dashboard route for a user based on roles
   */
  resolveDashboardRoute: (roles: string[]): string => {
    if (roles.includes(UserRole.SELLER)) return APP_ROUTES.SELLER.DASHBOARD;
    if (roles.includes(UserRole.DELIVERY_AGENT)) return APP_ROUTES.DELIVERY.DASHBOARD;
    return APP_ROUTES.DASHBOARD;
  }
};
