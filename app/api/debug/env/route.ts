import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/observability/logger';

/**
 * Environment Variable Status
 */
interface EnvVarStatus {
  present: boolean;
  length?: number;
  valid?: boolean;
}

/**
 * Environment Diagnostic Response Structure
 */
interface EnvDiagnosticResponse {
  meta: {
    generatedAt: string;
    nodeVersion: string;
    nextRuntime: string;
    host: string | null;
  };
  status: {
    allRequiredPresent: boolean;
    missingRequired: string[];
  };
  variables: {
    NODE_ENV: string;
    SESSION_SECRET: EnvVarStatus;
    KEYCLOAK_AUTH_SERVER_URL: EnvVarStatus;
    KEYCLOAK_REALM: EnvVarStatus;
    KEYCLOAK_CLIENT_ID: EnvVarStatus;
    NEXT_PUBLIC_API_URL: EnvVarStatus;
    NEXT_PUBLIC_API_BASE_URL: EnvVarStatus;
  };
}

/**
 * Required environment variables for application to function
 */
const REQUIRED_VARS = [
  'SESSION_SECRET',
  'KEYCLOAK_AUTH_SERVER_URL',
  'KEYCLOAK_REALM',
  'KEYCLOAK_CLIENT_ID',
] as const;

/**
 * Checks non-sensitive environment variables (URLs, IDs)
 * Returns presence and length for debugging connectivity issues
 */
const safeEnvCheck = (v?: string): EnvVarStatus => ({
  present: !!v,
  length: v?.length ?? 0,
});

/**
 * Checks sensitive environment variables (secrets, tokens)
 * Returns presence and validity WITHOUT exposing exact length
 * (to prevent cryptographic analysis or rotation pattern detection)
 */
const safeSecretCheck = (v?: string): EnvVarStatus => ({
  present: !!v,
  valid: v ? v.length >= 32 : false, // Boolean validation instead of exact length
});

/**
 * Dev-only environment diagnostic endpoint
 *
 * @endpoint GET /api/debug/env
 * @returns 200 - Environment diagnostic payload (localhost + development only)
 * @returns 404 - Not found (production or non-localhost access)
 *
 * Security Features:
 * - ONLY enabled when NODE_ENV === 'development' AND accessed from localhost
 * - Returns metadata (presence/validity) NOT actual secret values
 * - Secret lengths hidden to prevent cryptographic attack vectors
 * - All access attempts logged for security audit trail
 * - 404 response to avoid revealing endpoint existence in production
 * - Cache-Control headers prevent accidental caching
 *
 * Use Cases:
 * - Verify environment configuration during local development
 * - Debug missing or malformed environment variables
 * - Validate configuration before deployment
 * - Troubleshoot connectivity issues with external services
 *
 * @see https://nextjs.org/docs/app/building-your-application/configuring/environment-variables
 */
export function GET(req: NextRequest): NextResponse {
  const host = req.headers.get('host');
  const userAgent = req.headers.get('user-agent');
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

  // Explicit allowlist: only localhost in development environment
  const isLocalDev =
    process.env.NODE_ENV === 'development' && (host?.startsWith('localhost') ?? false);

  // Log all access attempts for security audit trail
  if (!isLocalDev) {
    logger.warn('[Debug Endpoint] Unauthorized access attempt to /api/debug/env', {
      host,
      userAgent,
      ip,
      nodeEnv: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
    // Return 404 to avoid revealing endpoint existence
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Log legitimate access for debugging purposes
  logger.info('[Debug Endpoint] Environment diagnostic accessed', {
    host,
    userAgent,
    ip,
    timestamp: new Date().toISOString(),
  });

  // Check which required variables are missing
  const missingRequired = REQUIRED_VARS.filter((key) => !process.env[key]);

  const payload: EnvDiagnosticResponse = {
    meta: {
      generatedAt: new Date().toISOString(),
      nodeVersion: process.version,
      nextRuntime: process.env.NEXT_RUNTIME || 'nodejs',
      host,
    },
    status: {
      allRequiredPresent: missingRequired.length === 0,
      missingRequired,
    },
    variables: {
      NODE_ENV: process.env.NODE_ENV || 'development',
      // Sensitive variables - hide exact length
      SESSION_SECRET: safeSecretCheck(process.env.SESSION_SECRET),
      // Non-sensitive variables - show length for debugging
      KEYCLOAK_AUTH_SERVER_URL: safeEnvCheck(process.env.KEYCLOAK_AUTH_SERVER_URL),
      KEYCLOAK_REALM: safeEnvCheck(process.env.KEYCLOAK_REALM),
      KEYCLOAK_CLIENT_ID: safeEnvCheck(process.env.KEYCLOAK_CLIENT_ID),
      NEXT_PUBLIC_API_URL: safeEnvCheck(process.env.NEXT_PUBLIC_API_URL),
      NEXT_PUBLIC_API_BASE_URL: safeEnvCheck(process.env.NEXT_PUBLIC_API_BASE_URL),
    },
  };

  return NextResponse.json(payload, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Robots-Tag': 'noindex, nofollow',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
