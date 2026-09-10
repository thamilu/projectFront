import type { Session } from 'next-auth';
import { DEFAULT_INITIAL, ROLE_LABELS } from './profileHeader.constants';

export interface ProfileDisplayData {
  readonly userName: string;
  readonly userEmail: string | undefined;
  readonly avatarUrl: string | undefined;
  readonly initial: string;
  readonly roleLabel: string;
}

/**
 * Derives displayable user and role information from the session and profile status.
 * Standardizes default fallbacks and ensures safe null/undefined/empty-string handling.
 *
 * @param session - NextAuth session object
 * @param hasSellerProfile - Boolean indicating seller status
 * @returns Object containing derived display strings and values
 */
export function deriveProfileDisplayData(
  session: Session,
  hasSellerProfile: boolean
): ProfileDisplayData {
  // `||` (not `??`) so an empty-string name also falls back — some providers
  // return '' rather than omitting the field.
  const userName = session.user?.name || 'User';

  // Set to undefined if empty, null, or undefined to prevent broken mailto: links
  const userEmail = session.user?.email || undefined;

  // Convert null/empty -> undefined so AvatarImage skips rendering (src={null} triggers warning/bad request)
  const avatarUrl = session.user?.image || undefined;

  // Trim (a whitespace-only name shouldn't produce a blank avatar initial) and
  // spread into code points (not [0], which indexes UTF-16 code units and can
  // split a surrogate pair for names starting with an emoji/astral character).
  const initial = [...userName.trim()][0]?.toUpperCase() ?? DEFAULT_INITIAL;
  const roleLabel = hasSellerProfile ? ROLE_LABELS.SELLER : ROLE_LABELS.CUSTOMER;

  return { userName, userEmail, avatarUrl, initial, roleLabel };
}
