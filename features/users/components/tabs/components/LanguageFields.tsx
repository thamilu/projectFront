/**
 * LanguageFields.tsx
 *
 * Alternate Phone and Preferred Language input fields.
 * Part of the modular profile form system.
 *
 * Design Decisions:
 * - Alternate phone is optional (backup contact method)
 * - Preferred language affects UI localization and email preferences
 * - Uses react-hook-form Controller for Select to ensure proper integration
 * - Fully accessible with WCAG 2.1 AA compliance
 * - Memoized to prevent parent re-renders
 *
 * Technical Constraints:
 * - Must be used inside react-hook-form <FormProvider>
 * - Languages must be loaded before mounting (from @/shared/constants)
 * - Requires ProfileValues schema for type safety
 *
 * Error Handling:
 * - Component errors caught by parent ErrorBoundary
 * - Form validation errors displayed inline
 * - No try-catch needed (pure render function)
 *
 * @throws Never - All errors propagate to ErrorBoundary
 *
 * @example
 * ```tsx
 * <FormProvider {...methods}>
 *   <LanguageFields
 *     disabled={!isEditing}
 *     altPhonePlaceholder="+1 555-0100"
 *   />
 * </FormProvider>
 * ```
 *
 * @see {@link ContactFields} - Similar pattern for contact information
 * @see {@link PersonalDetailsFields} - Sibling component in profile form
 */

import { memo, useCallback, useMemo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Phone, Globe, Clock, Landmark, Settings } from 'lucide-react';

import { Label } from '@/shared/ui/atoms/label';
import { FormField } from '@/shared/ui/molecules/FormField';
import { Combobox } from '@/shared/ui/atoms/combobox';
import { LANGUAGES } from '@/shared/constants';
import { TIMEZONES, CURRENCIES, LOCALES } from '../../../utils/profile.constants';
import { cn } from '@/shared/utils';
import type { ProfileValues } from '@/shared/schemas/user.schema';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const ALT_PHONE_PLACEHOLDER = '+91 98765 43210' as const;

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface LanguageFieldsProps {
  disabled?: boolean;
  altPhonePlaceholder?: string;
  className?: string;
  onLanguageChange?: (language: string) => void;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export const LanguageFields = memo(function LanguageFields({
  disabled = false,
  altPhonePlaceholder = ALT_PHONE_PLACEHOLDER,
  className,
  onLanguageChange,
}: LanguageFieldsProps) {
  const {
    register,
    formState: { errors },
    control,
  } = useFormContext<ProfileValues>();

  const handleLanguageChange = useCallback(
    (value: string) => {
      onLanguageChange?.(value);
    },
    [onLanguageChange]
  );

  const languageOptions = useMemo(() => {
    // Deliberately text-only, not `${lang.flag} ${lang.name}` — Windows
    // Chromium browsers (Chrome/Edge) have no system font that renders
    // regional-indicator flag emoji as flags; they fall back to the raw
    // two-letter glyphs, so "🇺🇸 English" renders as the confusing literal
    // text "us English" for a large share of real users, not a flag icon.
    return LANGUAGES.map((lang) => ({
      value: lang.code,
      label: lang.name,
    }));
  }, []);

  const timezoneOptions = useMemo(() => {
    return TIMEZONES.map((tz) => ({
      value: tz.value,
      label: tz.label,
    }));
  }, []);

  const currencyOptions = useMemo(() => {
    return CURRENCIES.map((cur) => ({
      value: cur.value,
      label: cur.label,
    }));
  }, []);

  const localeOptions = useMemo(() => {
    return LOCALES.map((loc) => ({
      value: loc.value,
      label: loc.label,
    }));
  }, []);

  return (
    <div
      className={cn('grid gap-6 md:grid-cols-2', className)}
      role="group"
      aria-label="Preferences and alternate contact information"
    >
      {/* Alternate Phone */}
      <FormField
        id="alternatePhone"
        label="Alternate Phone"
        registration={register('alternatePhone')}
        error={errors.alternatePhone?.message}
        disabled={disabled}
        icon={Phone}
        placeholder={altPhonePlaceholder}
        inputMode="tel"
        autoComplete="tel"
        helperText="Backup contact number used strictly for secondary account recovery alerts."
      />

      {/* Preferred Language Combobox */}
      <div className="space-y-2">
        <Label htmlFor="preferredLanguage" className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          Preferred Language
          <span className="text-slate-500 dark:text-slate-400/80 ml-2 text-xs font-normal">(Optional)</span>
        </Label>
        <Controller
          name="preferredLanguage"
          control={control}
          render={({ field }) => (
            <div className="relative">
              <Combobox
                id="preferredLanguage"
                options={languageOptions}
                value={field.value}
                onSelect={(value) => {
                  field.onChange(value);
                  handleLanguageChange(value as string);
                }}
                disabled={disabled}
                placeholder="Select Language..."
                searchPlaceholder="Search language..."
                className="h-12 border-slate-800 bg-slate-950/60 pl-10 text-left"
              />
              <Globe className="text-slate-500 absolute top-3.5 left-3.5 h-4.5 w-4.5 pointer-events-none" />
            </div>
          )}
        />
        {errors.preferredLanguage?.message && (
          <p id="preferredLanguage-error" className="text-xs text-destructive font-medium mt-1 ml-1" role="alert">
            {String(errors.preferredLanguage.message)}
          </p>
        )}
      </div>

      {/* Time Zone Combobox */}
      <div className="space-y-2">
        <Label htmlFor="timezone" className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          Time Zone
          <span className="text-slate-500 dark:text-slate-400/80 ml-2 text-xs font-normal">(Optional)</span>
        </Label>
        <Controller
          name="timezone"
          control={control}
          render={({ field }) => (
            <div className="relative">
              <Combobox
                id="timezone"
                options={timezoneOptions}
                value={field.value}
                onSelect={field.onChange}
                disabled={disabled}
                placeholder="Select Time Zone..."
                searchPlaceholder="Search time zone..."
                className="h-12 border-slate-800 bg-slate-950/60 pl-10 text-left"
              />
              <Clock className="text-slate-500 absolute top-3.5 left-3.5 h-4.5 w-4.5 pointer-events-none" />
            </div>
          )}
        />
      </div>

      {/* Currency Combobox */}
      <div className="space-y-2">
        <Label htmlFor="currency" className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          Preferred Currency
          <span className="text-slate-500 dark:text-slate-400/80 ml-2 text-xs font-normal">(Optional)</span>
        </Label>
        <Controller
          name="currency"
          control={control}
          render={({ field }) => (
            <div className="relative">
              <Combobox
                id="currency"
                options={currencyOptions}
                value={field.value}
                onSelect={field.onChange}
                disabled={disabled}
                placeholder="Select Currency..."
                searchPlaceholder="Search currency..."
                className="h-12 border-slate-800 bg-slate-950/60 pl-10 text-left"
              />
              <Landmark className="text-slate-500 absolute top-3.5 left-3.5 h-4.5 w-4.5 pointer-events-none" />
            </div>
          )}
        />
      </div>

      {/* Locale Combobox */}
      <div className="space-y-2">
        <Label htmlFor="locale" className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          Regional Format (Locale)
          <span className="text-slate-500 dark:text-slate-400/80 ml-2 text-xs font-normal">(Optional)</span>
        </Label>
        <Controller
          name="locale"
          control={control}
          render={({ field }) => (
            <div className="relative">
              <Combobox
                id="locale"
                options={localeOptions}
                value={field.value}
                onSelect={field.onChange}
                disabled={disabled}
                placeholder="Select Regional Format..."
                searchPlaceholder="Search locale..."
                className="h-12 border-slate-800 bg-slate-950/60 pl-10 text-left"
              />
              <Settings className="text-slate-500 absolute top-3.5 left-3.5 h-4.5 w-4.5 pointer-events-none" />
            </div>
          )}
        />
      </div>
    </div>
  );
});

LanguageFields.displayName = 'LanguageFields';
