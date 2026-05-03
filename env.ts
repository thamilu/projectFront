// src/env.ts
export const env = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082',
  apiAuthUrl: process.env.NEXT_PUBLIC_API_AUTH_URL || 'http://localhost:8082/api/auth',
  keycloakUrl: process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:8080',
  backendApiUrl: process.env.BACKEND_API_URL || 'http://localhost:8082',
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'Keycloak Auth',
  enableOAuth: process.env.NEXT_PUBLIC_ENABLE_OAUTH === 'true',
  enableDirectLogin: process.env.NEXT_PUBLIC_ENABLE_DIRECT_LOGIN === 'true',
} as const;
