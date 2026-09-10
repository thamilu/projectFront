/**
 * ContactFields.tsx
 *
 * Email Address and Phone Number input fields.
 * Part of the modular profile form system.
 *
 * Design Decisions:
 * - Email is always read-only (managed by Identity Provider)
 * - Phone is editable and required
 * - Session subscription scoped to email only via selector
 * - Skeleton shown while session loads to prevent layout shift
 * - Fully accessible with aria attributes
 */

import { memo, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { useSession } from 'next-auth/react';
import { Mail, Phone } from 'lucide-react';

import { FormField } from '@/shared/ui/molecules/FormField';
import { Skeleton } from '@/shared/ui/atoms/skeleton';
import { cn } from '@/shared/utils';
import type { ProfileValues } from '@/shared/schemas/user.schema';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

/** Placeholder shown in phone field — configurable per region */
const PHONE_PLACEHOLDER = '+91 98765 43210' as const;

/** Helper text explaining why email is locked */
const EMAIL_HELPER_TEXT =
  'Managed by Keycloak SSO. To update your email address, visit Settings → Security.' as const;

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface ContactFieldsProps {
  /** Disables editable inputs when true (e.g. during form submission) */
  disabled?: boolean;

  /** Optional override for phone placeholder text */
  phonePlaceholder?: string;

  /** Optional extra class names for the wrapper */
  className?: string;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

/**
 * ContactFields component
 *
 * Renders Email (read-only) and Phone (editable) fields.
 *
 * - Must be used inside a react-hook-form <FormProvider>
 * - Must be used inside a next-auth <SessionProvider>
 * - Memoized to prevent redundant renders from parent
 */
export const ContactFields = memo(function ContactFields({
  disabled = false,
  phonePlaceholder = PHONE_PLACEHOLDER,
  className,
}: ContactFieldsProps) {
  // ── Session ───────────────────────────────
  // Status used to show skeleton while session loads
  const { data: session, status } = useSession();

  // Derive email only — avoids re-renders on unrelated session changes
  const userEmail = useMemo(() => session?.user?.email ?? '', [session?.user?.email]);

  // ── Form Context ──────────────────────────
  const {
    register,
    formState: { errors },
  } = useFormContext<ProfileValues>();

  // ── Loading State ─────────────────────────
  // Show skeleton grid while session is being fetched
  // Prevents layout shift and empty placeholder flash
  if (status === 'loading') {
    return (
      <div
        className={cn('grid gap-6 md:grid-cols-2', className)}
        aria-busy="true"
        aria-label="Loading contact fields"
        data-testid="contact-fields-skeleton"
      >
        <Skeleton className="h-[72px] w-full rounded-md" />
        <Skeleton className="h-[72px] w-full rounded-md" />
      </div>
    );
  }

  // ── Render ────────────────────────────────
  return (
    <div
      className={cn('grid gap-6 md:grid-cols-2', className)}
      role="group"
      aria-label="Contact information"
    >
      {/* 
        Email Field
        Always disabled + readOnly — managed by Identity Provider.
        User cannot edit this here; changes must go through IdP.
      */}
      <FormField
        id="email"
        label="Email Address"
        registration={register('email')}
        error={errors.email?.message}
        disabled
        readOnly
        icon={Mail}
        helperText={EMAIL_HELPER_TEXT}
        value={userEmail}
        className="bg-muted/50 cursor-not-allowed"
        aria-readonly="true"
        inputMode="email"
        autoComplete="email"
      />

      {/*
        Phone Field
        Editable. Required for profile completion.
        Disabled during parent form submission via `disabled` prop.
      */}
      <FormField
        id="phone"
        label="Phone Number"
        registration={register('phone')}
        error={errors.phone?.message}
        disabled={disabled}
        icon={Phone}
        placeholder={phonePlaceholder}
        required
        inputMode="tel"
        autoComplete="tel"
        helperText="Required. Preferred format: +91 98765 43210."
        aria-required="true"
      />
    </div>
  );
});

ContactFields.displayName = 'ContactFields';
