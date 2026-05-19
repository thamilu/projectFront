/**
 * Token Service
 * Handles token validation, role extraction, and refresh logic
 */

import { type JWT } from 'next-auth/jwt';
import { AUTH_ERRORS } from '../core/errors';
import { logger } from '@/core/telemetry/logger';

/**
 * Keycloak token response structure
 */
export interface KeycloakTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

/**
 * Type guard for Keycloak token response
 */
export function isValidTokenResponse(data: unknown): data is KeycloakTokenResponse {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const response = data as Partial<KeycloakTokenResponse>;
  
  return (
    typeof response.access_token === 'string' &&
    response.access_token.length > 0 &&
    typeof response.expires_in === 'number' &&
    response.expires_in > 0
  );
}

/**
 * Extract roles from JWT access token using base64url decoding
 * Handles both base64 and base64url encoding
 * Checks multiple possible locations for roles in the token
 */
export function extractRoles(accessToken: string): string[] {
  try {
    const parts = accessToken.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT structure');
    }

    // JWT uses base64url encoding - convert to standard base64
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    const payload = JSON.parse(
      Buffer.from(base64, 'base64').toString('utf-8')
    );
    
    // Collect roles from all possible locations
    const allRoles: string[] = [];
    
    // 1. Check top-level 'roles' array (custom Keycloak claim)
    if (Array.isArray(payload.roles)) {
      allRoles.push(...payload.roles);
    }
    
    // 2. Check realm_access.roles (standard Keycloak location)
    if (payload.realm_access?.roles && Array.isArray(payload.realm_access.roles)) {
      allRoles.push(...payload.realm_access.roles);
    }
    
    // 3. Check resource_access for client-specific roles
    if (payload.resource_access && typeof payload.resource_access === 'object') {
      Object.values(payload.resource_access).forEach((resource: any) => {
        if (resource?.roles && Array.isArray(resource.roles)) {
          allRoles.push(...resource.roles);
        }
      });
    }
    
    // Deduplicate and uppercase all roles
    const uniqueRoles = Array.from(new Set(allRoles)).map((r: string) => r.toUpperCase());
    
    logger.debug('[auth] Extracted roles from token', { 
      count: uniqueRoles.length, 
      roles: uniqueRoles 
    });
    
    return uniqueRoles;
  } catch (error) {
    logger.warn('[auth] Failed to extract roles from access token:', { error });
    return [];
  }
}

/**
 * Token refresh buffer time (refresh 30 seconds before actual expiry)
 * Prevents race conditions and gives time for refresh to complete
 * CRITICAL: Don't refresh too early or Keycloak will reject with invalid_grant
 */
export const TOKEN_REFRESH_BUFFER_MS = 30_000; // 30 seconds

/**
 * Check if token needs refresh based on expiry time and buffer
 * ONLY refreshes when token is actually about to expire (within buffer time)
 */
export function shouldRefreshToken(expiresAt?: number): boolean {
  if (!expiresAt) return true;
  const now = Date.now();
  const shouldRefresh = now >= expiresAt - TOKEN_REFRESH_BUFFER_MS;
  
  // Log for debugging (can remove in production)
  if (process.env.NODE_ENV === 'development') {
    const timeUntilExpiry = expiresAt - now;
    logger.debug('[auth] Token refresh check', {
      shouldRefresh,
      timeUntilExpirySeconds: Math.floor(timeUntilExpiry / 1000),
      expiresAt: new Date(expiresAt).toISOString(),
    });
  }
  
  return shouldRefresh;
}

/**
 * Refresh the access token using the refresh token
 * Includes validation and proper error categorization
 */
export async function refreshAccessToken(
  token: JWT,
  keycloakConfig: {
    issuer: string;
    clientId: string;
    clientSecret?: string;
  }
): Promise<JWT> {
  if (!token.refreshToken) {
    return {
      ...token,
      error: AUTH_ERRORS.INVALID_SESSION,
    };
  }

  const url = `${keycloakConfig.issuer.replace(/\/$/, '')}/protocol/openid-connect/token`;

  const maxAttempts = 3;
  const timeoutMs = 5000; // per-request timeout

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let controller: AbortController | undefined;
    try {
      controller = new AbortController();
      const id = setTimeout(() => controller?.abort(), timeoutMs);

      logger.debug('[auth] refreshAccessToken attempt', { url, attempt });

      // Build form data - only include client_secret for confidential clients
      const formData: Record<string, string> = {
        client_id: keycloakConfig.clientId,
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken as string,
      };
      if (keycloakConfig.clientSecret) {
        formData.client_secret = keycloakConfig.clientSecret;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(formData),
        signal: controller.signal,
      });

      clearTimeout(id);

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        // Check for specific error cases
        const isTokenInactive = data?.error === 'invalid_grant' && data?.error_description?.includes('not active');
        const isTokenExpired = response.status === 401 || isTokenInactive;
        const errorCode = isTokenExpired ? AUTH_ERRORS.TOKEN_EXPIRED : AUTH_ERRORS.REFRESH_FAILED;
        
        logger.error('[auth] Token refresh HTTP error - invalid_grant or expired token', { 
          status: response.status, 
          data,
          isTokenInactive,
          message: isTokenInactive 
            ? 'Session expired - user needs to re-login' 
            : 'Ensure Keycloak client has "Use Refresh Tokens" enabled and token not expired'
        });

        // For inactive tokens, clear the refresh token to force re-login
        return {
          ...token,
          error: errorCode,
          refreshToken: isTokenInactive ? undefined : token.refreshToken,
        };
      }

      if (!isValidTokenResponse(data)) {
        logger.error('[auth] Invalid token response structure', { data });
        return {
          ...token,
          error: AUTH_ERRORS.INVALID_TOKEN_RESPONSE,
        };
      }

      // ✅ Success - log for debugging
      logger.info('[auth] refreshAccessToken success', {
        expiresIn: data.expires_in,
        hasRefreshToken: !!data.refresh_token,
      });

      return {
        ...token,
        accessToken: data.access_token,
        refreshToken: data.refresh_token ?? token.refreshToken,
        accessTokenExpires: Date.now() + data.expires_in * 1000,
        roles: extractRoles(data.access_token),
        error: undefined,
      };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      // Handle abort separately
      // const isAbort = err?.name === 'AbortError';
      const code = err?.code || err?.name || 'UNKNOWN_ERROR';

      logger.warn('[auth] Token refresh network error', { attempt, code, message: err?.message });

      // If last attempt, return network error
      if (attempt === maxAttempts) {
        logger.error('[auth] Token refresh failed after retries', { attempts: maxAttempts, error: err });
        return {
          ...token,
          error: AUTH_ERRORS.NETWORK_ERROR,
        };
      }

      // Exponential backoff before retrying
      const backoffMs = 300 * Math.pow(2, attempt - 1);
      await new Promise((res) => setTimeout(res, backoffMs));
      continue;
    } finally {
      // ensure controller cleared
      try {
        controller?.abort();
      } catch {}
    }
  }

  // Fallback - should be unreachable
  return {
    ...token,
    error: AUTH_ERRORS.NETWORK_ERROR,
  };
}

/**
 * Logout from Keycloak with retry logic
 * Attempts to revoke the refresh token with exponential backoff
 */
export async function logoutFromKeycloak(
  refreshToken: string,
  keycloakConfig: {
    issuer: string;
    clientId: string;
    clientSecret?: string;
  },
  maxRetries = 1
): Promise<{ success: boolean; error?: string }> {
  // Sanitize issuer to remove trailing slash
  const issuer = keycloakConfig.issuer.replace(/\/$/, '');
  const url = `${issuer}/protocol/openid-connect/logout`;
  const timeoutMs = 2000;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    let controller: AbortController | undefined;
    try {
      controller = new AbortController();
      const id = setTimeout(() => controller?.abort(), timeoutMs);

      // Build form data - only include client_secret for confidential clients
      const formData: Record<string, string> = {
        client_id: keycloakConfig.clientId,
        refresh_token: refreshToken,
      };
      if (keycloakConfig.clientSecret) {
        formData.client_secret = keycloakConfig.clientSecret;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(formData),
        signal: controller.signal,
      });
      
      clearTimeout(id);

      if (response.ok || response.status === 204) {
        return { success: true };
      }

      if (response.ok || response.status === 204) {
        return { success: true };
      }

      if (attempt === maxRetries) {
        const errorText = await response.text().catch(() => 'Unknown error');
        logger.error('[auth] Keycloak logout failed after retries:', {
          status: response.status,
          error: errorText,
        });
        return { success: false, error: `HTTP ${response.status}` };
      }
    } catch (error) {
      if (attempt === maxRetries) {
        logger.error('[auth] Keycloak logout network error:', { error });
        return { success: false, error: 'Network error' };
      }
      
      // Exponential backoff: 1s, 2s, 4s...
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
    }
  }

  return { success: false, error: 'Max retries exceeded' };
}
