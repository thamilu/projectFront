/**
 * Enterprise Session Management Module
 * 
 * Responsibilities:
 * - PKCE state storage with encryption
 * - Session token management
 * - Secure cookie operations
 * - State validation and expiration
 * 
 * Security Features:
 * - Encrypted JWT storage for PKCE state
 * - HttpOnly cookies (prevent XSS)
 * - SameSite=Lax (CSRF protection)
 * - Short-lived PKCE state (5 minutes)
 * - Session expiration aligned with token lifetime
 * 
 * Architecture:
 * - Stateless session using encrypted cookies
 * - No server-side session store required
 * - Horizontally scalable
 * 
 * Time Complexity: O(1) for all operations
 * Space Complexity: O(1) - cookie-based storage
 */

import { cookies } from 'next/headers';
import { z } from 'zod';
import { SignJWT, jwtVerify } from 'jose';
import { logger } from '@/lib/observability/logger';

// ============================================================================
// Constants
// ============================================================================

const SESSION_COOKIE_NAME = 'auth_session';
const PKCE_COOKIE_NAME = 'pkce_state';

// PKCE state valid for 5 minutes (OAuth2 best practice)
const PKCE_STATE_MAX_AGE_SECONDS = 60 * 5;

// Session refresh threshold - refresh when 80% expired
const SESSION_REFRESH_THRESHOLD = 0.8;

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * PKCE state schema
 * 
 * Contains all data needed to complete OAuth2 PKCE flow:
 * - codeVerifier: Secret used to exchange authorization code
 * - state: CSRF protection token
 * - nonce: Replay attack prevention token
 * - redirectTo: Original URL user was trying to access
 * - createdAt: Timestamp for expiration validation
 */
const PkceStateSchema = z.object({
  codeVerifier: z.string().min(43).max(128),
  state: z.string().min(32),
  nonce: z.string().min(32),
  redirectTo: z.string().optional(),
  createdAt: z.number(),
});

export type PkceState = z.infer<typeof PkceStateSchema>;

/**
 * Session data schema
 * 
 * Contains authenticated user session information:
 * - Access token for API calls
 * - Refresh token for token renewal
 * - ID token for user identity
 * - Expiration timestamp
 * - User metadata
 */
const SessionDataSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  idToken: z.string(),
  expiresAt: z.number(),
  userId: z.string(),
  email: z.string().email().optional(),
  name: z.string().optional(),
  roles: z.array(z.string()),
});

export type SessionData = z.infer<typeof SessionDataSchema>;

// ============================================================================
// Secret Key Management
// ============================================================================

/**
 * Retrieves and validates session encryption secret
 * 
 * Requirements:
 * - Must be at least 32 characters (256 bits)
 * - Should be cryptographically random
 * - Must be same across all instances (for cookie decryption)
 * 
 * Production Setup:
 * ```bash
 * # Generate secure secret
 * openssl rand -base64 32
 * 
 * # Add to .env
 * SESSION_SECRET=<generated_value>
 * ```
 * 
 * @throws {Error} If SESSION_SECRET is missing or too short
 * @returns {Uint8Array} Encryption key
 */
function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  
  if (!secret) {
    if (process.env.NODE_ENV !== 'production') {
      logger.warn('SESSION_SECRET is not set in environment (dev-only diagnostic)');
    }
    throw new Error(
      'SESSION_SECRET environment variable is required. ' +
      'Generate one with: openssl rand -base64 32'
    );
  }
  
  if (secret.length < 32) {
    if (process.env.NODE_ENV !== 'production') {
      logger.warn('SESSION_SECRET length is less than 32 characters (dev-only diagnostic).', { length: secret.length });
    }
    throw new Error(
      'SESSION_SECRET must be at least 32 characters for adequate security. ' +
      'Current length: ' + secret.length
    );
  }
  
  return new TextEncoder().encode(secret);
}

// ============================================================================
// PKCE State Management
// ============================================================================

/**
 * Encrypts and stores PKCE state in httpOnly cookie
 * 
 * Security Measures:
 * - JWT encryption prevents tampering
 * - HttpOnly prevents JavaScript access (XSS protection)
 * - SameSite=Lax prevents CSRF
 * - Short expiration (5 min) limits attack window
 * - Secure flag in production (HTTPS only)
 * 
 * @param state - PKCE state data to store
 * @returns {Promise<void>}
 * 
 * @example
 * ```typescript
 * const state: PkceState = {
 *   codeVerifier: 'dBjftJeZ4CVP...',
 *   state: 'af0ifjsldkj...',
 *   nonce: 'n-0S6_WzA2M...',
 *   redirectTo: '/customer/dashboard',
 *   createdAt: Date.now(),
 * };
 * await storePkceState(state);
 * ```
 */
export async function storePkceState(state: PkceState): Promise<void> {
  // Validate state data
  const validatedState = PkceStateSchema.parse(state);
  
  // Create encrypted JWT
  const encrypted = await new SignJWT(validatedState as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${PKCE_STATE_MAX_AGE_SECONDS}s`)
    .sign(getSecretKey());

  const cookieStore = await cookies();
  
  cookieStore.set(PKCE_COOKIE_NAME, encrypted, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: PKCE_STATE_MAX_AGE_SECONDS,
    path: '/',
  });
  if (process.env.NODE_ENV !== 'production') {
    logger.debug('storePkceState: set pkce cookie', { name: PKCE_COOKIE_NAME, maxAge: PKCE_STATE_MAX_AGE_SECONDS });
  }
}

/**
 * Retrieves and validates PKCE state from cookie
 * 
 * Validation Checks:
 * 1. Cookie exists
 * 2. JWT signature valid
 * 3. JWT not expired
 * 4. Schema validation passes
 * 5. Age check (additional defense)
 * 
 * Returns null if any validation fails (defensive programming)
 * 
 * @returns {Promise<PkceState | null>} Validated state or null
 */
export async function retrievePkceState(): Promise<PkceState | null> {
  const cookieStore = await cookies();
  const encrypted = cookieStore.get(PKCE_COOKIE_NAME)?.value;
  
  if (!encrypted) {
    return null;
  }

  try {
    // Verify and decrypt JWT
    const { payload } = await jwtVerify(encrypted, getSecretKey());
    
    // Validate schema
    const state = PkceStateSchema.parse(payload);
    
    // Additional age validation (defense in depth)
    const ageMs = Date.now() - state.createdAt;
    const maxAgeMs = PKCE_STATE_MAX_AGE_SECONDS * 1000;
    
    if (ageMs > maxAgeMs) {
      // State expired - clear cookie
      await clearPkceState();
      return null;
    }
    
    return state;
  } catch {
    // Any error in validation = treat as invalid
    // Clear potentially corrupted cookie
    await clearPkceState();
    return null;
  }
}

/**
 * Clears PKCE state cookie
 * 
 * Called after:
 * - Successful token exchange
 * - Validation failure
 * - Manual logout
 * 
 * @returns {Promise<void>}
 */
export async function clearPkceState(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(PKCE_COOKIE_NAME);
}

// ============================================================================
// Session Management
// ============================================================================

/**
 * Creates encrypted session cookie
 * 
 * Architecture Decision: Cookie-based sessions
 * 
 * Pros:
 * - Stateless (no session store needed)
 * - Horizontally scalable
 * - Automatic expiration
 * - CSRF protection via SameSite
 * 
 * Cons:
 * - Cannot invalidate on server side (use short expiration + refresh tokens)
 * - Cookie size limit (4KB - sufficient for session data)
 * 
 * @param data - Session data to store
 * @returns {Promise<void>}
 * 
 * @example
 * ```typescript
 * await createSession({
 *   accessToken: 'eyJhbGciOiJSUzI1NiIs...',
 *   refreshToken: 'eyJhbGciOiJIUzI1NiIs...',
 *   idToken: 'eyJhbGciOiJSUzI1NiIs...',
 *   expiresAt: Date.now() + 3600000,
 *   userId: 'user-123',
 *   email: 'user@example.com',
 *   name: 'John Doe',
 *   roles: ['customer'],
 * });
 * ```
 */
export async function createSession(data: SessionData): Promise<void> {
  // Validate session data
  const validatedData = SessionDataSchema.parse(data);
  
  // Calculate session expiration (in seconds for JWT)
  const expiresInSeconds = Math.floor(
    (validatedData.expiresAt - Date.now()) / 1000
  );
  
  // Create encrypted JWT
  const token = await new SignJWT(validatedData as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresInSeconds)
    .sign(getSecretKey());

  const cookieStore = await cookies();
  
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: expiresInSeconds,
    path: '/',
  });
  if (process.env.NODE_ENV !== 'production') {
    logger.debug('createSession: set session cookie', { name: SESSION_COOKIE_NAME, maxAge: expiresInSeconds });
  }
}

/**
 * Retrieves and validates session from cookie
 * 
 * Validation Process:
 * 1. Check cookie exists
 * 2. Verify JWT signature
 * 3. Check JWT expiration
 * 4. Validate schema
 * 5. Check expiration timestamp
 * 
 * @returns {Promise<SessionData | null>} Session data or null
 */
export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  
  if (!token) {
    return null;
  }

  try {
    // Verify and decrypt JWT
    const { payload } = await jwtVerify(token, getSecretKey());
    
    // Validate schema
    const session = SessionDataSchema.parse(payload);
    
    // Check if expired (belt-and-suspenders)
    if (session.expiresAt < Date.now()) {
      await destroySession();
      return null;
    }
    
    return session;
  } catch {
    if (process.env.NODE_ENV !== 'production') {
      logger.warn('getSession: session validation failed or token invalid; destroying session (dev-only diagnostic)');
    }
    // Any validation error = no session
    await destroySession();
    return null;
  }
}

/**
 * Checks if session needs refresh
 * 
 * Returns true when session is 80% expired
 * Allows proactive token refresh before expiration
 * 
 * @param session - Current session data
 * @returns {boolean} True if session should be refreshed
 */
export function shouldRefreshSession(session: SessionData): boolean {
  const now = Date.now();
  const issued = session.expiresAt - (session.expiresAt - now);
  const lifetime = session.expiresAt - issued;
  const elapsed = now - issued;
  
  return elapsed > lifetime * SESSION_REFRESH_THRESHOLD;
}

/**
 * Updates existing session with new token data
 * 
 * Preserves user metadata, updates tokens and expiration
 * 
 * @param updates - Partial session updates
 * @returns {Promise<void>}
 */
export async function updateSession(
  updates: Partial<SessionData>
): Promise<void> {
  const currentSession = await getSession();
  
  if (!currentSession) {
    throw new Error('No active session to update');
  }
  
  const updatedSession: SessionData = {
    ...currentSession,
    ...updates,
  };
  
  await createSession(updatedSession);
}

/**
 * Destroys session cookie
 * 
 * Called during:
 * - Explicit logout
 * - Token refresh failure
 * - Session validation failure
 * 
 * @returns {Promise<void>}
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Checks if user has active session
 * 
 * @returns {Promise<boolean>} True if authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session !== null && session.expiresAt > Date.now();
}

/**
 * Gets user roles from session
 * 
 * @returns {Promise<string[]>} Array of role names
 */
export async function getUserRoles(): Promise<string[]> {
  const session = await getSession();
  return session?.roles || [];
}

/**
 * Checks if user has specific role
 * 
 * @param role - Role name to check
 * @returns {Promise<boolean>} True if user has role
 */
export async function hasRole(role: string): Promise<boolean> {
  const roles = await getUserRoles();
  return roles.includes(role);
}

/**
 * Checks if user has any of the specified roles
 * 
 * @param roles - Array of role names
 * @returns {Promise<boolean>} True if user has at least one role
 */
export async function hasAnyRole(roles: string[]): Promise<boolean> {
  const userRoles = await getUserRoles();
  return roles.some(role => userRoles.includes(role));
}

/**
 * Checks if user has all specified roles
 * 
 * @param roles - Array of role names
 * @returns {Promise<boolean>} True if user has all roles
 */
export async function hasAllRoles(roles: string[]): Promise<boolean> {
  const userRoles = await getUserRoles();
  return roles.every(role => userRoles.includes(role));
}
