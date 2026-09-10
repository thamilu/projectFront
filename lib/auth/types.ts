import type { JWT } from 'next-auth/jwt';

// ─── Error Codes ──────────────────────────────────────────────────────────────

export const AuthErrorCode = {
  REFRESH_TOKEN_ERROR: 'RefreshAccessTokenError',
  INVALID_KEYCLOAK_RESPONSE: 'InvalidKeycloakResponse',
  MISSING_USER_ID: 'MissingUserId',
  CALLBACK_ERROR: 'CallbackError',
  MALFORMED_TOKEN: 'MalformedToken',
  /** Last-resort code for app/api/auth/[...nextauth]/route.ts's catch-all — an exception NextAuth itself didn't anticipate, not a specific known failure mode. */
  INTERNAL_SERVER_ERROR: 'AuthInternalServerError',
} as const;

export type AuthErrorCode = (typeof AuthErrorCode)[keyof typeof AuthErrorCode];

/**
 * Closed error taxonomy for the backend role-fetch call, mirroring
 * AuthErrorCode's pattern. Deliberately coarser than the raw messages
 * backend-role.ts logs server-side (e.g. the specific HTTP status) — this
 * field reaches the client-visible Session, so it stays a curated code
 * rather than free text; the granular detail belongs in server logs only.
 */
export const BackendRoleErrorCode = {
  /** Non-2xx HTTP response from the backend role endpoint. */
  FETCH_FAILED: 'BackendRoleFetchFailed',
  /** Network-level failure — timeout, abort, DNS, connection reset, etc. */
  NETWORK_ERROR: 'BackendRoleNetworkError',
  /** Backstop for a bug in the retry loop itself; should not occur in practice. */
  UNEXPECTED_ERROR: 'BackendRoleUnexpectedError',
} as const;

export type BackendRoleErrorCode = (typeof BackendRoleErrorCode)[keyof typeof BackendRoleErrorCode];

// ─── Keycloak OIDC Contracts ──────────────────────────────────────────────────
// KeycloakTokenResponse and KeycloakTokenPayload interfaces previously lived
// here but have been superseded by the runtime-validated Zod schemas in
// token-refresh.ts (KeycloakTokenResponseSchema) and utils.ts
// (KeycloakTokenPayloadSchema) respectively — removed as dead code once
// those schemas took over as the actual source of truth for these shapes.

export interface ExtendedJWT extends Omit<JWT, 'name' | 'email' | 'sub'> {
  accessToken: string;
  refreshToken: string;
  idToken?: string;
  expiresAt: number;
  roles: string[];
  userId: string;
  /**
   * Explicitly redeclared rather than left to the Omit<JWT, ...> inheritance
   * below: JWT's base DefaultJWT extends Record<string, unknown>, and Omit
   * over a type with an index signature erodes its named properties down to
   * the index signature's value type — the inherited `sub` would otherwise
   * silently resolve to `unknown` (not `string`) at any call site that
   * accesses it through this interface, e.g. via Partial<ExtendedJWT>.
   */
  sub: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  error?: AuthErrorCode;
  backendRoleError?: BackendRoleErrorCode;
  identityHealAttempted?: boolean;
}

// ─── Backend API Contracts ────────────────────────────────────────────────────
// BackendUserProfileResponse previously duplicated the shape backend-role.ts's
// BackendUserProfileResponseSchema (Zod) now validates at runtime — removed
// as dead code. That schema's own comment carries the `data.role` vs.
// top-level `role` envelope-ambiguity note this interface's docstring used
// to hold; resolve with the backend team there if it's ever confirmed
// unintentional.

export interface BackendRoleFetchResult {
  role: string | null;
  error?: BackendRoleErrorCode;
}

// NOTE: Module augmentations for 'next-auth' and 'next-auth/jwt' are
// centralized in shared/types/next-auth.d.ts (Single Source of Truth).
// Do NOT add declare module blocks here.
