'use client';

import { useState, useCallback } from 'react';
import { UseFormReset, type FieldNamesMarkedBoolean } from 'react-hook-form';
import { toast } from 'sonner';
import { logger } from '@/core/telemetry/logger';
import { apiClient } from '@/core/client';
import { API_ENDPOINTS } from '@/shared/constants/api/endpoints';
import { profileSchema, type ProfileValues } from '@/shared/schemas/user.schema';

interface UseProfileSubmitOptions {
  hasSellerProfile: boolean;
  reset: UseFormReset<ProfileValues>;
  onSuccess: () => void;
}

interface UseProfileSubmitReturn {
  isSubmitting: boolean;
  submit: (
    values: ProfileValues,
    dirtyFields?: Partial<FieldNamesMarkedBoolean<ProfileValues>>
  ) => Promise<void>;
  error: Error | null;
}

/**
 * Encapsulates submit logic, payload sanitization, and error handling.
 * SRP: Only responsible for the submit lifecycle.
 */
export function useProfileSubmit({
  hasSellerProfile,
  reset,
  onSuccess,
}: UseProfileSubmitOptions): UseProfileSubmitReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const submit = useCallback(
    async (
      values: ProfileValues,
      dirtyFields?: Partial<FieldNamesMarkedBoolean<ProfileValues>>
    ) => {
      setIsSubmitting(true);
      setError(null);
      try {
        const endpoint = hasSellerProfile
          ? API_ENDPOINTS.SELLER.PROFILE
          : API_ENDPOINTS.USERS.PROFILE;

        // X-Bypass-Toast: this handler already shows a specific, status-code-
        // aware toast for every failure branch below (401/403/409/500/
        // network/timeout). Without this header, the global axios
        // interceptor (core/interceptors/index.ts) ALSO shows its own
        // generic toast for 403/404/422/429/500+ on every request — so a
        // failed save previously double-toasted ("Access Denied" AND
        // "Unable to save profile" back to back) for those status codes.
        await apiClient.put(endpoint, sanitizePayload(values, dirtyFields), {
          headers: { 'X-Bypass-Toast': 'true' },
        });

        toast.success('Profile updated successfully');
        // Best-effort only: ProfileForm's own onSuccess callback already
        // refreshes the session (with the new display name) in its own
        // try/catch. This used to ALSO call updateSession() here,
        // unguarded — a flaky /api/auth/session refresh would throw into
        // the catch block below and show a contradictory "Unable to save
        // profile" toast immediately after the success toast above, even
        // though the profile update itself had already succeeded.
        reset(values); // Sync form baseline to submitted values
        onSuccess();
      } catch (err: unknown) {
        logger.error('Profile update failed', { error: err });
        const typedError = err instanceof Error ? err : new Error(String(err));
        setError(typedError);

        let message = 'Failed to update profile. Please try again.';

        if (typeof err === 'object' && err !== null) {
          const response = (err as Record<string, unknown>).response as
            | Record<string, unknown>
            | undefined;
          if (response) {
            const status = response.status;
            const data = response.data as Record<string, unknown> | undefined;

            if (status === 401) {
              message = 'Session expired. Please log in again to save your profile settings.';
            } else if (status === 403) {
              message = 'Access denied: You do not have permission to perform this action.';
            } else if (status === 409) {
              message =
                'Conflict: This profile was modified in another session. Please refresh to avoid overwrites.';
            } else if (status === 500) {
              message =
                'Internal server error: Our services are temporarily unavailable. Please try again later.';
            } else if (data && typeof data.message === 'string') {
              message = data.message;
            }
          } else {
            const code = (err as Record<string, unknown>).code;
            const isNetworkError =
              code === 'ERR_NETWORK' || (err as Error).message?.includes('Network Error');
            if (isNetworkError) {
              message =
                'Network connection lost. Please check your internet connectivity and try again.';
            } else if (code === 'ECONNABORTED') {
              message = 'Request timed out. The server did not respond in time. Please try again.';
            } else {
              const msg = (err as Error).message;
              if (typeof msg === 'string') {
                message = msg;
              }
            }
          }
        }

        toast.error('Unable to save profile', {
          description: message,
        });
        // Not re-thrown: the error is already fully handled here (state
        // set for the inline Alert, toast shown to the user), and nothing
        // downstream catches it. ProfileForm's handleFormSubmit awaits
        // submit() with no try/catch, and react-hook-form's handleSubmit()
        // does not catch what its onValid callback throws — re-throwing
        // here previously produced an unhandled promise rejection on every
        // single failed save (verified empirically), pure noise for an
        // already-handled, often user-caused error (e.g. a rejected
        // request), not a real application fault.
      } finally {
        setIsSubmitting(false);
      }
    },
    [hasSellerProfile, reset, onSuccess]
  );

  return { isSubmitting, submit, error };
}

// ─── Private Helpers ──────────────────────────────────────────────────────────

/**
 * The allowed-key list is derived from profileSchema itself (not a second,
 * hand-maintained list) after this exact class of bug: `timezone`,
 * `currency`, and `locale` are real, user-editable fields (see
 * LanguageFields.tsx) that were added to profileSchema without the old
 * hardcoded allowedKeys array being updated to match — every save silently
 * dropped those three fields from the request while the UI still reported
 * "Profile updated successfully", discarding the user's change with no
 * error surfaced anywhere.
 */
const ALLOWED_PAYLOAD_KEYS = Object.keys(profileSchema.shape) as (keyof ProfileValues)[];

/**
 * Builds the PUT payload from only the fields the user actually touched
 * this session (react-hook-form's dirtyFields), sent as-is including empty
 * strings — not filtered by emptiness. Two real bugs this replaces:
 *
 * 1. Blanking an untouched field: every field in `values` always has SOME
 *    value (react-hook-form populates every schema key from defaults),
 *    so sending the whole object unfiltered would silently overwrite
 *    fields the user never looked at with their current (often empty)
 *    default — this is why dirtyFields-scoping exists at all.
 * 2. Clearing a touched field: the previous version filtered out
 *    `''`/`null`/`undefined` regardless of dirtiness, so clearing a
 *    previously-set optional field (e.g. dateOfBirth's clear button, or
 *    emptying alternatePhone) omitted the key from the payload entirely —
 *    a partial-merge backend then kept the old value while the UI still
 *    reported "Profile updated successfully". Scoping by dirtyFields
 *    instead of by emptiness fixes both: an edited-to-empty field is
 *    dirty, so it's included (as '', signaling "clear this"); an
 *    untouched field is never dirty, so it's excluded regardless of value.
 *
 * Falls back to the pre-existing emptiness-based filter when no
 * dirtyFields map is supplied, so any other caller of submit() keeps its
 * current behavior.
 */
function sanitizePayload(
  values: ProfileValues,
  dirtyFields?: Partial<FieldNamesMarkedBoolean<ProfileValues>>
): Record<string, unknown> {
  if (dirtyFields) {
    const entries = Object.entries(values).filter(
      ([k]) => ALLOWED_PAYLOAD_KEYS.includes(k as keyof ProfileValues) && !!dirtyFields[k as keyof ProfileValues]
    );
    return Object.fromEntries(entries);
  }

  const entries = Object.entries(values)
    .filter(([k]) => ALLOWED_PAYLOAD_KEYS.includes(k as keyof ProfileValues))
    .filter(([, v]) => v !== '' && v !== null && v !== undefined);
  return Object.fromEntries(entries);
}
