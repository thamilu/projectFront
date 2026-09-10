import { User, Mail, Phone, Globe } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { SellerOnboardingValues } from '@/domains/seller/contracts/seller.schema';

// ─── Field Configuration ──────────────────────────────────────────────────────

interface FieldConfig {
  label: string;
  icon: LucideIcon;
  autoComplete?: string;
}

export const PERSONAL_INFO_FIELD_CONFIG = {
  firstName: {
    label: 'First Name',
    icon: User,
    autoComplete: 'given-name',
  },
  lastName: {
    label: 'Last Name',
    icon: User,
    autoComplete: 'family-name',
  },
  email: {
    label: 'Email Address',
    icon: Mail,
    autoComplete: 'email',
  },
  phone: {
    label: 'Phone Number',
    icon: Phone,
    autoComplete: 'tel',
  },
  alternatePhone: {
    label: 'Alternate Phone',
    icon: Phone,
    autoComplete: 'tel',
  },
  preferredLanguage: {
    label: 'Preferred Language',
    icon: Globe,
  },
} as const satisfies Record<string, FieldConfig>;

// ─── Select Options ───────────────────────────────────────────────────────────

export const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'NON_BINARY', label: 'Non-Binary' },
  { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
] as const;

export const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi (हिन्दी)' },
  { value: 'ta', label: 'Tamil (தமிழ்)' },
  { value: 'te', label: 'Telugu (తెలుగు)' },
  { value: 'bn', label: 'Bengali (বাংলা)' },
  { value: 'mr', label: 'Marathi (मराठी)' },
  { value: 'gu', label: 'Gujarati (ગુજરાતી)' },
] as const;

// ─── Validation Field Lists ───────────────────────────────────────────────────

/**
 * All personal info fields in the step (including read-only).
 */
export const PERSONAL_INFO_FIELDS = [
  'firstName',
  'lastName',
  'email',
  'phone',
  'gender',
  'dateOfBirth',
  'alternatePhone',
  'preferredLanguage',
] as const satisfies ReadonlyArray<keyof SellerOnboardingValues>;

/**
 * Editable personal info fields (excludes email which is always locked).
 */
export const PERSONAL_INFO_EDITABLE_FIELDS = PERSONAL_INFO_FIELDS.filter(
  (field) => field !== 'email'
);
