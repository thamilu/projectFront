// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { DefaultSession, DefaultUser } from 'next-auth';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { JWT, DefaultJWT } from 'next-auth/jwt';
import { UserRole } from '@/domains/auth/contracts/auth.types';
import type { AuthErrorCode, BackendRoleErrorCode } from '@/lib/auth/types';

/**
 * NextAuth v5 type augmentations.
 *
 * SINGLE SOURCE OF TRUTH for Session, User, and JWT type extensions.
 * Do NOT declare these module augmentations in any other file.
 *
 * Key security decision: `accessToken` is NOT on Session — it is only
 * available server-side via the JWT token (accessed via auth() or getToken()).
 */
declare module 'next-auth' {
  interface Session extends DefaultSession {
    /** Auth error state (e.g. RefreshAccessTokenError). Undefined when healthy. */
    error?: AuthErrorCode;
    /** Keycloak + backend-merged roles. Always an array (empty if no roles). */
    roles?: string[];
    /**
     * Error from backend role fetch. Undefined when healthy. Declared as a
     * required (always-present) key rather than optional: the session()
     * callback always assigns it explicitly, so its value — not its
     * presence — is what distinguishes "confirmed no error" from "unknown."
     * `roles: []` alone is ambiguous between "confirmed zero roles" and
     * "role fetch failed, degraded"; always reading this alongside `roles`
     * is what disambiguates the two before making an authorization decision.
     */
    backendRoleError: BackendRoleErrorCode | undefined;
    /** Expiry timestamp of the access token in seconds. */
    expiresAt?: number;
    user: {
      id: string;
      roles: string[];
      firstName: string;
      lastName: string;
      phone?: string;
    } & DefaultSession['user'];
  }

  interface Profile {
    realm_access?: {
      roles: string[];
    };
  }

  interface User {
    id: string;
    roles: string[];
    firstName: string;
    lastName: string;
    phone?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    accessToken?: string;
    refreshToken?: string;
    idToken?: string;
    expiresAt?: number;
    roles?: string[];
    userId?: string;
    firstName?: string;
    lastName?: string;
    error?: AuthErrorCode;
    backendRoleError?: BackendRoleErrorCode;
    /**
     * Set after handleTokenRefreshIfNeeded attempts (once) to re-decode a
     * valid-but-identity-incomplete token. Prevents re-attempting the decode
     * on every request for tokens whose claims permanently lack
     * firstName/email, rather than that being a one-time migration gap.
     * Reset to false whenever the access token itself is refreshed, since a
     * new token deserves a fresh attempt.
     */
    identityHealAttempted?: boolean;
  }
}
