import { env } from '../env';

export const keycloakConfig = {
  realm:
    process.env.NEXT_PUBLIC_KEYCLOAK_REALM ||
    (env.keycloakUrl.includes('/realms/') ? env.keycloakUrl.split('/').pop() || 'eshop' : process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'eshop'),
  clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'eshop-client',
  issuer:
    process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER || `${env.keycloakUrl}/realms/${process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'eshop'}`,
  authorizationEndpoint: `${env.keycloakUrl.replace(/\/$/, '')}/realms/${process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'eshop'}/protocol/openid-connect/auth`,
  tokenEndpoint: `${env.keycloakUrl.replace(/\/$/, '')}/realms/${process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'eshop'}/protocol/openid-connect/token`,
  logoutEndpoint: `${env.keycloakUrl.replace(/\/$/, '')}/realms/${process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'eshop'}/protocol/openid-connect/logout`,
  // Redirect URI for OAuth callback — use backend API base URL per request
  redirectUri: (`${process.env.NEXT_PUBLIC_API_BASE_URL || env.apiBaseUrl}`.replace(/\/$/, '')),
  scope: 'openid profile email offline_access',
} as const;

export type KeycloakConfig = typeof keycloakConfig;
