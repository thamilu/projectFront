/**
 * @module profile-normalizer
 * @description Normalizer and transformer for backend API payloads to frontend schema values.
 */

import type { ProfileValues } from '@/shared/schemas/user.schema';
import { LANGUAGES } from '@/shared/constants';
import { DEFAULT_COUNTRY, PROFILE_DEFAULTS } from '../utils/profile.constants';

export interface SessionUser {
  readonly id?: string;
  readonly name?: string | null;
  readonly email?: string | null;
  readonly firstName?: string;
  readonly lastName?: string;
}

const SPLIT_WHITESPACE_REGEX = /\s+/;

/**
 * Backend field-name aliases — a field the API may return under more than
 * one name across endpoints/versions (e.g. `personalMobileNumber` on some
 * legacy responses vs. `phone` on the current contract).
 */
const FIELD_ALIASES: Partial<Record<string & keyof ProfileValues, readonly string[]>> = {
  phone: ['phone', 'personalMobileNumber'],
};

function getFieldAliases(field: string & keyof ProfileValues): readonly string[] {
  return FIELD_ALIASES[field] ?? [field];
}

export const asString = (value: unknown): string => (typeof value === 'string' ? value : '');

export function normalizeGender(value: unknown): string {
  const str = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (!str) return '';
  if (str === 'male' || str === 'm') return 'MALE';
  if (str === 'female' || str === 'f') return 'FEMALE';
  if (str === 'non_binary' || str === 'non-binary' || str === 'nb') return 'NON_BINARY';
  if (str === 'prefer_not_to_say' || str === 'prefer not to say' || str === 'x')
    return 'PREFER_NOT_TO_SAY';
  return '';
}

export function resolveField(
  data: Record<string, unknown>,
  field: string & keyof ProfileValues,
  aliases: readonly string[] = getFieldAliases(field)
): string {
  for (const alias of aliases) {
    const value = asString(data[alias]);
    if (value) return value;
  }
  return '';
}

export function parseDisplayName(fullName?: string | null): {
  firstName: string;
  lastName: string;
} {
  const [firstName = '', ...rest] = (fullName ?? '').trim().split(SPLIT_WHITESPACE_REGEX);
  return { firstName, lastName: rest.join(' ') };
}

export function buildBaseProfile(user?: SessionUser): ProfileValues {
  const { firstName: parsedFirst, lastName: parsedLast } = parseDisplayName(user?.name);
  const firstName = user?.firstName || parsedFirst;
  const lastName = user?.lastName || parsedLast;

  return {
    ...PROFILE_DEFAULTS,
    firstName,
    lastName,
    email: user?.email ?? '',
    preferredLanguage: LANGUAGES[0]?.code ?? '',
    country: DEFAULT_COUNTRY,
  } satisfies ProfileValues;
}

export interface AccountMeta {
  /** ISO date string from the backend UserResponse. Undefined if the fetch hasn't resolved yet. */
  readonly createdAt?: string;
  /** From the backend UserResponse — the session itself never carries this (verified against lib/auth/handlers.ts's buildSessionUser). */
  readonly emailVerified?: boolean;
  /**
   * Raw seller approval status (PENDING/ACTIVE/REJECTED/SUSPENDED/...),
   * present only when the fetched profile is a seller profile — a plain
   * UserResponse has no `status` field at all (confirmed against the
   * generated OpenAPI types). A seller record existing is not the same
   * as it being KYC-approved; this is what actually distinguishes them.
   */
  readonly sellerStatus?: string;
}

/**
 * Extracts account-metadata fields that exist on the raw backend response
 * but aren't part of the editable ProfileValues form schema, so they'd
 * otherwise be silently dropped by normalizeProfileData.
 */
export function extractAccountMeta(data: Record<string, unknown>): AccountMeta {
  return {
    createdAt: typeof data.createdAt === 'string' ? data.createdAt : undefined,
    emailVerified: typeof data.emailVerified === 'boolean' ? data.emailVerified : undefined,
    sellerStatus: typeof data.status === 'string' ? data.status : undefined,
  };
}

export function normalizeProfileData(
  data: Record<string, unknown>,
  user?: SessionUser
): ProfileValues {
  const base = buildBaseProfile(user);

  return {
    ...base,
    firstName: asString(data.firstName) || base.firstName,
    lastName: asString(data.lastName) || base.lastName,
    email: asString(data.email) || base.email,
    phone: resolveField(data, 'phone'),
    alternatePhone: asString(data.alternatePhone),
    preferredLanguage: asString(data.preferredLanguage) || base.preferredLanguage,
    timezone: asString(data.timezone),
    currency: asString(data.currency),
    locale: asString(data.locale),
    gender: normalizeGender(data.gender),
    dateOfBirth: asString(data.dateOfBirth),
    addressLine1: asString(data.addressLine1),
    addressLine2: asString(data.addressLine2),
    city: asString(data.city),
    district: asString(data.district),
    taluk: asString(data.taluk),
    state: asString(data.state),
    pincode: asString(data.pincode),
    country: asString(data.country) || base.country,
  } satisfies ProfileValues;
}
