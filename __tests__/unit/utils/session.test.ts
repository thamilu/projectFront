import { extractRoles } from '@/shared/utils/session';
import type { Session } from 'next-auth';

const baseSession = {
  user: { email: 'user@example.com' },
  expires: '2099-01-01T00:00:00.000Z',
} as unknown as Session;

describe('extractRoles', () => {
  it('returns an empty array for a null session', () => {
    expect(extractRoles(null)).toEqual([]);
  });

  it('returns an empty array when the session has no roles property', () => {
    expect(extractRoles(baseSession)).toEqual([]);
  });

  it('returns an empty array when roles is not an array', () => {
    const session = { ...baseSession, roles: 'CUSTOMER' } as unknown as Session;
    expect(extractRoles(session)).toEqual([]);
  });

  it('returns the roles array when valid', () => {
    const session = { ...baseSession, roles: ['CUSTOMER', 'SELLER'] } as unknown as Session;
    expect(extractRoles(session)).toEqual(['CUSTOMER', 'SELLER']);
  });

  it('filters out non-string and empty/whitespace-only role entries', () => {
    const session = {
      ...baseSession,
      roles: ['CUSTOMER', '', '   ', 42, null, undefined, 'SELLER'],
    } as unknown as Session;
    expect(extractRoles(session)).toEqual(['CUSTOMER', 'SELLER']);
  });

  it('trims surrounding whitespace validation but preserves original casing', () => {
    const session = { ...baseSession, roles: ['Admin', 'MODERATOR'] } as unknown as Session;
    expect(extractRoles(session)).toEqual(['Admin', 'MODERATOR']);
  });

  it('returns a frozen array that cannot be mutated', () => {
    const session = { ...baseSession, roles: ['CUSTOMER'] } as unknown as Session;
    const roles = extractRoles(session);
    expect(Object.isFrozen(roles)).toBe(true);
    expect(() => {
      (roles as string[]).push('HACKED');
    }).toThrow();
  });

  it('returns an empty, frozen array for an empty roles array', () => {
    const session = { ...baseSession, roles: [] } as unknown as Session;
    const roles = extractRoles(session);
    expect(roles).toEqual([]);
    expect(Object.isFrozen(roles)).toBe(true);
  });
});
