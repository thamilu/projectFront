import { isAppSession, hasRole, extractCustomerData } from '@/types/auth';

describe('Auth Utilities', () => {
  describe('isAppSession', () => {
    it('returns true for a valid session with roles and user object', () => {
      const validSession = {
        user: {
          id: 'user-123',
          email: 'customer@eshop.com',
          name: 'Jane Doe',
        },
        roles: ['CUSTOMER'],
        expires: '2026-05-30T00:00:00Z',
      };
      expect(isAppSession(validSession)).toBe(true);
    });

    it('returns false for null or undefined', () => {
      expect(isAppSession(null)).toBe(false);
      expect(isAppSession(undefined)).toBe(false);
    });

    it('returns false when roles is missing or not an array', () => {
      const invalidSession = {
        user: { id: '123', email: 'test@test.com' },
        expires: '123',
      };
      expect(isAppSession(invalidSession)).toBe(false);

      const invalidRolesSession = {
        user: { id: '123', email: 'test@test.com' },
        roles: 'not-an-array',
        expires: '123',
      };
      expect(isAppSession(invalidRolesSession)).toBe(false);
    });

    it('returns false when user is missing or not an object', () => {
      const invalidSession = {
        roles: ['CUSTOMER'],
        expires: '123',
      };
      expect(isAppSession(invalidSession)).toBe(false);

      const invalidUserSession = {
        user: 'not-an-object',
        roles: ['CUSTOMER'],
        expires: '123',
      };
      expect(isAppSession(invalidUserSession)).toBe(false);
    });
  });

  describe('hasRole', () => {
    const session = {
      user: { id: '123', email: 'test@test.com' },
      roles: ['CUSTOMER', 'SELLER'],
      expires: '123',
    };

    it('returns true if the session contains the role', () => {
      expect(hasRole(session, 'CUSTOMER')).toBe(true);
      expect(hasRole(session, 'SELLER')).toBe(true);
    });

    it('returns false if the session does not contain the role', () => {
      expect(hasRole(session, 'ADMIN')).toBe(false);
    });

    it('returns false if the session is invalid', () => {
      expect(hasRole(null, 'CUSTOMER')).toBe(false);
    });
  });

  describe('extractCustomerData', () => {
    it('extracts userId and userName from a valid session', () => {
      const session = {
        user: { id: 'user-abc', email: 'customer@eshop.com', name: 'John Smith' },
        roles: ['CUSTOMER'],
        expires: '123',
      };
      expect(extractCustomerData(session)).toEqual({
        userId: 'user-abc',
        userName: 'John Smith',
      });
    });

    it('uses a fallback name if name is missing', () => {
      const session = {
        user: { id: 'user-abc', email: 'customer@eshop.com' },
        roles: ['CUSTOMER'],
        expires: '123',
      };
      expect(extractCustomerData(session)).toEqual({
        userId: 'user-abc',
        userName: 'Customer',
      });
    });

    it('returns null for an invalid session', () => {
      expect(extractCustomerData(null)).toBeNull();
    });
  });
});
