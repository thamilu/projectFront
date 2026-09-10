import type { Account, Session } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import { logger } from '@/core/telemetry/logger';
import type { ExtendedJWT } from './types';
import { AuthErrorCode } from './types';
import { isTokenValid, extractUserFromToken, healTokenIdentity, createErrorToken } from './utils';
import { fetchUserRoleWithRetry, mergeBackendRole } from './backend-role';
import { refreshAccessTokenWithLock } from './token-refresh';

// ─── JWT Callback Orchestration Handlers ─────────────────────────────────────

/**
 * Handles the initial sign-in logic when a user successfully authenticates.
 */
export async function handleInitialSignIn(account: Account, token: JWT): Promise<ExtendedJWT> {
  if (!account.access_token || !account.refresh_token || !account.expires_at) {
    logger.error('[Auth] Keycloak returned incomplete account data during initial sign-in', {
      hasAccessToken: !!account.access_token,
      hasRefreshToken: !!account.refresh_token,
      hasExpiresAt: !!account.expires_at,
    });
    return createErrorToken(AuthErrorCode.INVALID_KEYCLOAK_RESPONSE);
  }

  const userData = extractUserFromToken(account.access_token);

  if (!userData.email && !userData.name) {
    // Not necessarily an error — a user can legitimately lack a name claim —
    // but it must be observable. Without this, a Keycloak client missing the
    // right scope/mapper (or a service-account-style token) silently produces
    // an identity-less session with zero telemetry anywhere in the stack.
    logger.warn('[Auth] Keycloak token missing expected identity claims', {
      hasSub: !!token.sub,
    });
  }

  const tokenData: ExtendedJWT = {
    accessToken: account.access_token,
    refreshToken: account.refresh_token,
    idToken: account.id_token,
    expiresAt: account.expires_at,
    roles: userData.roles ?? [],
    userId: userData.userId ?? token.sub ?? '',
    sub: userData.userId ?? token.sub ?? '',
    firstName: userData.firstName ?? '',
    lastName: userData.lastName ?? '',
    name: userData.name ?? '',
    email: userData.email ?? '',
  };

  // Fetch authoritative role from backend with retry logic
  const backendResult = await fetchUserRoleWithRetry(account.access_token);
  return mergeBackendRole(tokenData, backendResult);
}

/**
 * Handles manually triggered session updates.
 */
export async function handleUpdateTrigger(token: ExtendedJWT): Promise<ExtendedJWT> {
  // If the token is already in an error state or lacks a refresh token, do not attempt to refresh
  if (token.error || !token.refreshToken) {
    return token;
  }

  // Healed twice deliberately: once on input, in case the caller passed in a
  // stale/unhealed token; once on output, since the refresh/role-merge above
  // can itself introduce a userId/sub mismatch that needs re-reconciling.
  let currentToken = healTokenIdentity(token);

  if (!isTokenValid(currentToken.expiresAt)) {
    currentToken = await refreshAccessTokenWithLock(currentToken);
  }

  // Fetch updated role from backend on explicit update() calls
  if (currentToken.accessToken && !currentToken.error) {
    const backendResult = await fetchUserRoleWithRetry(currentToken.accessToken);
    currentToken = mergeBackendRole(currentToken, backendResult);
  }

  return healTokenIdentity(currentToken);
}

/**
 * Handles normal request routing, checking for token expiration and refreshing.
 */
export async function handleTokenRefreshIfNeeded(token: ExtendedJWT): Promise<ExtendedJWT> {
  // If the token is already in an error state or lacks a refresh token, do not attempt to refresh
  // to avoid infinite refresh stampedes/loops against Keycloak
  if (token.error || !token.refreshToken) {
    return token;
  }

  let currentToken = healTokenIdentity(token);

  if (isTokenValid(currentToken.expiresAt)) {
    // Heal missing user data in cached tokens (for active sessions from old code).
    // Gated on identityHealAttempted so this runs at most once per token
    // generation — without it, a token whose access-token claims permanently
    // lack firstName/email (a Keycloak scope/mapper gap, not a migration
    // artifact) would re-decode the same JWT on every request, forever.
    if (
      currentToken.accessToken &&
      (!currentToken.firstName || !currentToken.email) &&
      !currentToken.identityHealAttempted
    ) {
      const userData = extractUserFromToken(currentToken.accessToken, currentToken);
      // Explicit field merge to avoid blind spreading overwrites
      currentToken = {
        ...currentToken,
        firstName: userData.firstName || currentToken.firstName,
        lastName: userData.lastName || currentToken.lastName,
        email: userData.email || currentToken.email,
        name: userData.name || currentToken.name,
        identityHealAttempted: true,
      };
    }
    return currentToken;
  }

  return refreshAccessTokenWithLock(currentToken);
}

// ─── Session Callback Support Handlers ───────────────────────────────────────

/**
 * Resolves error states and user identity for the session callback.
 */
export function resolveSessionIdentity(token: ExtendedJWT): {
  sessionError?: AuthErrorCode;
  userIdVal: string;
} {
  // || (not ??) deliberately: userId/sub mutual-fallback intent matches
  // extractUserFromToken's identical pattern — an empty-string userId must
  // fall through to sub just as readily as a null/undefined one would,
  // since ExtendedJWT.userId is typed as a plain string and healTokenIdentity
  // is what normally keeps the two in sync before a token reaches here.
  const userIdVal = token.userId || token.sub || '';

  if (userIdVal) {
    return { sessionError: token.error, userIdVal };
  }

  // Missing userId is an expected downstream consequence of most known error
  // tokens (createErrorToken always clears userId/sub) — only log when there's
  // no known error already explaining it. Without this guard, a user stuck
  // with an error token generates this error-level log on every single
  // session check (every useSession()/auth() call) until they re-authenticate.
  if (!token.error) {
    logger.error('[Auth] Session created without userId', {
      hasAccessToken: !!token.accessToken,
      hasEmail: !!token.email,
    });
  }

  // Preserve the more specific, actionable root-cause error (e.g.
  // RefreshAccessTokenError) instead of masking it with the generic
  // MISSING_USER_ID — the two commonly co-occur since a failed refresh
  // legitimately clears identity fields too.
  return { sessionError: token.error ?? AuthErrorCode.MISSING_USER_ID, userIdVal: '' };
}

/**
 * Safely constructs the session user profile.
 */
export function buildSessionUser(
  baseUser: Session['user'],
  token: ExtendedJWT,
  userId: string
): Session['user'] {
  return {
    ...baseUser,
    id: userId,
    name: token.name || baseUser?.name || '',
    email: token.email || baseUser?.email || '',
    roles: token.roles ?? [],
    firstName: token.firstName ?? '',
    lastName: token.lastName ?? '',
  };
}
