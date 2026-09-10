// ============================================================
// features/auth/services/session.schema.ts
// Zod runtime validation schema for NextAuth session structure.
// Protects domain from malformed or tampered session payloads.
// ============================================================

import { z } from 'zod';

// ─── User Schema ─────────────────────────────────────────────

const SessionUserSchema = z.object({
  name: z.string().optional().nullable(),
  // Empty string is collapsed to null so "absent" has exactly one
  // representation downstream (undefined | null | valid-email), not two
  // (empty string and null meaning the same thing but compared differently).
  email: z
    .string()
    .email('Invalid session email format')
    .or(z.literal(''))
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),
  // Restricted to http/https so a javascript:/data: URL can never pass
  // validation here — defense-in-depth for any future consumer that
  // renders this as an <img>/<Image> src without its own check. Every
  // current render site (e.g. features/seller/components/layout/user-nav.tsx's
  // <AvatarImage>) reads session.user.image straight from next-auth's own
  // useSession() and never passes through this schema at all — those apply
  // shared/utils/avatar.ts's isValidAvatarUrl() directly instead, which is
  // the actual fix for that path.
  image: z
    .string()
    .url('Invalid session image URL')
    .refine(
      (url) => {
        try {
          return ['http:', 'https:'].includes(new URL(url).protocol);
        } catch {
          return false;
        }
      },
      { message: 'Session image URL must use http or https protocol' }
    )
    .or(z.literal(''))
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),
  // Required, non-empty: shared/types/next-auth.d.ts declares Session['user'].id
  // as a required `string` app-wide — a session missing it is genuinely
  // corrupt, not just incomplete, so it must fail validation here rather
  // than let the mapping layer paper over it with a silent '' fallback.
  // firstName/lastName/email deliberately stay optional below: the JWT
  // callback's identityHealAttempted mechanism (see next-auth.d.ts) already
  // documents real, valid sessions whose claims permanently lack those
  // fields — requiring them here would reject otherwise-healthy sessions.
  id: z.string().min(1, 'Session user id must not be empty'),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
});

// ─── Raw Session Schema ───────────────────────────────────────

/**
 * Validates the raw NextAuth session object before normalization.
 * Coerces missing optional fields to safe defaults.
 *
 * If NextAuth session shape changes (library upgrade, config drift),
 * this schema will catch it at runtime before it reaches domain logic.
 *
 * `roles` deliberately stays `z.array(z.string())` — NOT restricted to a
 * fixed enum. Keycloak's roles claim legitimately includes realm/system
 * roles (e.g. offline_access, uma_authorization, default-roles-<realm>)
 * alongside application roles; mapUserRole() (see ../utils/role-mapper.ts)
 * already filters unrecognized strings out when building the domain-safe
 * NormalizedSession.roles: UserRole[], and every real authorization check
 * (checkPermissions/checkAllPermissions/checkDeniedPermissions) is typed
 * to accept only UserRole[], never a raw string — so the allowlisting this
 * schema might otherwise seem to be missing already happens correctly one
 * layer downstream. Enumerating roles here instead would make the entire
 * session fail validation (and the user appear logged out) any time
 * Keycloak includes one of its own standard non-application roles.
 *
 * `expiresAt` and `expires` are NOT cross-validated against each other —
 * they are two deliberately different, independently-managed values (see
 * lib/auth/index.ts's session()/jwt() callbacks): `expiresAt` tracks the
 * Keycloak access token's (short) expiry, `expires` tracks the NextAuth
 * session cookie's (much longer) expiry. Divergence between them is
 * expected, not a sign of tampering. Sessions are also not rejected here
 * for already being expired — NormalizedSession.isExpired/isExpiringSoon
 * exist specifically so a structurally-valid-but-expired session can still
 * be returned and the caller can decide what to do (e.g. show a
 * "session expired" prompt) rather than this schema silently making it
 * indistinguishable from "no session at all".
 */
export const RawSessionSchema = z.object({
  user: SessionUserSchema.optional(),
  roles: z.array(z.string()).default([]),
  expiresAt: z.number().positive().optional(),
  // NextAuth always produces a well-formed ISO string here internally
  // (never user/attacker input) — format-validated anyway so a future
  // NextAuth version producing an unexpected shape is caught here rather
  // than silently passing through unused (this field isn't currently read
  // by the mapping layer, only expiresAt is).
  expires: z.string().datetime({ message: 'expires must be a valid ISO 8601 datetime' }).optional(),
});

// ─── Inferred Types ───────────────────────────────────────────

/** Inferred TypeScript type from the Zod schema */
export type RawSession = z.infer<typeof RawSessionSchema>;

/** Inferred TypeScript type for the session user */
export type RawSessionUser = z.infer<typeof SessionUserSchema>;
