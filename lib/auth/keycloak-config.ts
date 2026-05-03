/**
 * Enterprise-Grade Keycloak Configuration Module
 * 
 * Responsibilities:
 * - Load and validate Keycloak environment variables
 * - Provide type-safe configuration singleton
 * - Generate Keycloak endpoints with proper URL construction
 * - Prevent runtime configuration errors
 * 
 * Security:
 * - No NEXT_PUBLIC_ variables for secrets
 * - Validates all required environment variables at startup
 * - Immutable configuration after first load
 * 
 * Time Complexity: O(1) - singleton pattern
 * Space Complexity: O(1) - fixed configuration object
 */

import { z } from 'zod';

// ============================================================================
// Configuration Schema
// ============================================================================

const KeycloakConfigSchema = z.object({
  authServerUrl: z.string().url('Invalid Keycloak server URL'),
  realm: z.string().min(1, 'Realm name is required'),
  clientId: z.string().min(1, 'Client ID is required'),
  clientSecret: z.string().optional(),
});

export type KeycloakConfig = z.infer<typeof KeycloakConfigSchema>;

// ============================================================================
// Custom Error Classes
// ============================================================================

export class KeycloakConfigurationError extends Error {
  constructor(
    message: string,
    public readonly missingVars: string[]
  ) {
    super(message);
    this.name = 'KeycloakConfigurationError';
    
    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, KeycloakConfigurationError);
    }
  }
}

// ============================================================================
// Configuration Loading
// ============================================================================

/**
 * Loads and validates Keycloak configuration from environment variables
 * 
 * Required Environment Variables:
 * - KEYCLOAK_AUTH_SERVER_URL: Base URL of Keycloak server
 * - KEYCLOAK_REALM: Realm name
 * - KEYCLOAK_CLIENT_ID: OAuth2 client identifier
 * 
 * Optional:
 * - KEYCLOAK_CLIENT_SECRET: For confidential clients
 * 
 * @throws {KeycloakConfigurationError} When required variables are missing
 * @returns {KeycloakConfig} Validated configuration object
 */
function loadConfig(): KeycloakConfig {
  const missingVars: string[] = [];
  
  // Support both NEXT_PUBLIC_ (client) and server-side env variables
  const authServerUrl = 
    process.env.KEYCLOAK_AUTH_SERVER_URL || 
    process.env.NEXT_PUBLIC_KEYCLOAK_URL;
    
  const realm = 
    process.env.KEYCLOAK_REALM || 
    process.env.NEXT_PUBLIC_KEYCLOAK_REALM;
    
  const clientId = 
    process.env.KEYCLOAK_CLIENT_ID || 
    process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID;
    
  const clientSecret = process.env.KEYCLOAK_CLIENT_SECRET;

  // Collect all missing required variables
  if (!authServerUrl) missingVars.push('KEYCLOAK_AUTH_SERVER_URL');
  if (!realm) missingVars.push('KEYCLOAK_REALM');
  if (!clientId) missingVars.push('KEYCLOAK_CLIENT_ID');

  if (missingVars.length > 0) {
    throw new KeycloakConfigurationError(
      `Missing required Keycloak configuration: ${missingVars.join(', ')}`,
      missingVars
    );
  }

  // Remove trailing slash for consistent URL construction
  const config = {
    authServerUrl: authServerUrl!.replace(/\/$/, ''),
    realm: realm!,
    clientId: clientId!,
    clientSecret,
  };

  // Validate with Zod schema - throws if invalid
  return KeycloakConfigSchema.parse(config);
}

// ============================================================================
// Singleton Pattern
// ============================================================================

let cachedConfig: KeycloakConfig | null = null;

/**
 * Retrieves Keycloak configuration (singleton)
 * 
 * Pattern: Lazy initialization with caching
 * - First call validates and caches configuration
 * - Subsequent calls return cached instance
 * 
 * @returns {KeycloakConfig} Validated configuration
 */
export function getKeycloakConfig(): KeycloakConfig {
  if (!cachedConfig) {
    cachedConfig = loadConfig();
  }
  return cachedConfig;
}

// ============================================================================
// Endpoint Generation
// ============================================================================

export interface KeycloakEndpoints {
  readonly authorization: string;
  readonly token: string;
  readonly userinfo: string;
  readonly logout: string;
  readonly jwks: string;
  readonly introspect: string;
  readonly endSession: string;
  readonly registrations: string;
}

/**
 * Generates all Keycloak OpenID Connect endpoints
 * 
 * Follows RFC 8414 (OAuth 2.0 Authorization Server Metadata)
 * All endpoints use the standard Keycloak path structure:
 * /realms/{realm}/protocol/openid-connect/{endpoint}
 * 
 * @param config - Validated Keycloak configuration
 * @returns {KeycloakEndpoints} Object containing all endpoint URLs
 */
export function getKeycloakEndpoints(config: KeycloakConfig): KeycloakEndpoints {
  const realmUrl = `${config.authServerUrl}/realms/${config.realm}`;
  const oidcBase = `${realmUrl}/protocol/openid-connect`;
  
  return {
    authorization: `${oidcBase}/auth`,
    token: `${oidcBase}/token`,
    userinfo: `${oidcBase}/userinfo`,
    logout: `${oidcBase}/logout`,
    jwks: `${oidcBase}/certs`,
    introspect: `${oidcBase}/token/introspect`,
    endSession: `${oidcBase}/logout`,
    registrations: `${oidcBase}/registrations`,
  } as const;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Checks if Keycloak is configured (for conditional features)
 * 
 * @returns {boolean} True if all required variables are set
 */
export function isKeycloakConfigured(): boolean {
  try {
    getKeycloakConfig();
    return true;
  } catch {
    return false;
  }
}

/**
 * Gets the full issuer URL for JWT validation
 * 
 * @param config - Keycloak configuration
 * @returns {string} Issuer URL (e.g., https://keycloak.example.com/realms/myrealm)
 */
export function getIssuerUrl(config: KeycloakConfig): string {
  return `${config.authServerUrl}/realms/${config.realm}`;
}
