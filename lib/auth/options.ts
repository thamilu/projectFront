import { type NextAuthOptions } from 'next-auth';
import KeycloakProvider from 'next-auth/providers/keycloak';
import { getKeycloakConfig } from '@/lib/auth/env-config';
import {
  refreshAccessToken as refreshToken,
  logoutFromKeycloak,
  extractRoles,
  shouldRefreshToken,
} from '@/lib/auth/token-service';
import { logger } from '@/lib/observability/logger';

// Validate environment configuration at module load
const keycloakConfig = getKeycloakConfig();

// Log configuration in development to help debug issues
if (process.env.NODE_ENV === 'development') {
  logger.debug('[NextAuth] Configuration loaded', {
    clientId: keycloakConfig.clientId,
    issuer: keycloakConfig.issuer,
    hasClientSecret: !!keycloakConfig.clientSecret,
    nextAuthUrl: process.env.NEXTAUTH_URL,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
  });
}

export const authOptions: NextAuthOptions = {
  providers: [
    KeycloakProvider({
      clientId: keycloakConfig.clientId,
      clientSecret: keycloakConfig.clientSecret ?? undefined,
      issuer: keycloakConfig.issuer,
      authorization: {
        params: {
          scope: 'openid email profile',
        },
      },
      // Configure for public client with PKCE
      client: {
        token_endpoint_auth_method: 'none',
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  callbacks: {
    async redirect({ url, baseUrl }) {
      // If there's an error parameter, redirect to home instead of showing error page
      try {
        const urlObj = new URL(url);
        if (urlObj.searchParams.has('error')) {
          return baseUrl;
        }
      } catch {
        // Invalid URL, continue with default logic
      }

      // Prevent redirect loops - if redirecting to signin, go home instead
      if (url.includes('/auth/signin') || url.includes('/api/auth/signin')) {
        return baseUrl;
      }

      // Allow relative URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`;

      // Allow URLs on the same origin (with proper error handling)
      try {
        const urlObj = new URL(url);
        const baseUrlObj = new URL(baseUrl);
        if (urlObj.origin === baseUrlObj.origin) return url;
      } catch (error) {
        // Invalid URL, fall through to default
        logger.debug('Redirect URL parsing failed:', { url, error });
      }

      // After successful login, always redirect to home page
      // The RoleBasedRedirect component on the home page will handle
      // redirecting to appropriate dashboard based on user role
      return baseUrl;
    },

    async jwt({ token, account }) {
      // Initial sign in - store tokens and expiry
      if (account?.access_token) {
        const expiresIn = typeof account.expires_in === 'number' ? account.expires_in : 300; // Default 5 minutes if not provided
        const roles = extractRoles(account.access_token);

        logger.info('[Auth/JWT] roles extracted', {
          count: roles.length,
          roles: roles.length > 0 ? roles : 'none',
        });
        logger.debug('[Auth/JWT] token expires in', { expiresIn });

        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: account.expires_at
            ? account.expires_at * 1000
            : Date.now() + expiresIn * 1000,
          roles: roles,
          error: undefined,
        };
      }

      // ❌ CRITICAL: Don't refresh if no refresh token exists (no user logged in)
      if (!token.refreshToken) {
        return token;
      }

      // ✅ FIX: Return previous token if not expired - don't refresh on EVERY request
      // Only refresh when token is actually about to expire (within buffer time)
      if (!shouldRefreshToken(token.accessTokenExpires)) {
        // Ensure roles are uppercased even for existing sessions (self-healing)
        if (token.roles) {
          token.roles = token.roles.map((r: string) => r.toUpperCase());
        }
        return token;
      }

      // Token is expiring soon - refresh it with validation and error handling (public client)
      logger.info('[Auth/JWT] Token expiring soon, refreshing...');
      logger.info('[auth] Refreshing access token', {
        expiresAt: token.accessTokenExpires
          ? new Date(token.accessTokenExpires).toISOString()
          : 'unknown',
      });

      const refreshedToken = await refreshToken(token, {
        issuer: keycloakConfig.issuer,
        clientId: keycloakConfig.clientId,
        // Public client - no clientSecret needed
      });

      if (refreshedToken.error) {
        logger.error('[Auth/JWT] Token refresh failed', { error: refreshedToken.error });
      } else {
        logger.info('[Auth/JWT] Token refreshed successfully');
        logger.debug('[Auth/JWT] New roles', { roles: refreshedToken.roles || 'none' });
      }

      return refreshedToken;
    },

    async session({ session, token }) {
      // If there's a token error (expired/invalid), clear the session
      if (token.error) {
        logger.warn('[Auth/Session] Session has error', { error: token.error });
        logger.warn('[auth] Session has error, user needs to re-authenticate', {
          error: token.error,
          expiresAt: token.accessTokenExpires
            ? new Date(token.accessTokenExpires).toISOString()
            : 'unknown',
        });
        // Return minimal session to force re-login
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session as any).error = token.error;
        return {
          ...session,
          error: token.error,
          user: undefined,
        };
      }

      logger.debug('[Auth/Session] Building session', {
        user: token.email,
        roles: token.roles || 'none',
      });

      // Expose necessary data to session
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (session as any).roles = token.roles;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (session as any).error = token.error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (session as any).expiresAt = token.accessTokenExpires;

      // Add roles and id to user object for easy access
      if (session.user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).id = token.sub ?? '';
        if (token.roles) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (session.user as any).roles = token.roles;
        }
      }

      // Expose accessToken for server-side usage via getServerSession().
      // NOTE: With NextAuth JWT sessions, this still lives in the session cookie.
      // Keep the session payload minimal to avoid cookie chunking.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (session as any).accessToken = token.accessToken;

      return session;
    },
  },

  events: {
    async signOut({ token }) {
      // Revoke Keycloak refresh token with retry logic
      if (token?.refreshToken) {
        const result = await logoutFromKeycloak(
          token.refreshToken as string,
          {
            issuer: keycloakConfig.issuer,
            clientId: keycloakConfig.clientId,
            // Public client - no clientSecret needed
          },
          2 // max retries
        );

        if (!result.success) {
          logger.error('Keycloak logout failed:', { error: result.error });
        }
      }
    },
  },

  debug: process.env.NODE_ENV === 'development',
};
