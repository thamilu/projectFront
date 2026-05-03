/**
 * Authentication Configuration Service
 * 
 * Enterprise-grade configuration management for OAuth2/OIDC flows.
 * 
 * Features:
 * - Centralized config validation
 * - Runtime caching
 * - Type-safe environment access
 * - SSRF protection via allowed hosts
 * - Development-friendly error messages
 * 
 * @module lib/auth/config
 */

import { z } from 'zod';
import { logger } from '@/lib/observability/logger';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * Keycloak authentication configuration schema
 * 
 * Validates all required OAuth2/OIDC parameters with strict types.
 */
export const AuthConfigSchema = z.object({
  keycloakBaseUrl: z.string().url('KEYCLOAK_BASE_URL must be a valid URL'),
  realm: z.string().min(1, 'KEYCLOAK_REALM is required'),
  clientId: z.string().min(1, 'KEYCLOAK_CLIENT_ID is required'),
  clientSecret: z.string().optional(),
  appUrl: z.string().url('NEXT_PUBLIC_APP_URL must be a valid URL'),
  allowedHosts: z.array(z.string()).optional(),
  scope: z.string().optional(), // OAuth2 scope (e.g., 'openid profile email offline_access')
});

export type AuthConfig = z.infer<typeof AuthConfigSchema>;

/**
 * Configuration validation result with detailed error context
 */
export interface ConfigValidationResult {
  success: boolean;
  config?: AuthConfig;
  errors?: string[];
  missingVars?: string[];
}

// ============================================================================
// CONFIGURATION LOADER
// ============================================================================

let cachedConfig: AuthConfig | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 60_000; // 1 minute cache in development

/**
 * Retrieves environment variable with fallback to public variant
 * 
 * Priority: Server-side env var > Public env var > undefined
 * 
 * @example
 * ```ts
 * const clientId = getEnvVar('KEYCLOAK_CLIENT_ID', 'NEXT_PUBLIC_KEYCLOAK_CLIENT_ID');
 * ```
 */
function getEnvVar(serverKey: string, publicKey: string): string | undefined {
  return process.env[serverKey] || process.env[publicKey];
}

/**
 * Validates Keycloak host against allowed list (SSRF protection)
 * 
 * In production, this prevents redirect to malicious authorization servers.
 * In development, allows any host if not configured.
 */
function validateKeycloakHost(baseUrl: string, allowedHosts?: string[]): boolean {
  if (!allowedHosts || allowedHosts.length === 0) {
    // In development, allow any host if not configured
    if (process.env.NODE_ENV !== 'production') {
      return true;
    }
    
    logger.warn(
      '[auth-config] ALLOWED_AUTH_HOSTS not configured in production. ' +
      'This is a security risk (SSRF vulnerability). ' +
      'Set ALLOWED_AUTH_HOSTS to comma-separated list of allowed Keycloak domains.'
    );
    return false;
  }

  try {
    const url = new URL(baseUrl);
    const isAllowed = allowedHosts.includes(url.host);
    
    if (!isAllowed) {
      logger.error(
        `[auth-config] Keycloak host ${url.host} not in allowed list: ${allowedHosts.join(', ')}`
      );
    }
    
    return isAllowed;
  } catch (error) {
    logger.error('[auth-config] Invalid Keycloak base URL', { baseUrl, error });
    return false;
  }
}

/**
 * Loads and validates authentication configuration
 * 
 * Caching Strategy:
 * - Production: Cache forever (config doesn't change at runtime)
 * - Development: 1-minute TTL (allows hot-reload of env vars)
 * 
 * SSRF Protection:
 * - Validates Keycloak host against ALLOWED_AUTH_HOSTS
 * - Rejects unauthorized hosts in production
 * 
 * @returns Validated config or null if invalid
 * 
 * @example
 * ```ts
 * const config = loadAuthConfig();
 * if (!config) {
 *   return NextResponse.json({ error: 'Auth not configured' }, { status: 500 });
 * }
 * ```
 */
export function loadAuthConfig(): AuthConfig | null {
  // Return cached config if still valid
  const now = Date.now();
  const cacheValid = process.env.NODE_ENV === 'production' 
    ? cachedConfig !== null
    : cachedConfig !== null && (now - cacheTimestamp) < CACHE_TTL_MS;
  
  if (cacheValid) {
    return cachedConfig;
  }

  // Load raw configuration from environment
  const rawConfig = {
    keycloakBaseUrl: getEnvVar('KEYCLOAK_BASE_URL', 'NEXT_PUBLIC_KEYCLOAK_URL'),
    realm: getEnvVar('KEYCLOAK_REALM', 'NEXT_PUBLIC_KEYCLOAK_REALM'),
    clientId: getEnvVar('KEYCLOAK_CLIENT_ID', 'NEXT_PUBLIC_KEYCLOAK_CLIENT_ID'),
    clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    allowedHosts: process.env.ALLOWED_AUTH_HOSTS?.split(',').map(h => h.trim()).filter(Boolean),
    scope: getEnvVar('KEYCLOAK_SCOPE', 'NEXT_PUBLIC_KEYCLOAK_SCOPE'), // OAuth2 scope configuration
  };

  // Validate schema
  const result = AuthConfigSchema.safeParse(rawConfig);
  
  if (!result.success) {
    const errors = result.error.flatten();
    logger.error('[auth-config] Invalid authentication configuration', {
      fieldErrors: errors.fieldErrors,
      formErrors: errors.formErrors,
    });
    
    cachedConfig = null;
    return null;
  }

  // Validate Keycloak host (SSRF protection)
  if (!validateKeycloakHost(result.data.keycloakBaseUrl, result.data.allowedHosts)) {
    cachedConfig = null;
    return null;
  }

  // Cache validated config
  cachedConfig = result.data;
  cacheTimestamp = now;
  
  if (process.env.NODE_ENV !== 'production') {
    logger.debug('[auth-config] Configuration loaded and cached', {
      realm: cachedConfig.realm,
      clientId: cachedConfig.clientId.substring(0, 8) + '...',
      baseUrl: new URL(cachedConfig.keycloakBaseUrl).host,
    });
  }
  
  return cachedConfig;
}

/**
 * Validates configuration and returns detailed diagnostic information
 * 
 * Used for development diagnostics and error reporting.
 * 
 * @example
 * ```ts
 * const result = validateAuthConfig();
 * if (!result.success) {
 *   return NextResponse.json({
 *     error: 'Auth not configured',
 *     missing: result.missingVars,
 *     details: result.errors,
 *   }, { status: 500 });
 * }
 * ```
 */
export function validateAuthConfig(): ConfigValidationResult {
  const config = loadAuthConfig();
  
  if (config) {
    return { success: true, config };
  }

  // Collect missing variables for diagnostics
  const missingVars: string[] = [];
  
  if (!getEnvVar('KEYCLOAK_BASE_URL', 'NEXT_PUBLIC_KEYCLOAK_URL')) {
    missingVars.push('KEYCLOAK_BASE_URL or NEXT_PUBLIC_KEYCLOAK_URL');
  }
  if (!getEnvVar('KEYCLOAK_REALM', 'NEXT_PUBLIC_KEYCLOAK_REALM')) {
    missingVars.push('KEYCLOAK_REALM or NEXT_PUBLIC_KEYCLOAK_REALM');
  }
  if (!getEnvVar('KEYCLOAK_CLIENT_ID', 'NEXT_PUBLIC_KEYCLOAK_CLIENT_ID')) {
    missingVars.push('KEYCLOAK_CLIENT_ID or NEXT_PUBLIC_KEYCLOAK_CLIENT_ID');
  }

  return {
    success: false,
    errors: ['Authentication configuration incomplete or invalid'],
    missingVars,
  };
}

/**
 * Clears configuration cache
 * 
 * Useful in tests or when environment changes at runtime (development only).
 */
export function clearConfigCache(): void {
  cachedConfig = null;
  cacheTimestamp = 0;
}

/**
 * Builds Keycloak authorization endpoint URL
 * 
 * Constructs the complete OAuth2 authorization endpoint URL including realm.
 * 
 * @example
 * ```ts
 * const authEndpoint = getAuthorizationEndpoint(config);
 * // Returns: https://keycloak.example.com/realms/my-realm/protocol/openid-connect/auth
 * ```
 */
export function getAuthorizationEndpoint(config: AuthConfig): string {
  const baseUrl = config.keycloakBaseUrl.replace(/\/$/, '');
  return `${baseUrl}/realms/${config.realm}/protocol/openid-connect/auth`;
}

/**
 * Builds Keycloak token endpoint URL
 * 
 * @example
 * ```ts
 * const tokenEndpoint = getTokenEndpoint(config);
 * // Returns: https://keycloak.example.com/realms/my-realm/protocol/openid-connect/token
 * ```
 */
export function getTokenEndpoint(config: AuthConfig): string {
  const baseUrl = config.keycloakBaseUrl.replace(/\/$/, '');
  return `${baseUrl}/realms/${config.realm}/protocol/openid-connect/token`;
}

/**
 * Builds Keycloak logout endpoint URL
 * 
 * @example
 * ```ts
 * const logoutEndpoint = getLogoutEndpoint(config);
 * // Returns: https://keycloak.example.com/realms/my-realm/protocol/openid-connect/logout
 * ```
 */
export function getLogoutEndpoint(config: AuthConfig): string {
  const baseUrl = config.keycloakBaseUrl.replace(/\/$/, '');
  return `${baseUrl}/realms/${config.realm}/protocol/openid-connect/logout`;
}
