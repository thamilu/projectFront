/**
 * NextAuth & Keycloak authentication error messages
 */

export const NEXT_AUTH_ERROR_MESSAGES = {
  OAuthSignin:
    'Could not establish connection with Keycloak. Please ensure the authentication server is running and configured correctly.',
  OAuthCallback:
    'Could not establish connection with Keycloak. Please ensure the authentication server is running and configured correctly.',
  AccessDenied: 'Access was denied. You may not have the required roles to log in.',
  Configuration: 'There is a server-side configuration error with the authentication provider.',
} as const;

export type NextAuthErrorCode = keyof typeof NEXT_AUTH_ERROR_MESSAGES;

export const DEFAULT_AUTH_ERROR_MESSAGE =
  'An unexpected error occurred during sign-in. Please try again.';
