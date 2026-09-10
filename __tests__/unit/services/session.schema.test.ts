// ============================================================
// __tests__/unit/services/session.schema.test.ts
// Tests for the runtime validation schema guarding authService's
// getNormalizedSession() session-fetch boundary.
// ============================================================

import { RawSessionSchema } from '@/domains/auth/services/session.schema';

function buildRawUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    name: 'Alice',
    email: 'alice@example.com',
    image: 'https://lh3.googleusercontent.com/avatar.jpg',
    firstName: 'Alice',
    lastName: 'Example',
    ...overrides,
  };
}

describe('RawSessionSchema', () => {
  describe('valid sessions', () => {
    it('accepts a complete, valid session', () => {
      const result = RawSessionSchema.safeParse({
        user: buildRawUser(),
        roles: ['SELLER'],
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
        expires: new Date(Date.now() + 3600_000).toISOString(),
      });
      expect(result.success).toBe(true);
    });

    it('defaults roles to [] when omitted', () => {
      const result = RawSessionSchema.safeParse({ user: buildRawUser() });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.roles).toEqual([]);
      }
    });

    it('accepts a session without a user object', () => {
      const result = RawSessionSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('accepts a user missing firstName/lastName/email — identityHealAttempted case', () => {
      // shared/types/next-auth.d.ts documents real sessions whose claims
      // permanently lack these fields; the schema must not reject them.
      const result = RawSessionSchema.safeParse({
        user: { id: 'user-1' },
      });
      expect(result.success).toBe(true);
    });
  });

  describe('user.id — required', () => {
    it('rejects a missing id', () => {
      const result = RawSessionSchema.safeParse({
        user: { name: 'Alice', email: 'alice@example.com' },
      });
      expect(result.success).toBe(false);
    });

    it('rejects an empty string id', () => {
      const result = RawSessionSchema.safeParse({ user: buildRawUser({ id: '' }) });
      expect(result.success).toBe(false);
    });
  });

  describe('email', () => {
    it('rejects a malformed email', () => {
      const result = RawSessionSchema.safeParse({
        user: buildRawUser({ email: 'not-an-email' }),
      });
      expect(result.success).toBe(false);
    });

    it('normalizes an empty string email to null', () => {
      const result = RawSessionSchema.safeParse({ user: buildRawUser({ email: '' }) });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.user?.email).toBeNull();
      }
    });

    it('accepts a null email', () => {
      const result = RawSessionSchema.safeParse({ user: buildRawUser({ email: null }) });
      expect(result.success).toBe(true);
    });
  });

  describe('image — protocol restriction', () => {
    it('accepts a valid https avatar URL', () => {
      const result = RawSessionSchema.safeParse({
        user: buildRawUser({ image: 'https://res.cloudinary.com/avatar.png' }),
      });
      expect(result.success).toBe(true);
    });

    it('rejects a javascript: URL', () => {
      const result = RawSessionSchema.safeParse({
        user: buildRawUser({ image: 'javascript:alert(1)' }),
      });
      expect(result.success).toBe(false);
    });

    it('rejects a data: URL', () => {
      const result = RawSessionSchema.safeParse({
        user: buildRawUser({ image: 'data:text/html,<script>alert(1)</script>' }),
      });
      expect(result.success).toBe(false);
    });

    it('normalizes an empty string image to null', () => {
      const result = RawSessionSchema.safeParse({ user: buildRawUser({ image: '' }) });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.user?.image).toBeNull();
      }
    });
  });

  describe('roles — deliberately not enum-restricted', () => {
    // mapUserRole() (features/auth/utils/role-mapper.ts) is the real
    // allowlist boundary, applied one layer downstream in auth-service.ts —
    // it filters unrecognized strings out before they ever reach
    // NormalizedSession.roles: UserRole[], which is the only thing
    // checkPermissions/checkAllPermissions/checkDeniedPermissions accept
    // (typed UserRole[], not string[]). This schema must stay permissive
    // here or every session carrying one of Keycloak's own standard realm
    // roles (offline_access, uma_authorization, default-roles-<realm>,
    // etc.) alongside application roles would fail validation entirely.
    it('accepts arbitrary role strings, including non-application Keycloak roles', () => {
      const result = RawSessionSchema.safeParse({
        user: buildRawUser(),
        roles: ['SELLER', 'offline_access', 'uma_authorization', 'default-roles-eshop'],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.roles).toEqual([
          'SELLER',
          'offline_access',
          'uma_authorization',
          'default-roles-eshop',
        ]);
      }
    });
  });

  describe('expiresAt / expires — deliberately independent, not cross-validated', () => {
    // expiresAt tracks the Keycloak access token's (short) expiry;
    // expires tracks the NextAuth session cookie's (much longer) expiry —
    // see lib/auth/index.ts's session()/jwt() callbacks. They are expected
    // to diverge significantly; that is not a sign of tampering.
    it('accepts widely-diverging expiresAt and expires values', () => {
      const result = RawSessionSchema.safeParse({
        user: buildRawUser(),
        expiresAt: Math.floor(Date.now() / 1000) + 300, // 5 min (access token)
        expires: new Date(Date.now() + 30 * 24 * 3600_000).toISOString(), // 30 days (session cookie)
      });
      expect(result.success).toBe(true);
    });

    // NormalizedSession.isExpired/isExpiringSoon exist specifically so a
    // structurally-valid-but-expired session can still be returned and the
    // caller decides what to do — the schema must not reject it outright.
    it('accepts an already-expired expiresAt', () => {
      const result = RawSessionSchema.safeParse({
        user: buildRawUser(),
        expiresAt: 1,
      });
      expect(result.success).toBe(true);
    });

    it('rejects a non-ISO-8601 expires string', () => {
      const result = RawSessionSchema.safeParse({
        user: buildRawUser(),
        expires: 'tomorrow',
      });
      expect(result.success).toBe(false);
    });

    it('accepts a valid ISO-8601 expires string', () => {
      const result = RawSessionSchema.safeParse({
        user: buildRawUser(),
        expires: '2099-01-01T00:00:00.000Z',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('malformed top-level payloads', () => {
    it.each([null, undefined, 'a string', 42, [], true])('rejects %p', (value) => {
      expect(RawSessionSchema.safeParse(value).success).toBe(false);
    });
  });
});
