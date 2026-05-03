/**
 * Keycloak Token Response Schema
 * Type-safe validation for OAuth2 token responses
 */

import { z } from 'zod';

/**
 * Keycloak token endpoint response schema
 * Based on OAuth 2.0 Token Response (RFC 6749 Section 5.1)
 */
export const KeycloakTokenResponseSchema = z.object({
  access_token: z.string().min(1),
  token_type: z.string().default('Bearer'),
  expires_in: z.number().int().positive().optional(),
  refresh_token: z.string().optional(),
  id_token: z.string().optional(),
  scope: z.string().optional(),
  // Keycloak-specific fields
  'not-before-policy': z.number().optional(),
  session_state: z.string().optional(),
  refresh_expires_in: z.number().optional(),
});

export type KeycloakTokenResponse = z.infer<typeof KeycloakTokenResponseSchema>;

/**
 * Default token expiry time (1 hour) if not provided by IdP
 */
export const DEFAULT_TOKEN_EXPIRY_SECONDS = 3600;

/**
 * Keycloak error response schema
 */
export const KeycloakErrorResponseSchema = z.object({
  error: z.string(),
  error_description: z.string().optional(),
  error_uri: z.string().optional(),
});

export type KeycloakErrorResponse = z.infer<typeof KeycloakErrorResponseSchema>;

/**
 * Parse and validate Keycloak token response
 */
export function parseTokenResponse(
  data: unknown
): { success: true; data: KeycloakTokenResponse } | { success: false; error: string } {
  const result = KeycloakTokenResponseSchema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errorMessages = result.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ');

  return {
    success: false,
    error: errorMessages,
  };
}

/**
 * Parse Keycloak error response
 */
export function parseErrorResponse(data: unknown): KeycloakErrorResponse | null {
  const result = KeycloakErrorResponseSchema.safeParse(data);
  return result.success ? result.data : null;
}
