import { loadEnvConfig } from '@next/env';

// Load environment variables from .env and .env.local
loadEnvConfig(process.cwd());

const PREFIX = '[env-check]';

function exitWithError(msg: string): never {
  console.error(`${PREFIX} ERROR: ${msg}`);
  process.exit(1);
}

function warn(msg: string): void {
  console.warn(`${PREFIX} WARN: ${msg}`);
}

function info(msg: string): void {
  console.log(`${PREFIX} ${msg}`);
}

function checkUrl(name: string, val: string): URL {
  try {
    const u = new URL(val);
    if (!['http:', 'https:'].includes(u.protocol)) {
      exitWithError(`${name} must be an http(s) URL`);
    }
    return u;
  } catch (e) {
    exitWithError(`${name} is not a valid URL`);
  }
}

// List of required env vars (string names)
const REQUIRED: readonly string[] = [
  'NEXT_PUBLIC_API_URL',
  'NEXTAUTH_URL',
  'NEXT_PUBLIC_KEYCLOAK_URL',
  'NEXT_PUBLIC_KEYCLOAK_CLIENT_ID',
];

// Explicit list of env vars that should be validated as URLs
const URL_VARS: readonly string[] = [
  'NEXT_PUBLIC_API_URL',
  'NEXTAUTH_URL',
  'NEXT_PUBLIC_KEYCLOAK_URL',
];

// Run checks
for (const name of REQUIRED) {
  const val = process.env[name];
  if (!val) {
    exitWithError(`Missing required env var: ${name}`);
  }
  if (URL_VARS.includes(name)) {
    checkUrl(name, val);
  }
}

// Protocol consistency check (useful for TLS/redirect issues)
if (process.env.NEXTAUTH_URL && process.env.NEXT_PUBLIC_API_URL) {
  const auth = new URL(process.env.NEXTAUTH_URL);
  const api = new URL(process.env.NEXT_PUBLIC_API_URL);
  if (auth.protocol !== api.protocol) {
    warn(
      `Protocol mismatch: NEXTAUTH_URL uses ${auth.protocol} while NEXT_PUBLIC_API_URL uses ${api.protocol}. This may cause TLS/redirect issues.`
    );
  }
}

// Rate limiting (Upstash) — in production this silently no-ops with zero
// alerting if unconfigured (see proxy/utils/ratelimit.ts isUpstashConfigured),
// leaving auth/registration routes with no brute-force protection. Fail the
// build rather than ship that silently.
const appEnv = process.env.NEXT_PUBLIC_APP_ENV;
if (appEnv === 'production' || appEnv === 'staging') {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  const isPlaceholder = (v: string | undefined) =>
    !v || v.trim() === '' || v.includes('placeholder');

  const rateLimitOverride = process.env.ALLOW_UNRATELIMITED_DEPLOY === 'true';
  if ((isPlaceholder(upstashUrl) || isPlaceholder(upstashToken)) && !rateLimitOverride) {
    exitWithError(
      'UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are missing or placeholder in ' +
        `${appEnv}. Rate limiting on /api/auth and /seller/register would be silently ` +
        'disabled — set real Upstash credentials or explicitly acknowledge this via ' +
        'ALLOW_UNRATELIMITED_DEPLOY=true if this environment intentionally has no rate limiting.'
    );
  }
  if (rateLimitOverride) {
    warn(
      `ALLOW_UNRATELIMITED_DEPLOY=true — rate limiting is intentionally disabled in ${appEnv}.`
    );
  }
} else if (
  !process.env.UPSTASH_REDIS_REST_URL ||
  process.env.UPSTASH_REDIS_REST_URL.includes('placeholder')
) {
  warn('UPSTASH_REDIS_REST_URL not set — rate limiting is disabled in this environment.');
}

// Basic Keycloak guidance and check
if (process.env.NEXT_PUBLIC_KEYCLOAK_URL && process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID) {
  const base = new URL(process.env.NEXT_PUBLIC_KEYCLOAK_URL);
  info(`Keycloak base URL: ${base.origin}`);

  if (!process.env.NEXTAUTH_URL) {
    warn(
      'NEXTAUTH_URL not set — Keycloak Valid Redirect URIs must include your app URL (e.g. https://app.example.com).'
    );
  } else {
    // Ensure NEXTAUTH_URL is absolute
    try {
      const redirect = new URL(process.env.NEXTAUTH_URL);
      info(`Remember to configure Keycloak Valid Redirect URIs to include: ${redirect.origin}`);
    } catch {
      warn(
        'NEXTAUTH_URL should be an absolute URL (e.g. https://app.example.com) for Keycloak redirect configuration.'
      );
    }
  }
}

info('environment looks OK');
