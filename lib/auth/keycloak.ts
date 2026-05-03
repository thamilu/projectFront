import { createRemoteJWKSet, jwtVerify } from 'jose';

// Minimal local payload type (avoid depending on jose types in TS when not installed)
export type JWTPayload = Record<string, unknown>;

// Prefer explicit JWK and issuer URIs if provided (matches Spring properties)
const KEYCLOAK_JWK_URI = process.env.KEYCLOAK_JWK_URI || process.env.NEXT_PUBLIC_KEYCLOAK_JWK_URI;
const KEYCLOAK_ISSUER_URI = process.env.KEYCLOAK_ISSUER_URI || process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER_URI;
const KEYCLOAK_URL = process.env.NEXT_PUBLIC_KEYCLOAK_URL || process.env.KEYCLOAK_URL;
const REALM = process.env.NEXT_PUBLIC_KEYCLOAK_REALM || process.env.KEYCLOAK_REALM;
const CLIENT_ID = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || process.env.KEYCLOAK_CLIENT_ID;

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
let issuerFromEnv: string | null = null;

if (KEYCLOAK_JWK_URI) {
  jwks = createRemoteJWKSet(new URL(KEYCLOAK_JWK_URI));
}

// Fallback: build from base URL + realm (guard against undefined KEYCLOAK_URL)
if (!jwks && KEYCLOAK_URL && REALM) {
  const base = (KEYCLOAK_URL ?? '').replace(/\/$/, '');
  const jwksUrl = `${base}/realms/${REALM}/protocol/openid-connect/certs`;
  jwks = createRemoteJWKSet(new URL(jwksUrl));
}

// issuer: prefer explicit issuer URI, else derive from base URL + realm
if (KEYCLOAK_ISSUER_URI) issuerFromEnv = KEYCLOAK_ISSUER_URI;
else if (KEYCLOAK_URL && REALM) {
  const base = (KEYCLOAK_URL ?? '').replace(/\/$/, '');
  issuerFromEnv = `${base}/realms/${REALM}`;
}

export async function verifyAccessToken(token: string): Promise<JWTPayload> {
  if (!jwks) throw new Error('Keycloak JWKS not configured (KEYCLOAK_JWK_URI or KEYCLOAK_URL + REALM)');

  // Determine issuer
  const issuer = issuerFromEnv ?? ((KEYCLOAK_URL && REALM) ? `${(KEYCLOAK_URL ?? '').replace(/\/$/, '')}/realms/${REALM}` : null);
  if (!issuer) throw new Error('Keycloak issuer not configured (KEYCLOAK_ISSUER_URI or KEYCLOAK_URL + REALM)');

  const options: Record<string, unknown> = { issuer };
  if (CLIENT_ID) options.audience = CLIENT_ID;

  const jwksArg = jwks as unknown as Parameters<typeof jwtVerify>[1];
  const { payload } = await jwtVerify(token, jwksArg, options);
  return payload as JWTPayload;
}

export function extractRolesFromPayload(payload: JWTPayload, clientId?: string): string[] {
  const roles: string[] = [];
  if (!payload) return roles;
  // realm roles
  const realmAccess = (payload as Record<string, unknown>).realm_access as Record<string, unknown> | undefined;
  const realmRoles = realmAccess?.roles;
  if (realmRoles && Array.isArray(realmRoles)) roles.push(...(realmRoles as string[]));

  // client/resource roles
  const resourceAccess = (payload as Record<string, unknown>).resource_access as Record<string, unknown> | undefined;
  if (resourceAccess) {
    const entry = clientId ? resourceAccess[clientId] as Record<string, unknown> | undefined : undefined;
    const entryRoles = entry?.roles;
    if (entryRoles && Array.isArray(entryRoles)) {
      roles.push(...(entryRoles as string[]));
    }
    // also collect any other client roles
    Object.values(resourceAccess).forEach((r) => {
      const rec = r as Record<string, unknown> | undefined;
      const recRoles = rec?.roles;
      if (recRoles && Array.isArray(recRoles)) roles.push(...(recRoles as string[]));
    });
  }

  return Array.from(new Set(roles));
}
