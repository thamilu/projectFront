/**
 * NameFields.tsx
 *
 * First Name and Last Name input fields.
 * Part of the modular profile form system.
 *
 * Design Decisions:
 * - Both fields are required for profile completion
 * - Names validated for minimum length (2 characters)
 * - Supports international names (Unicode characters allowed)
 * - No special character restrictions (cultural inclusivity)
 * - Fully accessible with WCAG 2.1 AA compliance
 * - Memoized to prevent parent re-renders
 *
 * Technical Constraints:
 * - Must be used inside react-hook-form <FormProvider>
 * - Requires ProfileValues schema for type safety
 * - Names must pass schema validation (min 2 chars, max 50 chars)
 *
 * Error Handling:
 * - Component errors caught by parent ErrorBoundary
 * - Form validation errors displayed inline via FormField
 * - No try-catch needed (pure render function)
 *
 * @throws Never - All errors propagate to ErrorBoundary
 *
 * @example Basic usage
 * ```tsx
 * <FormProvider {...methods}>
 *   <NameFields disabled={!isEditing} />
 * </FormProvider>
 * ```
 *
 * @example With custom spacing
 * ```tsx
 * <NameFields
 *   disabled={!isEditing}
 *   className="gap-8"
 * />
 * ```
 *
 * @see {@link ContactFields} - Similar pattern for contact information
 * @see {@link PersonalDetailsFields} - Sibling component in profile form
 * @see {@link LanguageFields} - Another field group component
 */

import { memo } from 'react';
import { useFormContext } from 'react-hook-form';
import { FormField } from '@/shared/ui/molecules/FormField';
import { cn } from '@/shared/utils';
import type { ProfileValues } from '@/shared/schemas/user.schema';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface NameFieldsProps {
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
 * Full name input fields component
 *
 * Renders:
 * - First Name (required, 2-50 characters)
 * - Last Name (required, 2-50 characters)
 *
 * Both fields:
 * - Support international Unicode characters
 * - Have autocomplete hints for better UX
 * - Are optimized for mobile keyboards
 * - Display inline validation errors
 *
 * Requirements:
 * - Must be inside react-hook-form <FormProvider>
 * - Memoized to prevent unnecessary re-renders
 * - Fully accessible with ARIA attributes
 *
 * @example Basic usage
 * ```tsx
 * <NameFields disabled={!isEditing} />
 * ```
 *
 * @example With custom grid gap
 * ```tsx
 * <NameFields
 *   disabled={!isEditing}
 *   className="gap-8 lg:grid-cols-1"
 * />
 * ```
 */
export const NameFields = memo(function NameFields({
  disabled = false,
  className,
}: NameFieldsProps) {
  // ── Form Context ──────────────────────────
  const {
    register,
    formState: { errors },
  } = useFormContext<ProfileValues>();

  // ── Render ────────────────────────────────
  return (
    <div className={cn('grid gap-6 md:grid-cols-2', className)} role="group" aria-label="Full name">
      {/* 
        First Name
        Required for profile completion and identity verification.
        Supports international characters for cultural inclusivity.
      */}
      <FormField
        id="firstName"
        label="First Name"
        registration={register('firstName')}
        error={errors.firstName?.message}
        disabled={disabled}
        required
        autoComplete="given-name"
        inputMode="text"
        helperText="Required. Max 100 characters. Letters, spaces, and hyphens supported."
      />

      {/*
        Last Name
        Required for profile completion and identity verification.
        Supports international characters for cultural inclusivity.
      */}
      <FormField
        id="lastName"
        label="Last Name"
        registration={register('lastName')}
        error={errors.lastName?.message}
        disabled={disabled}
        required
        autoComplete="family-name"
        inputMode="text"
        helperText="Required. Max 100 characters. Letters, spaces, and hyphens supported."
      />
    </div>
  );
});

NameFields.displayName = 'NameFields';
