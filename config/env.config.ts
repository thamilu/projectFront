/**
 * Environment Configuration
 * Type-safe environment variables with validation
 */

export const env = {
  // API
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082',
  apiAuthUrl: process.env.NEXT_PUBLIC_API_AUTH_URL || 'http://localhost:8082/api/auth',
  backendApiUrl: process.env.BACKEND_API_URL || 'http://localhost:8082',

  // Keycloak
  keycloakUrl: process.env.NEXT_PUBLIC_KEYCLOAK_URL || '',
  keycloakRealm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'ecommerce',
  keycloakClientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'ecommerce-frontend',

  // App
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  nodeEnv: process.env.NODE_ENV || 'development',

  // Feature Flags
  enableOAuth: process.env.NEXT_PUBLIC_ENABLE_OAUTH === 'true',
  enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',

  // Sentry
  sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN || '',

  // Stripe
  stripePublicKey: process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || '',
} as const;

// Validation helper
export function validateEnv() {
  const required = ['apiBaseUrl', 'appUrl'];
  const missing = required.filter((key) => !env[key as keyof typeof env]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

export type Env = typeof env;
