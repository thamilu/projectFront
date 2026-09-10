/**
 * profile.constants.ts
 *
 * Configuration and defaults for user profile management.
 * Single source of truth for profile-related constants.
 */

import type { LucideIcon } from 'lucide-react';
import { User, MapPin } from 'lucide-react';
import type { ProfileValues } from '@/shared/schemas/user.schema';

// ─── Enums ────────────────────────────────────────────────────────────────────

/**
 * Available profile tabs
 * Strictly focused on Profile and Address management.
 * (Security & Authentication is exclusively owned by /settings#security).
 */
export const PROFILE_TABS = {
  PERSONAL: 'personal',
  ADDRESS: 'address',
} as const;

export type ProfileTab = (typeof PROFILE_TABS)[keyof typeof PROFILE_TABS];

/**
 * User roles for the storefront/seller portal (excluding ADMIN)
 */
export const ROLES = {
  CUSTOMER: 'CUSTOMER',
  SELLER: 'SELLER',
  DELIVERY_AGENT: 'DELIVERY_AGENT',
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

/**
 * Gender options matching the backend Gender.java enum constants
 */
export const GENDERS = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
  NON_BINARY: 'NON_BINARY',
  PREFER_NOT_TO_SAY: 'PREFER_NOT_TO_SAY',
} as const;

export type Gender = (typeof GENDERS)[keyof typeof GENDERS];

// ─── Configuration ────────────────────────────────────────────────────────────

/**
 * Authentication provider
 */
export const AUTH_PROVIDER = 'keycloak' as const;

/**
 * Default country for address
 */
export const DEFAULT_COUNTRY = 'India' as const;

/**
 * Domain-driven profile policy configuration.
 * MAX_NAME_LENGTH is the single source of truth consumed by
 * domains/customer/domain/user.schema.ts's firstName/lastName validators —
 * previously the schema hardcoded its own literal `100` independently of
 * this constant, so the two could silently drift apart (the same class of
 * bug ALLOWED_PAYLOAD_KEYS in useProfileSubmit.ts was fixed for).
 */
export const PROFILE_CONFIG = {
  MAX_NAME_LENGTH: 100,
  PHONE_OTP_COUNTDOWN_SECONDS: 60,
} as const;

// ─── Tab Configuration ────────────────────────────────────────────────────────

/**
 * Tab metadata for UI rendering
 * Type-safe configuration with icon support
 */
interface TabConfig {
  readonly value: ProfileTab;
  readonly label: string;
  readonly Icon: LucideIcon;
}

export const TAB_CONFIG = [
  {
    value: PROFILE_TABS.PERSONAL,
    label: 'Personal Information',
    Icon: User,
  },
  {
    value: PROFILE_TABS.ADDRESS,
    label: 'Addresses',
    Icon: MapPin,
  },
] as const satisfies readonly TabConfig[];

/**
 * Tab order derived from TAB_CONFIG
 * ✅ Single source of truth
 */
export const TAB_ORDER: readonly ProfileTab[] = TAB_CONFIG.map((tab) => tab.value);

/**
 * Tab index map for O(1) lookup
 */
const TAB_INDEX_MAP: ReadonlyMap<ProfileTab, number> = new Map(
  TAB_ORDER.map((tab, index) => [tab, index])
);

// ─── Select Options ───────────────────────────────────────────────────────────

/**
 * Gender select options
 * Derived from GENDERS enum for type safety
 */
export const GENDER_OPTIONS: readonly { value: Gender; label: string }[] = [
  { value: GENDERS.MALE, label: 'Male' },
  { value: GENDERS.FEMALE, label: 'Female' },
  { value: GENDERS.NON_BINARY, label: 'Non-Binary' },
  { value: GENDERS.PREFER_NOT_TO_SAY, label: 'Prefer Not to Say' },
] as const;

/**
 * Extract gender values for schema validation
 * ✅ Single source of truth for Zod enum
 */
export const GENDER_VALUES = Object.values(GENDERS);

// ─── Preference Dropdown Constants ───────────────────────────────────────────

export const TIMEZONES = [
  { value: 'America/New_York', label: '(UTC-05:00) Eastern Time (US & Canada)' },
  { value: 'Europe/London', label: '(UTC+00:00) Greenwich Mean Time (London)' },
  { value: 'Europe/Paris', label: '(UTC+01:00) Central European Time (Paris)' },
  { value: 'Asia/Kolkata', label: '(UTC+05:30) Indian Standard Time (New Delhi)' },
  { value: 'Asia/Singapore', label: '(UTC+08:00) Singapore Standard Time' },
  { value: 'Asia/Tokyo', label: '(UTC+09:00) Japan Standard Time (Tokyo)' },
] as const;

export const CURRENCIES = [
  { value: 'USD', label: 'USD ($) - US Dollar' },
  { value: 'EUR', label: 'EUR (€) - Euro' },
  { value: 'GBP', label: 'GBP (£) - British Pound' },
  { value: 'INR', label: 'INR (₹) - Indian Rupee' },
  { value: 'JPY', label: 'JPY (¥) - Japanese Yen' },
] as const;

export const LOCALES = [
  { value: 'en-US', label: 'en-US (United States)' },
  { value: 'en-GB', label: 'en-GB (United Kingdom)' },
  { value: 'en-IN', label: 'en-IN (India)' },
  { value: 'fr-FR', label: 'fr-FR (France)' },
  { value: 'de-DE', label: 'de-DE (Germany)' },
  { value: 'ja-JP', label: 'ja-JP (Japan)' },
] as const;

// ─── Form Defaults ────────────────────────────────────────────────────────────

/**
 * Default values for profile form
 * Matches ProfileValues schema shape
 *
 * @remarks
 * If this type-checks, it means defaults match schema
 * Compile-time validation prevents mismatches
 */
export const PROFILE_DEFAULTS: Readonly<ProfileValues> = Object.freeze({
  // Personal Information
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  alternatePhone: '',
  preferredLanguage: '',
  timezone: '',
  currency: '',
  locale: '',
  gender: '',
  dateOfBirth: '',

  // Address Information
  addressLine1: '',
  addressLine2: '',
  city: '',
  district: '',
  state: '',
  pincode: '',
  country: DEFAULT_COUNTRY,
  taluk: '',
});

// ─── Validation Helpers ───────────────────────────────────────────────────────

/**
 * Check if a value is a valid profile tab
 * @param value - Value to check
 * @returns Type predicate for ProfileTab
 */
export function isProfileTab(value: string): value is ProfileTab {
  return TAB_CONFIG.some((tab) => tab.value === value);
}

/**
 * Get tab index for navigation
 * @param tab - Current tab
 * @returns Index in TAB_ORDER (0-based)
 */
export function getTabIndex(tab: ProfileTab): number {
  return TAB_INDEX_MAP.get(tab) ?? -1;
}

/**
 * Get next tab in sequence
 * @param currentTab - Current tab
 * @returns Next tab or undefined if at end
 */
export function getNextTab(currentTab: ProfileTab): ProfileTab | undefined {
  const currentIndex = getTabIndex(currentTab);
  return TAB_ORDER[currentIndex + 1];
}

/**
 * Get previous tab in sequence
 * @param currentTab - Current tab
 * @returns Previous tab or undefined if at start
 */
export function getPreviousTab(currentTab: ProfileTab): ProfileTab | undefined {
  const currentIndex = getTabIndex(currentTab);
  return currentIndex > 0 ? TAB_ORDER[currentIndex - 1] : undefined;
}

/**
 * Check if tab is first in sequence
 * @param tab - Tab to check
 * @returns True if first tab
 */
export function isFirstTab(tab: ProfileTab): boolean {
  return getTabIndex(tab) === 0;
}

/**
 * Check if tab is last in sequence
 * @param tab - Tab to check
 * @returns True if last tab
 */
export function isLastTab(tab: ProfileTab): boolean {
  return getTabIndex(tab) === TAB_ORDER.length - 1;
}

/**
 * Get the human-readable label for a tab (as shown in TAB_CONFIG).
 * Used to build specific action-button text like "Continue to Address"
 * instead of a generic "Next Step" that doesn't say where it goes.
 * @param tab - Tab to look up
 * @returns The tab's display label
 */
export function getTabLabel(tab: ProfileTab): string {
  return TAB_CONFIG.find((config) => config.value === tab)?.label ?? tab;
}
