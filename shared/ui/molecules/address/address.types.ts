'use client';

import type { UseFormSetValue } from 'react-hook-form';

// ─── Field Name Constants ─────────────────────────────────────────────────────

/**
 * Address field base names (without prefix).
 * Used by `useFieldNames` to derive prefixed field keys.
 */
export const ADDRESS_FIELD_BASES = [
  'addressLine1',
  'addressLine2',
  'city',
  'state',
  'district',
  'taluk',
  'pincode',
  'country',
] as const;

export type AddressFieldBase = (typeof ADDRESS_FIELD_BASES)[number];

// ─── Field Names Record ───────────────────────────────────────────────────────

/**
 * Resolved field names after applying the optional prefix.
 * Maps each base field to its runtime form field key.
 *
 * @example
 * // No prefix  → { city: 'city', state: 'state', ... }
 * // Prefix "store" → { city: 'storeCity', state: 'storeState', ... }
 */
export type AddressFieldNames = Record<AddressFieldBase, string>;

// ─── Component Props ──────────────────────────────────────────────────────────

/**
 * Props for the top-level `AddressFields` orchestrator.
 */
export interface AddressFieldsProps {
  /** Optional prefix applied to all field names (e.g. "store" → "storeCity"). */
  namePrefix?: string;
  /** Section title displayed above the address fields. */
  title?: string;
  /** Section description displayed below the title. */
  description?: string;
  /** Whether to show the section header (title + description). */
  showTitle?: boolean;
  /** Disables all address fields when `true`. */
  disabled?: boolean;
  /** Sets text input fields as read-only (remains focusable for AT/keyboard users). */
  readOnly?: boolean;
}

// ─── Callback Types ───────────────────────────────────────────────────────────

/**
 * Typed wrapper for `react-hook-form`'s `setValue`.
 * Used across all sub-components to set form values with options.
 */
export type SetValueFn = UseFormSetValue<Record<string, string>>;

/**
 * Returns the error message string for a given field name, or `undefined`.
 */
export type GetErrorFn = (name: string) => string | undefined;

// ─── Shared Style Tokens ──────────────────────────────────────────────────────

/**
 * Consistent CSS class tokens reused across all address sub-components.
 * Centralised here to eliminate scattered duplicate strings.
 */
export const ADDRESS_STYLES = {
  input:
    'h-12 bg-background/50 border-muted-foreground/20 focus:border-primary transition-all shadow-sm',
  label: 'text-sm font-medium text-slate-800 dark:text-slate-200 ml-1',
  error: 'text-[10px] text-destructive font-medium ml-1 uppercase',
  fieldGroup: 'space-y-1.5',
} as const;
