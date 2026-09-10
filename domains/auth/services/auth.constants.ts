// ============================================================
// features/auth/services/auth.constants.ts
// Centralizes all auth provider identifiers
// Eliminates magic provider strings throughout the codebase
// ============================================================

/**
 * NextAuth-level providers actually registered in lib/auth/index.ts's
 * `providers: [...]` array — currently just Keycloak.
 *
 * Social/platform IdPs (Google, Microsoft, GitHub, etc.) are NOT added
 * here as separate entries: this app federates through Keycloak, which
 * brokers those IdPs itself at the realm level. Requesting one is done by
 * passing an IdP hint alongside the SAME 'keycloak' provider (see
 * IAuthFlowService.initiateLogin's idpHint param), not by registering a
 * new NextAuth provider or a new value in this object. Only add an entry
 * here if a genuinely separate NextAuth provider is registered in
 * lib/auth/index.ts — otherwise `signIn(provider, ...)` will fail at
 * runtime since NextAuth has no such provider configured.
 */
export const AUTH_PROVIDERS = {
  KEYCLOAK: 'keycloak',
} as const;

/**
 * Union type derived from AUTH_PROVIDERS values.
 * Ensures only valid providers are passed at compile time.
 */
export type AuthProvider = (typeof AUTH_PROVIDERS)[keyof typeof AUTH_PROVIDERS];
