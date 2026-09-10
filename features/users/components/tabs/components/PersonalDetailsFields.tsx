/**
 * PersonalDetailsFields.tsx
 *
 * Gender and Date of Birth input fields.
 * Part of the modular profile form system.
 *
 * Design Decisions:
 * - Gender is optional (privacy-respecting, inclusive design)
 * - Date of Birth is optional (collected only when legally required)
 * - Gender options match backend Gender.java enum exactly
 * - Includes "Prefer not to say" option for privacy
 * - Custom ModernDatePicker for better UX than native date input
 * - Uses react-hook-form Controller for complex controls (Select, DatePicker)
 * - Fully accessible with WCAG 2.1 AA compliance
 * - Memoized to prevent parent re-renders
 *
 * Technical Constraints:
 * - Must be used inside react-hook-form <FormProvider>
 * - Requires ProfileValues schema for type safety
 * - Gender options imported from profile.constants (single source of truth)
 * - ModernDatePicker must implement controlled component pattern
 * - Gender values must match backend enum: MALE, FEMALE, NON_BINARY, PREFER_NOT_TO_SAY
 *
 * Error Handling:
 * - Component errors caught by parent ErrorBoundary
 * - Form validation errors displayed inline below each field
 * - No try-catch needed (pure render function)
 *
 * @throws Never - All errors propagate to ErrorBoundary
 *
 * @example Basic usage
 * ```tsx
 * <FormProvider {...methods}>
 *   <PersonalDetailsFields disabled={!isEditing} />
 * </FormProvider>
 * ```
 *
 * @example With custom spacing
 * ```tsx
 * <PersonalDetailsFields
 *   disabled={!isEditing}
 *   className="gap-8 lg:grid-cols-1"
 * />
 * ```
 *
 * @see {@link NameFields} - Similar pattern for name inputs
 * @see {@link ContactFields} - Similar pattern for contact information
 * @see {@link LanguageFields} - Similar pattern for language preferences
 */

import { memo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Label } from '@/shared/ui/atoms/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/atoms/select';
import { DateOfBirthPicker } from '@/shared/ui/molecules/date-picker';
import { GENDER_OPTIONS } from '../../../utils/profile.constants';
import { cn } from '@/shared/utils';
import type { ProfileValues } from '@/shared/schemas/user.schema';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

/** Standard height for form controls */
const CONTROL_HEIGHT = 'h-12' as const;

/** Error message styling classes */
const ERROR_TEXT_CLASSES = 'text-xs text-destructive font-medium mt-1 ml-1' as const;

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface PersonalDetailsFieldsProps {
  /**
   * Disables both inputs when true (e.g., during form submission)
   * @default false
   */
  disabled?: boolean;

  /**
   * Additional CSS classes for the container
   * Useful for customizing layout spacing
   */
  className?: string;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

/**
 * Personal demographic information fields
 *
 * Renders:
 * - Gender (optional, privacy-respecting)
 * - Date of Birth (optional, custom picker)
 *
 * Both fields:
 * - Are optional (not required for profile completion)
 * - Display inline validation errors
 * - Use Controller for proper form integration
 * - Support disabled state during submission
 *
 * Requirements:
 * - Must be inside react-hook-form <FormProvider>
 * - Memoized to prevent unnecessary re-renders
 * - Fully accessible with ARIA attributes
 *
 * @example Basic usage
 * ```tsx
 * <PersonalDetailsFields disabled={!isEditing} />
 * ```
 *
 * @example With custom layout
 * ```tsx
 * <PersonalDetailsFields
 *   disabled={!isEditing}
 *   className="gap-8"
 * />
 * ```
 */
export const PersonalDetailsFields = memo(function PersonalDetailsFields({
  disabled = false,
  className,
}: PersonalDetailsFieldsProps) {
  // ── Form Context ──────────────────────────
  const {
    control,
    formState: { errors },
  } = useFormContext<ProfileValues>();

  // ── Render ────────────────────────────────
  return (
    <div
      className={cn('grid gap-6 md:grid-cols-2', className)}
      role="group"
      aria-label="Personal details"
    >
      {/* 
        Gender
        Optional field for demographic information.
        Respects privacy with "Prefer not to say" option.
        Matches backend Gender enum values.
      */}
      <div className="space-y-2">
        <Label htmlFor="gender">
          Gender
          <span className="text-muted-foreground/60 ml-1.5 text-[11px] font-normal dark:text-slate-400/50">
            (Optional)
          </span>
        </Label>
        <Controller
          name="gender"
          control={control}
          render={({ field }) => (
            <>
              <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
                <SelectTrigger
                  id="gender"
                  className={cn(CONTROL_HEIGHT, !field.value && 'text-slate-400/80')}
                  aria-label="Select your gender"
                  aria-invalid={errors.gender ? 'true' : 'false'}
                  aria-describedby={
                    // The helper paragraph below is always rendered (not
                    // hidden on error, unlike the FormField-routed fields
                    // elsewhere in this form), so it stays included even
                    // when the error message is also present and visible.
                    errors.gender?.message
                      ? 'gender-error gender-description'
                      : 'gender-description'
                  }
                  aria-required="false"
                >
                  <SelectValue placeholder="Select Gender" />
                </SelectTrigger>
                <SelectContent>
                  {/* GENDER_OPTIONS is a hardcoded, always-non-empty constant
                      (utils/profile.constants.ts) — the empty-list branch
                      this used to have could never execute, and if it ever
                      had, Radix's <SelectItem> throws on an empty `value`
                      prop rather than degrading gracefully. */}
                  {GENDER_OPTIONS.filter((opt) => opt.value && opt.label).map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Helper text — id referenced by aria-describedby above */}
              <p
                id="gender-description"
                className="text-[11px] text-muted-foreground leading-relaxed px-0.5 mt-1 select-none"
              >
                Optional. Used for tailored recommendations and product sizing. Never displayed publicly.
              </p>

              {/* Error Message */}
              {errors.gender?.message && (
                <p id="gender-error" className={ERROR_TEXT_CLASSES} role="alert" aria-live="polite">
                  {String(errors.gender.message)}
                </p>
              )}
            </>
          )}
        />
      </div>

      {/*
        Date of Birth
        Optional field for age verification and personalization.
        Uses custom date picker for better UX.
      */}
      <div className="space-y-2">
        <Label htmlFor="dateOfBirth">
          Date of Birth
          <span className="text-muted-foreground/60 ml-1.5 text-[11px] font-normal">
            (Optional)
          </span>
        </Label>
        <Controller
          name="dateOfBirth"
          control={control}
          render={({ field }) => (
            <>
              <DateOfBirthPicker
                id="dateOfBirth"
                value={field.value}
                onChange={field.onChange}
                disabled={disabled}
                clearable={true}
                showAgeBadge={true}
                aria-label="Select your date of birth"
                aria-invalid={errors.dateOfBirth ? 'true' : 'false'}
                aria-describedby={
                  errors.dateOfBirth?.message
                    ? 'dateOfBirth-error dateOfBirth-description'
                    : 'dateOfBirth-description'
                }
              />

              <p
                id="dateOfBirth-description"
                className="text-[11px] text-muted-foreground leading-relaxed px-0.5 mt-1 select-none"
              >
                Private to your account. Used for legal age verification and compliance.
              </p>

              {/* Error Message */}
              {errors.dateOfBirth?.message && (
                <p
                  id="dateOfBirth-error"
                  className={ERROR_TEXT_CLASSES}
                  role="alert"
                  aria-live="polite"
                >
                  {String(errors.dateOfBirth.message)}
                </p>
              )}
            </>
          )}
        />
      </div>
    </div>
  );
});

PersonalDetailsFields.displayName = 'PersonalDetailsFields';
