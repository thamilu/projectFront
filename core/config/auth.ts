/**
 * Authentication Configuration
 *
 * Centralized, validated configurations for OAuth/Keycloak URL boundaries.
 * Prevents dynamic env reads inside component rendering loops.
 *
 * @module core/config/auth
 */

function requireEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (!value) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        `[Config] Required environment variable ${key} is not set. ` +
          `Add it to .env.local or your deployment configuration.`
      );
    }
    return '';
  }
  return value;
}

export const AUTH_CONFIG = {
  keycloakLoginUrl: requireEnv('NEXT_PUBLIC_KEYCLOAK_LOGIN_URL', '/auth/login'),
} as const;
