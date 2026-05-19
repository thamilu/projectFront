import { env } from '@/env'

export const keycloakConfig = {
  realm: 'eshop',
  clientId: env.KEYCLOAK_CLIENT_ID,
  issuer: env.KEYCLOAK_ISSUER,
  authorizationEndpoint: `${env.NEXT_PUBLIC_KEYCLOAK_URL}/realms/eshop/protocol/openid-connect/auth`,
  tokenEndpoint: `${env.NEXT_PUBLIC_KEYCLOAK_URL}/realms/eshop/protocol/openid-connect/token`,
  logoutEndpoint: `${env.NEXT_PUBLIC_KEYCLOAK_URL}/realms/eshop/protocol/openid-connect/logout`,
  redirectUri: env.NEXT_PUBLIC_APP_URL,
  scope: 'openid profile email offline_access',
} as const

export type KeycloakConfig = typeof keycloakConfig
