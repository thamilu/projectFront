import { decodeJwt } from 'jose';
import { z } from 'zod';
import { logger } from '@/core/telemetry/logger';
import { REFRESH_CONFIG } from './config';
import type { ExtendedJWT } from './types';
import { AuthErrorCode } from './types';
import { mapUserRole } from '@/domains/auth/utils/role-mapper';
import { UserRole } from '@/domains/auth/contracts/auth.types';

// decodeJwt() only verifies the token is well-formed base64url/JSON — it
// does not verify any claim actually has the shape KeycloakTokenPayload
// declares. Without this, a claim present but wrongly-typed (e.g.
// realm_access.roles as a string instead of an array) wouldn't be caught by
// the `?.`/`??` chains below — those only guard against MISSING fields, not
// wrong-typed ones — and would only surface as a thrown TypeError from
// `.map()`, caught generically by the try/catch further down with no
// specific diagnostic. All fields optional here (unlike the interface's
// `sub: string`): jose's real JWTPayload type has no guaranteed claims, and
// the fallback chains below already treat every field as potentially
// absent — this schema formalizes that same tolerance, not a stricter one.
// .passthrough() preserves unknown claims rather than stripping them,
// matching KeycloakTokenPayload's `[key: string]: unknown` index signature.
const KeycloakTokenPayloadSchema = z
  .object({
    sub: z.string().optional(),
    email: z.string().optional(),
    given_name: z.string().optional(),
    family_name: z.string().optional(),
    name: z.string().optional(),
    realm_access: z.object({ roles: z.array(z.string()) }).optional(),
  })
  .passthrough();

// ─── Duration Measurement ─────────────────────────────────────────────────────

/**
 * Node.js & browser safe elapsed duration helper (in milliseconds).
 * Uses `performance.now()` when available for monotonic precision.
 */
export const measurementStart = (): number =>
  typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();

export const elapsedMs = (start: number): number => {
  const nowMs =
    typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
  return Math.round(nowMs - start);
};

// ─── Sleep Primitive ──────────────────────────────────────────────────────────

/**
 * Server-safe sleep primitive.
 * Defined inline to prevent bringing browser-only code from large shared barrel exports.
 */
export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// ─── Timeout Primitive ────────────────────────────────────────────────────────

/**
 * Races `promise` against a timeout, rejecting if `timeoutMs` elapses first.
 * For external calls (e.g. Redis) whose own client has no timeout, or one
 * far longer than acceptable on a hot request path — see token-refresh.ts's
 * distributed lock calls, which previously had no bound at all.
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage = 'Operation timed out'
): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

// ─── Token Expiry ─────────────────────────────────────────────────────────────

/**
 * Checks if a token is expired relative to absolute Unix timestamps in
 * seconds. Not exported beyond this file — isTokenValid is the public
 * surface every caller outside this module actually needs.
 */
const isTokenExpired = (expiresAt: number, bufferSeconds = 0): boolean => {
  const nowSeconds = Math.floor(Date.now() / 1000);
  return nowSeconds + bufferSeconds >= expiresAt;
};

/**
 * Checks if the cached token is valid (not expired with buffer).
 */
export const isTokenValid = (expiresAt: number | undefined): boolean => {
  if (!expiresAt) return false;
  return !isTokenExpired(expiresAt, REFRESH_CONFIG.BUFFER_SECONDS);
};

// ─── JWT User Extraction ──────────────────────────────────────────────────────

/**
 * Extracts user profile data from a Keycloak access token JWT.
 *
 * SECURITY NOTE: `decodeJwt` does not verify the signature. This is safe at
 * every current call site of this function because each one operates on a
 * token from a trusted source, for one of two distinct reasons — not the
 * same reason in every case, so both are spelled out explicitly:
 *   (a) a token received directly from Keycloak's token endpoint over an
 *       authenticated server-to-server HTTPS request (handleInitialSignIn,
 *       refreshAccessToken in token-refresh.ts), or
 *   (b) a token already sourced from NextAuth's encrypted session cookie,
 *       which NextAuth itself has already decrypted (the healing branch in
 *       handleTokenRefreshIfNeeded).
 * Do NOT reuse this function on a token obtained from client-supplied input
 * — neither justification holds there, and the missing signature check
 * would matter.
 */
export function extractUserFromToken(
  accessToken: string,
  fallback?: Partial<ExtendedJWT>
): Partial<ExtendedJWT> {
  try {
    const rawDecoded = decodeJwt(accessToken);
    const parsed = KeycloakTokenPayloadSchema.safeParse(rawDecoded);
    if (!parsed.success) {
      logger.warn('[Auth] Decoded JWT claims did not match the expected shape — using safe defaults', {
        issues: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      });
    }
    // A validation failure still degrades gracefully to the fallback chains
    // below (same as a missing field) rather than throwing — this schema
    // exists to catch wrong-typed claims via .safeParse, not to make this
    // function any less tolerant of an incomplete/unusual token.
    const decoded: Partial<z.infer<typeof KeycloakTokenPayloadSchema>> = parsed.success
      ? parsed.data
      : {};
    const rawRoles = decoded.realm_access?.roles ?? fallback?.roles ?? [];
    const mappedRoles: UserRole[] = [];
    for (const role of rawRoles) {
      const mapped = mapUserRole(role);
      if (mapped === null) {
        // A role Keycloak issued but this frontend doesn't recognize (e.g. a
        // new realm role added IdP-side without a matching update to
        // role-mapper.ts) is otherwise dropped with zero signal — the user
        // just silently ends up missing permissions they should have, with
        // no log line pointing anyone toward the cause.
        logger.warn('[Auth] Unmapped Keycloak role encountered — dropped, not applied', { role });
      } else {
        mappedRoles.push(mapped);
      }
    }

    // userId and sub are treated as interchangeable/mutually-healing
    // everywhere else in this module (see healTokenIdentity) — falling back
    // to two different fields on the same `fallback` object here would
    // leave userId unset for a fallback token that only had sub populated
    // (a plausible partially-healed state).
    const fallbackId = fallback?.userId || fallback?.sub;

    return {
      roles: mappedRoles,
      userId: decoded.sub ?? fallbackId,
      sub: decoded.sub ?? fallbackId,
      firstName: decoded.given_name ?? fallback?.firstName ?? '',
      lastName: decoded.family_name ?? fallback?.lastName ?? '',
      name: decoded.name ?? fallback?.name ?? '',
      email: decoded.email ?? fallback?.email ?? '',
    };
  } catch (error) {
    logger.error('[Auth] Failed to decode JWT', {
      error: error instanceof Error ? error.message : String(error),
    });
    return fallback ?? {};
  }
}

// ─── Token Healing and Error Construction ────────────────────────────────────

/**
 * Mutually heals missing userId or sub inside JWT.
 * Returns a new token object to prevent direct mutations.
 */
export function healTokenIdentity(token: ExtendedJWT): ExtendedJWT {
  const userId = token.userId || token.sub || '';
  const sub = token.sub || token.userId || '';

  if (userId === token.userId && sub === token.sub) {
    return token;
  }

  return { ...token, userId, sub };
}

/**
 * Creates a type-safe error token with all required fields defaulted.
 */
export function createErrorToken(error: AuthErrorCode): ExtendedJWT {
  return {
    error,
    accessToken: '',
    refreshToken: '',
    idToken: undefined,
    expiresAt: 0,
    roles: [],
    userId: '',
    sub: '',
    firstName: '',
    lastName: '',
    name: '',
    email: '',
  };
}

// ─── Type Guards ─────────────────────────────────────────────────────────────

/**
 * Type guard that verifies a JWT token has the ExtendedJWT shape.
 *
 * Checks field TYPES, not just key presence — `expiresAt` in particular
 * directly drives isTokenValid()'s refresh-loop termination condition, so a
 * present-but-wrong-typed value (e.g. NaN, or a string) is exactly as unsafe
 * to let through as a missing one.
 */
export function isExtendedJWT(token: unknown): token is ExtendedJWT {
  if (typeof token !== 'object' || token === null) return false;
  const t = token as Record<string, unknown>;
  return (
    typeof t.accessToken === 'string' &&
    typeof t.expiresAt === 'number' &&
    !Number.isNaN(t.expiresAt) &&
    Array.isArray(t.roles)
  );
}

/**
 * Casts a JWT to ExtendedJWT, validating its shape in every environment —
 * not just development. A shape mismatch degrades to a fresh error token
 * (MALFORMED_TOKEN) rather than silently passing bad data through: the
 * caller ends up on the same handled, logged, recoverable path as any other
 * auth error (session.error set → NextAuthProvider forces re-auth), instead
 * of an unvalidated cast that lets a malformed token propagate deeper into
 * the system — where it previously surfaced only as a downstream crash
 * (e.g. NaN expiry, or `.length` on a non-array `roles`) with no connection
 * back to its actual root cause.
 */
export function asExtendedJWT(token: unknown): ExtendedJWT {
  if (isExtendedJWT(token)) {
    return token;
  }

  logger.error('[Auth] Token does not match ExtendedJWT shape — forcing re-authentication', {
    tokenKeys: token && typeof token === 'object' ? Object.keys(token) : [],
  });
  return createErrorToken(AuthErrorCode.MALFORMED_TOKEN);
}
