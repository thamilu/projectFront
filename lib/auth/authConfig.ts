/**
 * Keycloak Authentication Configuration
 * 
 * Configuration helpers for Keycloak with NextAuth
 * 
 * @module lib/auth/authConfig
 */

import { env } from '@/env';

/**
 * Get Keycloak Logout URL with proper redirect
 */
export function getLogoutUrl(redirectUri?: string): string {
  const realm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'eshop';
  const appBase = env.appUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  let logoutUri: string;

  if (!redirectUri) {
    logoutUri = appBase;
  } else if (/^https?:\/\//i.test(redirectUri)) {
    logoutUri = redirectUri;
  } else {
    // Treat as a relative path -> prefix with app base
    logoutUri = `${appBase.replace(/\/$/, '')}/${String(redirectUri).replace(/^\//, '')}`;
  }

  return `${env.keycloakUrl}/realms/${realm}/protocol/openid-connect/logout?redirect_uri=${encodeURIComponent(logoutUri)}`;
}

/**
 * Get Keycloak Registration URL
 * 
 * IMPORTANT: Registration must redirect to NextAuth's callback URL to complete the OAuth flow
 */
export function getRegistrationUrl(redirectUri?: string): string {
  const realm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'eshop';
  const clientId = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'eshop-client';
  const appBase = env.appUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  // Always use NextAuth callback URL for OAuth flow completion
  const redirect = `${appBase.replace(/\/$/, '')}/api/auth/callback/keycloak`;
  
  // Build registration URL with proper callback
  const registrationUrl = `${env.keycloakUrl}/realms/${realm}/protocol/openid-connect/registrations?client_id=${clientId}&response_type=code&scope=openid%20profile%20email&redirect_uri=${encodeURIComponent(redirect)}`;
  
  // If a custom redirect is provided, store it for post-login redirect
  if (redirectUri && typeof window !== 'undefined') {
    sessionStorage.setItem('post_register_redirect', redirectUri);
  }
  
  return registrationUrl;
}

/**
 * Get Keycloak Issuer URL (for NextAuth configuration)
 */
export function getKeycloakIssuer(): string {
  const realm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'eshop';
  return `${env.keycloakUrl}/realms/${realm}`;
}
