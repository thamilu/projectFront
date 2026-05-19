/**
 * PKCE (Proof Key for Code Exchange) Utilities
 * 
 * Enterprise-grade implementation of RFC 7636 (PKCE for OAuth 2.0).
 * 
 * Security Features:
 * - Cryptographically secure random generation
 * - SHA-256 challenge computation
 * - State parameter for CSRF protection (RFC 6749)
 * - Nonce parameter for OIDC replay attack prevention (OpenID Connect Core 1.0)
 * - URL-safe base64 encoding
 * 
 * @module lib/auth/pkce
 */

import { randomBytes, createHash } from 'crypto';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * PKCE verifier length in bytes (RFC 7636 recommends 32-128 bytes)
 * 32 bytes = 256 bits of entropy = adequate for all security levels
 */
const VERIFIER_LENGTH_BYTES = 32;

/**
 * OAuth state parameter length (16 bytes = 128 bits)
 * Used for CSRF protection per RFC 6749 Section 10.12
 */
const STATE_LENGTH_BYTES = 16;

/**
 * OIDC nonce parameter length (16 bytes = 128 bits)
 * Used for replay attack prevention per OpenID Connect Core 1.0 Section 3.1.2.1
 */
const NONCE_LENGTH_BYTES = 16;

// ============================================================================
// TYPES
// ============================================================================

/**
 * Complete PKCE challenge including CSRF and replay protection tokens
 */
export interface PKCEChallenge {
  /**
   * Code verifier - secret kept client-side, sent during token exchange
   * Length: 43-128 characters (base64url encoded)
   */
  verifier: string;
  
  /**
   * Code challenge - SHA256 hash of verifier, sent in authorization request
   * Method: S256 (SHA-256)
   */
  challenge: string;
  
  /**
   * OAuth state parameter for CSRF protection
   * Must be validated on callback to prevent authorization code injection
   */
  state: string;
  
  /**
   * OpenID Connect nonce for replay attack prevention
   * Must match nonce claim in ID token
   */
  nonce: string;
}

export interface OAuthParams {
  redirectUri: string;
  codeChallenge: string;
  state: string;
  nonce: string;
  scope?: string;
  loginHint?: string;
  prompt?: 'none' | 'login' | 'consent' | 'select_account';
  uiLocales?: string;
  acrValues?: string;
}


// ============================================================================
// CRYPTO UTILITIES
// ============================================================================

/**
 * Generates cryptographically secure random bytes
 * 
 * Uses Node.js crypto.randomBytes which leverages OS entropy sources.
 * 
 * @param length - Number of bytes to generate
 * @returns URL-safe base64 encoded string
 * 
 * @throws {Error} If random generation fails (system entropy depleted)
 */
function generateSecureRandom(length: number): string {
  try {
    const buffer = randomBytes(length);
    return base64url(buffer);
  } catch (error) {
    throw new Error(
      `Failed to generate secure random bytes: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Encodes buffer to URL-safe base64 (RFC 4648 Section 5)
 * 
 * Transformations:
 * - '+' → '-'
 * - '/' → '_'
 * - Removes trailing '=' padding
 * 
 * @param buffer - Binary data to encode
 * @returns URL-safe base64 string
 */
function base64url(buffer: Buffer): string {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Computes SHA-256 hash of input string
 * 
 * Used for PKCE challenge generation (RFC 7636 Section 4.2).
 * 
 * @param input - Plain text string to hash
 * @returns SHA-256 digest as Buffer
 */
function sha256(input: string): Buffer {
  return createHash('sha256').update(input).digest();
}

// ============================================================================
// PKCE GENERATION
// ============================================================================

/**
 * Generates complete PKCE challenge with CSRF and replay protection
 * 
 * Flow:
 * 1. Generate cryptographically secure verifier (256 bits)
 * 2. Compute SHA-256 challenge from verifier
 * 3. Generate state parameter for CSRF protection
 * 4. Generate nonce for OIDC replay attack prevention
 * 
 * Security Properties:
 * - Verifier: 256 bits entropy (cryptographically secure)
 * - Challenge: SHA-256 (collision-resistant)
 * - State: 128 bits entropy (sufficient for CSRF tokens)
 * - Nonce: 128 bits entropy (replay prevention)
 * 
 * RFC References:
 * - RFC 7636: PKCE for OAuth 2.0
 * - RFC 6749 Section 10.12: CSRF Protection
 * - OpenID Connect Core 1.0 Section 3.1.2.1: Nonce
 * 
 * @returns Complete PKCE challenge with security tokens
 * 
 * @throws {Error} If cryptographic random generation fails
 * 
 * @example
 * ```ts
 * const pkce = generatePKCEChallenge();
 * 
 * // Store verifier, state, and nonce in httpOnly cookies
 * response.cookies.set('pkce_verifier', pkce.verifier, { httpOnly: true, ... });
 * response.cookies.set('oauth_state', pkce.state, { httpOnly: true, ... });
 * response.cookies.set('oauth_nonce', pkce.nonce, { httpOnly: true, ... });
 * 
 * // Send challenge and state in authorization URL
 * const authUrl = `${endpoint}?code_challenge=${pkce.challenge}&state=${pkce.state}&nonce=${pkce.nonce}`;
 * ```
 * 
 * Time Complexity: O(1) - Fixed-size operations
 * Space Complexity: O(1) - Fixed-size strings
 */
export function generatePKCEChallenge(): PKCEChallenge {
  // Generate code verifier (RFC 7636 Section 4.1)
  const verifier = generateSecureRandom(VERIFIER_LENGTH_BYTES);
  
  // Compute code challenge using S256 method (RFC 7636 Section 4.2)
  const challenge = base64url(sha256(verifier));
  
  // Generate state for CSRF protection (RFC 6749 Section 10.12)
  const state = generateSecureRandom(STATE_LENGTH_BYTES);
  
  // Generate nonce for OIDC replay prevention (OpenID Connect Core 1.0)
  const nonce = generateSecureRandom(NONCE_LENGTH_BYTES);

  return {
    verifier,
    challenge,
    state,
    nonce,
  };
}

/**
 * Validates PKCE verifier format
 * 
 * RFC 7636 Section 4.1 Requirements:
 * - Length: 43-128 characters
 * - Character set: [A-Z] / [a-z] / [0-9] / "-" / "." / "_" / "~"
 * 
 * @param verifier - Code verifier to validate
 * @returns true if valid, false otherwise
 */
export function isValidVerifier(verifier: string): boolean {
  if (!verifier || typeof verifier !== 'string') {
    return false;
  }
  
  // Check length (43-128 characters per RFC 7636)
  if (verifier.length < 43 || verifier.length > 128) {
    return false;
  }
  
  // Check character set (unreserved characters per RFC 3986)
  const validPattern = /^[A-Za-z0-9\-._~]+$/;
  return validPattern.test(verifier);
}

/**
 * Validates state parameter format
 * 
 * @param state - State parameter to validate
 * @returns true if valid, false otherwise
 */
export function isValidState(state: string): boolean {
  if (!state || typeof state !== 'string') {
    return false;
  }
  
  // Minimum length for security (at least 16 characters = ~96 bits for base64url)
  if (state.length < 16) {
    return false;
  }
  
  // Check URL-safe base64 character set
  const validPattern = /^[A-Za-z0-9\-_]+$/;
  return validPattern.test(state);
}

/**
 * Validates nonce parameter format
 * 
 * @param nonce - Nonce parameter to validate
 * @returns true if valid, false otherwise
 */
export function isValidNonce(nonce: string): boolean {
  // Same validation as state parameter
  return isValidState(nonce);
}

// ============================================================================
// AUTHORIZATION URL BUILDER
// ============================================================================

/**
 * Builds OAuth2/OIDC authorization URL with all required parameters
 * 
 * Includes:
 * - PKCE challenge (code_challenge, code_challenge_method)
 * - CSRF protection (state)
 * - Replay prevention (nonce)
 * - OAuth parameters (client_id, redirect_uri, scope, response_type)
 * - Optional UX parameters (login_hint, prompt, ui_locales, acr_values)
 * 
 * @param authorizationEndpoint - Keycloak authorization URL
 * @param clientId - OAuth client identifier
 * @param params - OAuth parameters including PKCE challenge
 * @returns Complete authorization URL
 * 
 * @example
 * ```ts
 * const pkce = generatePKCEChallenge();
 * const authUrl = buildAuthorizationUrl(
 *   'https://keycloak.example.com/realms/my-realm/protocol/openid-connect/auth',
 *   'my-client-id',
 *   {
 *     redirectUri: 'https://app.example.com/callback',
 *     codeChallenge: pkce.challenge,
 *     state: pkce.state,
 *     nonce: pkce.nonce,
 *     scope: 'openid profile email',
 *     loginHint: 'user@example.com',
 *   }
 * );
 * ```
 */
export function buildAuthorizationUrl(
  authorizationEndpoint: string,
  clientId: string,
  params: OAuthParams
): string {
  const url = new URL(authorizationEndpoint);
  
  // Normalize redirect URI: allow callers to pass a relative path and convert
  // it to an absolute URL using the app base. This prevents sending a
  // bare-relative '/' which Keycloak will reject as an invalid redirect_uri.
  let redirectUri = params.redirectUri;
  if (!/^https?:\/\//i.test(String(redirectUri))) {
    const appBase = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    redirectUri = `${appBase.replace(/\/$/, '')}/${String(redirectUri).replace(/^\//, '')}`;
  }

  // OAuth2 required parameters
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', params.scope || 'openid profile email');
  
  // PKCE parameters (RFC 7636)
  url.searchParams.set('code_challenge', params.codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');
  
  // CSRF protection (RFC 6749 Section 10.12)
  url.searchParams.set('state', params.state);
  
  // OIDC replay prevention (OpenID Connect Core 1.0)
  url.searchParams.set('nonce', params.nonce);
  
  // Optional UX parameters
  if (params.loginHint) {
    url.searchParams.set('login_hint', params.loginHint);
  }
  
  if (params.prompt) {
    url.searchParams.set('prompt', params.prompt);
  }
  
  if (params.uiLocales) {
    url.searchParams.set('ui_locales', params.uiLocales);
  }
  
  if (params.acrValues) {
    url.searchParams.set('acr_values', params.acrValues);
  }

  return url.toString();
}
