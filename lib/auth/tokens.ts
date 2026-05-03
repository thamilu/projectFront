/**
 * JWT Token Validation & Management
 * 
 * Enterprise-grade token validation using jose library:
 * - ID token validation (OpenID Connect Core 1.0)
 * - Access token validation (OAuth2 RFC 6749)
 * - JWKS fetching with caching
 * - Nonce validation for replay protection
 * - Comprehensive claim validation
 * 
 * Security Properties:
 * - Remote JWKS verification (no local secrets)
 * - Issuer validation
 * - Audience validation
 * - Expiration enforcement
 * - Algorithm whitelist (RS256)
 * 
 * @module lib/auth/tokens
 */

import { jwtVerify, createRemoteJWKSet } from 'jose';
import { loadAuthConfig } from './config';
import { getRequestLogger } from '@/lib/observability/logger';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Keycloak token payload structure
 * 
 * Extends standard JWT claims with Keycloak-specific fields:
 * - realm_access: Realm-level roles
 * - resource_access: Client-specific roles
 * - nonce: Replay protection token
 */
export interface KeycloakTokenPayload {
  // Standard JWT claims
  iss?: string;
  sub: string;
  aud?: string | string[];
  exp?: number;
  nbf?: number;
  iat?: number;
  jti?: string;
  
  // Standard OIDC claims
  email?: string;
  email_verified?: boolean;
  name?: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
  
  // Keycloak-specific claims
  realm_access?: {
    roles: string[];
  };
  resource_access?: Record<string, { roles: string[] }>;
  
  // OIDC security claims
  nonce?: string;
  azp?: string; // Authorized party
  
  // Timestamps (from JWT)
  auth_time?: number;
  
  // Session
  session_state?: string;
  sid?: string;
}

/**
 * Token validation result
 */
export interface TokenValidationResult {
  valid: boolean;
  payload?: KeycloakTokenPayload;
  error?: string;
  errorCode?: string;
}

// ============================================================================
// JWKS CACHE
// ============================================================================

/**
 * Cached JWKS instance
 * 
 * Remote JWKS set is cached for performance:
 * - Reduces network requests
 * - Automatic key rotation handling
 * - TTL-based refresh
 */
let jwksCache: ReturnType<typeof createRemoteJWKSet> | null = null;
let jwksCacheTime = 0;
const JWKS_CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Gets or creates JWKS instance
 * 
 * Implements caching with TTL to balance:
 * - Performance (reduced network calls)
 * - Security (key rotation detection)
 * 
 * @returns Remote JWKS set for token verification
 */
function getJWKS(): ReturnType<typeof createRemoteJWKSet> {
  const now = Date.now();
  
  // Return cached instance if fresh
  if (jwksCache && (now - jwksCacheTime) < JWKS_CACHE_TTL) {
    return jwksCache;
  }
  
  const config = loadAuthConfig();
  if (!config) {
    throw new Error('Auth configuration not loaded');
  }
  
  // Build JWKS URI
  const jwksUri = `${config.keycloakBaseUrl}/realms/${config.realm}/protocol/openid-connect/certs`;
  
  // Create new JWKS instance
  jwksCache = createRemoteJWKSet(new URL(jwksUri), {
    cooldownDuration: 30000, // 30 seconds between refetches
    cacheMaxAge: 60000, // Cache keys for 1 minute
  });
  
  jwksCacheTime = now;
  
  return jwksCache;
}

/**
 * Clears JWKS cache
 * 
 * Use when:
 * - Detecting key rotation
 * - Configuration changes
 * - Testing scenarios
 */
export function clearJWKSCache(): void {
  jwksCache = null;
  jwksCacheTime = 0;
}

// ============================================================================
// TOKEN VALIDATION
// ============================================================================

/**
 * Validates ID token
 * 
 * Performs comprehensive validation per OpenID Connect Core 1.0:
 * 1. Signature verification using JWKS
 * 2. Issuer validation
 * 3. Audience validation
 * 4. Expiration check
 * 5. Algorithm verification (RS256)
 * 
 * @param idToken - JWT ID token from Keycloak
 * @param expectedNonce - Expected nonce value (optional, for replay protection)
 * @returns Validation result with payload or error
 */
export async function validateIdToken(
  idToken: string,
  expectedNonce?: string
): Promise<TokenValidationResult> {
  const log = getRequestLogger('token-validation');
  
  try {
    const config = loadAuthConfig();
    if (!config) {
      return {
        valid: false,
        error: 'Auth configuration not loaded',
        errorCode: 'CONFIG_MISSING',
      };
    }
    
    // Verify JWT signature and claims
    const result = await jwtVerify(
      idToken,
      getJWKS(),
      {
        issuer: `${config.keycloakBaseUrl}/realms/${config.realm}`,
        audience: config.clientId,
        algorithms: ['RS256'], // Only allow RS256
      }
    );
    
    const keycloakPayload = result.payload as KeycloakTokenPayload;
    
    // Validate nonce if provided (replay protection)
    if (expectedNonce && keycloakPayload.nonce !== expectedNonce) {
      log.warn('Nonce mismatch detected', {
        expected: expectedNonce.substring(0, 8),
        received: keycloakPayload.nonce?.substring(0, 8),
      });
      
      return {
        valid: false,
        error: 'Nonce mismatch',
        errorCode: 'NONCE_MISMATCH',
      };
    }
    
    // Additional validation: require sub claim
    if (!keycloakPayload.sub) {
      return {
        valid: false,
        error: 'Missing subject claim',
        errorCode: 'INVALID_TOKEN',
      };
    }
    
    log.info('ID token validated successfully', {
      sub: keycloakPayload.sub,
      email: keycloakPayload.email,
    });
    
    return {
      valid: true,
      payload: keycloakPayload,
    };
    
  } catch (error) {
    // Categorize error types
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    let errorCode = 'INVALID_TOKEN';
    if (errorMessage.includes('expired')) {
      errorCode = 'TOKEN_EXPIRED';
    } else if (errorMessage.includes('signature')) {
      errorCode = 'INVALID_SIGNATURE';
    } else if (errorMessage.includes('audience')) {
      errorCode = 'INVALID_AUDIENCE';
    } else if (errorMessage.includes('issuer')) {
      errorCode = 'INVALID_ISSUER';
    }
    
    log.error('ID token validation failed', {
      error: errorMessage,
      errorCode,
    });
    
    return {
      valid: false,
      error: errorMessage,
      errorCode,
    };
  }
}

/**
 * Validates access token
 * 
 * Access tokens are validated for:
 * - Signature verification
 * - Issuer validation
 * - Expiration check
 * - Algorithm verification
 * 
 * Note: Access tokens typically don't have audience claim
 * (unlike ID tokens which must have audience)
 * 
 * @param accessToken - JWT access token from Keycloak
 * @returns Validation result with payload or error
 */
export async function validateAccessToken(
  accessToken: string
): Promise<TokenValidationResult> {
  const log = getRequestLogger('token-validation');
  
  try {
    const config = loadAuthConfig();
    if (!config) {
      return {
        valid: false,
        error: 'Auth configuration not loaded',
        errorCode: 'CONFIG_MISSING',
      };
    }
    
    // Verify JWT signature and claims
    const result = await jwtVerify(
      accessToken,
      getJWKS(),
      {
        issuer: `${config.keycloakBaseUrl}/realms/${config.realm}`,
        algorithms: ['RS256'],
        // Note: Access tokens may not have audience claim
      }
    );
    
    const keycloakPayload = result.payload as KeycloakTokenPayload;
    
    // Require sub claim
    if (!keycloakPayload.sub) {
      return {
        valid: false,
        error: 'Missing subject claim',
        errorCode: 'INVALID_TOKEN',
      };
    }
    
    log.info('Access token validated successfully', {
      sub: keycloakPayload.sub,
    });
    
    return {
      valid: true,
      payload: keycloakPayload,
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    let errorCode = 'INVALID_TOKEN';
    if (errorMessage.includes('expired')) {
      errorCode = 'TOKEN_EXPIRED';
    } else if (errorMessage.includes('signature')) {
      errorCode = 'INVALID_SIGNATURE';
    }
    
    log.error('Access token validation failed', {
      error: errorMessage,
      errorCode,
    });
    
    return {
      valid: false,
      error: errorMessage,
      errorCode,
    };
  }
}

/**
 * Extracts user roles from token payload
 * 
 * Keycloak stores roles in two locations:
 * - realm_access.roles: Realm-level roles
 * - resource_access[clientId].roles: Client-specific roles
 * 
 * @param payload - Validated token payload
 * @param includeClientRoles - Include client-specific roles
 * @returns Deduplicated array of role names
 */
export function extractRoles(
  payload: KeycloakTokenPayload,
  includeClientRoles = true
): string[] {
  const roles = new Set<string>();
  
  // Add realm roles
  if (payload.realm_access?.roles) {
    payload.realm_access.roles.forEach(role => roles.add(role));
  }
  
  // Add client roles
  if (includeClientRoles && payload.resource_access) {
    Object.values(payload.resource_access).forEach(resource => {
      resource.roles?.forEach(role => roles.add(role));
    });
  }
  
  return Array.from(roles);
}

/**
 * Checks if token is expired or expiring soon
 * 
 * @param payload - Token payload with exp claim
 * @param bufferSeconds - Seconds before expiry to consider "expiring soon"
 * @returns True if token is expired or within buffer window
 */
export function isTokenExpired(
  payload: KeycloakTokenPayload,
  bufferSeconds = 60
): boolean {
  if (!payload.exp) return true;
  
  const now = Math.floor(Date.now() / 1000);
  return payload.exp <= (now + bufferSeconds);
}

/**
 * Gets token expiration time
 * 
 * @param payload - Token payload with exp claim
 * @returns Expiration timestamp (ms) or null if no exp claim
 */
export function getTokenExpiration(
  payload: KeycloakTokenPayload
): number | null {
  if (!payload.exp) return null;
  return payload.exp * 1000;
}
