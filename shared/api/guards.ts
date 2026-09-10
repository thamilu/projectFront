/**
 * Composable guards for this application's own API routes.
 *
 * Every guard fails by throwing an {@link ApiError}, which `withRoute()`
 * translates into the canonical error envelope. That keeps handler bodies
 * linear — `const session = await requireSession(req)` rather than an
 * early-return `NextResponse` threaded through every branch.
 *
 * @module shared/api/guards
 */

import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { JWT } from 'next-auth/jwt';
import type { ZodType, ZodError } from 'zod';
import { env } from '@/env';
import { limit } from '@/shared/utils/rate-limit';
import { ApiError, ApiErrorCode } from './errors';

// ============================================================
// 1. AUTHENTICATION
// ============================================================

/**
 * A verified caller identity, narrowed to the fields a route may rely on.
 *
 * `userId` is non-optional by construction: {@link requireSession} rejects a
 * token without a subject, so downstream code never has to null-check the
 * one field every ownership decision depends on.
 */
export interface AuthenticatedCaller {
  /** Keycloak subject claim — the stable user identifier. */
  readonly userId: string;
  /** Backend access token, for server-to-server calls made on the user's behalf. */
  readonly accessToken?: string;
  readonly roles: readonly string[];
  readonly expiresAt?: number;
  /** Full decoded token, for the rare route needing a claim not surfaced above. */
  readonly raw: JWT;
}

/**
 * Decode and verify the session cookie, or throw 401.
 *
 * [SECURITY] The secret is read from the validated `env` object, never from a
 * raw `process.env` lookup. Four routes previously used
 * `process.env.NEXTAUTH_SECRET` — a name absent from the env schema — so a
 * deployment setting only the documented Auth.js v5 name (`AUTH_SECRET`)
 * would make `getToken` throw `MissingSecret` at runtime with nothing at
 * startup to catch it. Routing through `env` means a missing secret fails
 * fast at boot instead of silently at the first payment attempt.
 */
export async function requireSession(req: NextRequest): Promise<AuthenticatedCaller> {
  let token: JWT | null;

  try {
    token = await getToken({ req, secret: env.AUTH_SECRET });
  } catch (cause) {
    // A malformed or undecryptable cookie is a client-side condition (401),
    // not a server fault — but it is worth surfacing the cause to logs, since
    // a sudden spike means a secret rotation went wrong.
    throw new ApiError(401, ApiErrorCode.NOT_AUTHENTICATED, 'Your session is no longer valid.', {
      cause,
    });
  }

  if (!token?.sub) {
    throw ApiError.unauthenticated();
  }

  return {
    userId: token.sub,
    accessToken: token.accessToken,
    roles: token.roles ?? [],
    expiresAt: token.expiresAt,
    raw: token,
  };
}

/**
 * Assert the caller holds at least one of `allowedRoles`, or throw 403.
 *
 * Authorization is deliberately separate from authentication: a route that
 * only needs "someone is signed in" should not accidentally inherit a role
 * requirement, and a route that needs a role should state it explicitly at
 * the call site rather than relying on middleware having already run.
 */
export function requireRole(
  caller: AuthenticatedCaller,
  allowedRoles: readonly string[]
): void {
  const hasRole = allowedRoles.some((role) => caller.roles.includes(role));
  if (!hasRole) {
    throw ApiError.forbidden();
  }
}

// ============================================================
// 2. REQUEST BODY
// ============================================================

/** Default cap for JSON bodies. Routes accepting uploads override this. */
export const DEFAULT_MAX_BODY_BYTES = 16 * 1024; // 16 KB

/**
 * Read, size-check, parse and schema-validate a JSON request body.
 *
 * Three failure modes, three distinct statuses — all previously conflated or
 * unhandled across the route tree:
 *
 * - **413** body exceeds `maxBytes`. Checked against the actual byte length
 *   read, not the `Content-Length` header, which a client controls and can
 *   understate. Without this an unauthenticated route accepts an arbitrarily
 *   large payload and pays to parse it (`/api/logs` had no cap at all).
 * - **400 MalformedBody** the payload is not valid JSON.
 * - **400 ValidationFailed** valid JSON that does not satisfy the schema.
 *   Field-level issues are returned in `details` so a client can map errors
 *   onto form fields rather than showing one opaque message.
 *
 * @param req      Incoming request.
 * @param schema   Zod schema describing the accepted contract.
 * @param maxBytes Byte cap; defaults to {@link DEFAULT_MAX_BODY_BYTES}.
 */
export async function readValidatedBody<T>(
  req: NextRequest,
  schema: ZodType<T>,
  maxBytes: number = DEFAULT_MAX_BODY_BYTES
): Promise<T> {
  const rawText = await req.text();

  // Byte length, not string length: a multi-byte UTF-8 payload is larger on
  // the wire than `.length` suggests.
  if (new TextEncoder().encode(rawText).byteLength > maxBytes) {
    throw ApiError.payloadTooLarge(maxBytes);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch (cause) {
    throw new ApiError(400, ApiErrorCode.MALFORMED_BODY, 'Request body must be valid JSON.', {
      cause,
    });
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    throw ApiError.validation('The request contains invalid fields.', {
      issues: formatZodIssues(result.error),
    });
  }

  return result.data;
}

/**
 * Validate URL search parameters against a schema.
 *
 * Kept separate from body validation because query strings are always flat
 * strings — schemas are expected to use `z.coerce` for numeric and boolean
 * fields rather than the caller pre-converting them.
 */
export function readValidatedQuery<T>(req: NextRequest, schema: ZodType<T>): T {
  const raw = Object.fromEntries(req.nextUrl.searchParams.entries());
  const result = schema.safeParse(raw);

  if (!result.success) {
    throw ApiError.validation('The request contains invalid query parameters.', {
      issues: formatZodIssues(result.error),
    });
  }

  return result.data;
}

/**
 * Flatten Zod issues into a stable, client-consumable shape.
 *
 * Zod's own `error.issues` carries internal fields whose shape varies between
 * minor versions; projecting to `{ field, message }` keeps this route layer's
 * public contract independent of that.
 */
function formatZodIssues(error: ZodError): Array<{ field: string; message: string }> {
  return error.issues.map((issue) => ({
    field: issue.path.join('.') || '(root)',
    message: issue.message,
  }));
}

// ============================================================
// 3. RATE LIMITING
// ============================================================

/**
 * Consume one unit of the rate-limit budget for `key`, or throw 429.
 *
 * Prefer keying on a stable identity (`userId`) over an IP address wherever
 * the route is authenticated: IP-keyed limits punish users behind a shared
 * NAT and are trivially evaded by an attacker with a proxy pool.
 *
 * The limiter degrades to an in-memory sliding window when Upstash is not
 * configured (see `shared/utils/rate-limit`), which is single-instance only —
 * acceptable as defence in depth, never as the sole control in production.
 *
 * @param key     Namespaced budget key, e.g. `payments:create-intent:<userId>`.
 * @param message Optional caller-facing message tailored to the route.
 */
export async function enforceRateLimit(key: string, message?: string): Promise<void> {
  const result = await limit(key);
  if (!result.success) {
    throw ApiError.rateLimited(message);
  }
}

/**
 * Best-effort client IP, for rate-limiting genuinely unauthenticated routes.
 *
 * [SECURITY] `x-forwarded-for` is client-spoofable unless a trusted proxy
 * overwrites it. Treat the result as a coarse bucketing hint only — never as
 * an identity, and never as an authorization input.
 */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  // The left-most entry is the original client; the rest are proxies.
  const first = forwarded?.split(',')[0]?.trim();
  return first || req.headers.get('x-real-ip') || 'unknown';
}
