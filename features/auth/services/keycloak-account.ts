// ============================================================
// features/auth/services/keycloak-account.ts
// Links into Keycloak's own hosted Account Console — the real,
// already-deployed self-service UI Keycloak ships for exactly the account
// actions this app doesn't (and shouldn't) reimplement against a guessed
// backend contract: active-session listing/revocation, and (as an
// alternative entry point to the existing kc_action-based flow) credential
// management.
//
// Why this exists: features/auth/services/session.schema.ts and this app's
// NormalizedSession model deliberately do NOT track a user's OTHER active
// sessions — NextAuth only ever sees the current browser's session, and no
// backend endpoint for listing/revoking a user's other sessions exists in
// shared/constants/api/endpoints.ts (confirmed by search — there is none).
// Building a custom "Active Sessions" UI against that non-existent contract
// would mean either fabricating session data (the bug this file replaces —
// see app/(customer)/account/security/page.tsx's former MOCK_SESSIONS) or
// shipping permanently-disabled buttons (see SecuritySection.tsx's former
// ComingSoonNotice-gated version). Keycloak already solves this problem
// server-side for every application on the realm; this app should link to
// it, not duplicate it.
// ============================================================

import { env } from '@/env';

/**
 * Sections of Keycloak's Account Console this app links to directly,
 * mapped to the modern (Keycloak 19+) Account Console v3's hash-routed
 * paths. Keycloak has shipped this UI as the default Account Console for
 * long enough that this is the safe default; a realm still running the
 * legacy ("Reference") Account Console theme redirects the hash fragment
 * to its own equivalent page rather than 404ing, since hash fragments are
 * client-side-only and Keycloak's account app still loads regardless.
 */
const ACCOUNT_CONSOLE_SECTIONS = {
  /** Device/browser session list with "Sign out" per device and "Sign out all sessions". */
  sessions: '#/account-security/signing-in',
  /** Password + account credential management (alternative entry point to the kc_action redirect this app already uses elsewhere). */
  credentials: '#/security/signing-in',
} as const;

export type AccountConsoleSection = keyof typeof ACCOUNT_CONSOLE_SECTIONS;

/**
 * Builds a URL into this realm's Keycloak Account Console.
 *
 * @param section - Which Account Console page to deep-link to. Omit for
 *   the Account Console's own root/dashboard.
 *
 * @example
 * <a href={getKeycloakAccountUrl('sessions')} target="_blank" rel="noopener noreferrer">
 *   Manage active sessions
 * </a>
 */
export function getKeycloakAccountUrl(section?: AccountConsoleSection): string {
  const base = `${env.NEXT_PUBLIC_KEYCLOAK_URL}/realms/${env.NEXT_PUBLIC_KEYCLOAK_REALM}/account/`;
  return section ? `${base}${ACCOUNT_CONSOLE_SECTIONS[section]}` : base;
}
