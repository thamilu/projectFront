// scripts/validate-env.ts
// Environment validation script (TypeScript)
// Ensures required environment variables for local dev and CI are present
// and that URL-shaped variables are well-formed.

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
    warn(`Protocol mismatch: NEXTAUTH_URL uses ${auth.protocol} while NEXT_PUBLIC_API_URL uses ${api.protocol}. This may cause TLS/redirect issues.`);
  }
}

// Basic Keycloak guidance and check
if (process.env.NEXT_PUBLIC_KEYCLOAK_URL && process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID) {
  const base = new URL(process.env.NEXT_PUBLIC_KEYCLOAK_URL);
  info(`Keycloak base URL: ${base.origin}`);

  if (!process.env.NEXTAUTH_URL) {
    warn('NEXTAUTH_URL not set — Keycloak Valid Redirect URIs must include your app URL (e.g. https://app.example.com).');
  } else {
    // Ensure NEXTAUTH_URL is absolute
    try {
      const redirect = new URL(process.env.NEXTAUTH_URL);
      info(`Remember to configure Keycloak Valid Redirect URIs to include: ${redirect.origin}`);
    } catch {
      warn('NEXTAUTH_URL should be an absolute URL (e.g. https://app.example.com) for Keycloak redirect configuration.');
    }
  }
}

info('environment looks OK');
