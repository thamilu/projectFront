/**
 * GET /api/auth/health
 *
 * Liveness/readiness probe for the authentication subsystem.
 *
 * [SECURITY] The public response is deliberately opaque — `{ status }` and a
 * timestamp, nothing more. The previous version returned which secrets were
 * configured plus `NODE_ENV` to any anonymous caller, and echoed the raw
 * `error.message` on failure. Configuration disclosure is free reconnaissance:
 * it tells an attacker which integrations exist and which are half-configured.
 *
 * Detail is still available to operators, gated behind the internal service
 * credential (`INTERNAL_API_SECRET`) via `Authorization: Bearer <secret>`.
 *
 * [CORRECTNESS] The check now reads `env.AUTH_SECRET`. The previous version
 * tested `process.env.NEXTAUTH_SECRET` — a name that is not in the env schema —
 * so a deployment using only the documented Auth.js v5 variable reported a
 * permanent 503 "unhealthy". Wired to a load balancer, that would have pulled a
 * perfectly healthy service out of rotation.
 */

import type { NextRequest } from 'next/server';
import { env } from '@/env';
import { apiSuccess } from '@/shared/api';
import { getRequestLogger } from '@/core/telemetry/logger';

/**
 * Never prerendered or cached: a probe must reflect the live process, and a
 * cached "healthy" is worse than no probe at all. The previous version set
 * neither, so it was eligible for static optimisation.
 */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/** One configuration item the auth subsystem needs in order to function. */
interface HealthCheck {
  readonly name: string;
  readonly ok: boolean;
  /** Whether a failure here makes the subsystem non-functional. */
  readonly required: boolean;
}

/**
 * Evaluate configuration presence.
 *
 * Presence only — never a value, a length, or a prefix. Length in particular is
 * worth withholding: it narrows the search space for a brute-force attempt and
 * can fingerprint a key-rotation scheme.
 */
function runChecks(): HealthCheck[] {
  return [
    { name: 'authSecret', ok: Boolean(env.AUTH_SECRET), required: true },
    { name: 'keycloakIssuer', ok: Boolean(env.KEYCLOAK_ISSUER), required: true },
    { name: 'keycloakClientId', ok: Boolean(env.KEYCLOAK_CLIENT_ID), required: true },
    { name: 'keycloakClientSecret', ok: Boolean(env.KEYCLOAK_CLIENT_SECRET), required: true },
    { name: 'backendApiUrl', ok: Boolean(env.SPRING_BOOT_API_URL), required: true },
    // Optional: absence degrades rate limiting to a single-instance in-memory
    // window rather than breaking authentication outright.
    { name: 'redisRateLimiter', ok: Boolean(env.UPSTASH_REDIS_REST_URL), required: false },
  ];
}

/**
 * Constant-time comparison, so a caller cannot recover the operator credential
 * by measuring how long a mismatch takes to reject.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/** True when the caller presented the internal service credential. */
function isOperator(req: NextRequest): boolean {
  const secret = env.INTERNAL_API_SECRET;
  if (!secret) return false;

  const header = req.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return false;

  return timingSafeEqual(header.slice('Bearer '.length), secret);
}

export async function GET(req: NextRequest) {
  const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
  const checks = runChecks();

  const failedRequired = checks.filter((check) => check.required && !check.ok);
  const healthy = failedRequired.length === 0;

  if (!healthy) {
    // Logged with the specifics an operator needs, so the detail exists
    // somewhere auditable even though the response withholds it.
    getRequestLogger(requestId, { route: 'auth/health' }).error(
      '[AuthHealth] Required configuration is missing',
      { missing: failedRequired.map((check) => check.name) }
    );
  }

  const status = healthy ? 'healthy' : 'unhealthy';
  const timestamp = new Date().toISOString();

  // ---------- Operator view ----------
  if (isOperator(req)) {
    return apiSuccess(
      {
        status,
        timestamp,
        environment: env.NODE_ENV,
        checks: checks.map(({ name, ok, required }) => ({ name, ok, required })),
      },
      { status: healthy ? 200 : 503, requestId }
    );
  }

  // ---------- Public view ----------
  // Enough for a load balancer to route on; nothing an attacker can use.
  return apiSuccess({ status, timestamp }, { status: healthy ? 200 : 503, requestId });
}
