'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { SellerOnboardingValues } from '@/domains/seller/contracts/seller.schema';
import { apiClient } from '@/core/client';
import { sellerApi } from '@/features/seller/api/seller-api';
import { API_ENDPOINTS } from '@/shared/constants/api/endpoints';
import { logger } from '@/core/telemetry/logger';
import type { ApiResponse } from '@/shared/types/api';

/**
 * Fields this hook populates from the user's session/account profile rather
 * than anything the user types into the wizard as part of their draft.
 * Keep this in sync with {@link extractUserProfileFields}'s return keys —
 * consumers (see SellerRoleUpgradeForm's "Start Fresh" handler) rely on this
 * list to distinguish "real profile data" from "discardable wizard draft"
 * when resetting the form, so it must not silently drift from what that
 * function actually returns.
 */
export const PREFILL_FIELDS = [
  'firstName',
  'lastName',
  'email',
  'phone',
  'alternatePhone',
  'preferredLanguage',
  'gender',
  'dateOfBirth',
  'addressLine1',
  'addressLine2',
  'city',
  'district',
  'taluk',
  'state',
  'pincode',
  'country',
] as const satisfies readonly (keyof SellerOnboardingValues)[];

interface PrefillDependencies {
  user: {
    name?: string | null;
    email?: string | null;
    firstName?: string;
    lastName?: string;
    phone?: string;
  } | null;
  methods: UseFormReturn<SellerOnboardingValues>;
  isActive: boolean;
}

export function useSellerPrefill({ user, methods, isActive }: PrefillDependencies) {
  const hasAttempted = useRef(false);

  const prefill = useCallback(async () => {
    if (!user || hasAttempted.current || !isActive) return;
    hasAttempted.current = true;

    // Immediate: session data (zero latency).
    //
    // `user.firstName`/`user.lastName` are typed as plain, non-nullable
    // `string` (see lib/auth/types.ts) and default to `''` — never
    // `null`/`undefined` — whenever the session's cached Keycloak claims
    // lack a name (a known scope/mapper gap, see lib/auth/handlers.ts).
    // `??` only falls through on `null`/`undefined`, so an empty-string
    // `firstName` used to short-circuit `??` and skip the `user.name`
    // fallback entirely, leaving the field blank even though `user.name`
    // had a real value. `||` treats `''` as falsy too, so the fallback
    // actually runs.
    const currentValues = methods.getValues();
    methods.reset(
      {
        ...currentValues,
        firstName: user.firstName || user.name?.split(' ')[0] || '',
        lastName: user.lastName || user.name?.split(' ').slice(1).join(' ') || '',
        email: user.email ?? '',
        phone: user.phone ?? currentValues.phone ?? '',
      },
      { keepDefaultValues: true }
    );

    logger.debug('[SellerRegistration] Prefilled basic session defaults');

    // Parallel: fetch user profile + seller profile simultaneously
    const [userResult, sellerResult] = await Promise.allSettled([
      apiClient.get<ApiResponse<any>>(API_ENDPOINTS.USERS.PROFILE),
      sellerApi.getMyProfile(),
    ]);

    const updates: Partial<SellerOnboardingValues> = {};

    if (userResult.status === 'fulfilled') {
      const userData = userResult.value.data?.data ?? userResult.value.data ?? userResult.value;
      if (userData) {
        logger.debug('[SellerRegistration] Merging actual user profile data');
        Object.assign(updates, extractUserProfileFields(userData));
      }
    }

    if (sellerResult.status === 'fulfilled' && sellerResult.value) {
      logger.debug('[SellerRegistration] Merging existing seller data from profile');
      Object.assign(updates, sellerResult.value);
    }

    if (Object.keys(updates).length > 0) {
      const latestValues = methods.getValues();
      methods.reset(
        {
          ...latestValues,
          ...updates,
          firstName: updates.firstName || latestValues.firstName || '',
          lastName: updates.lastName || latestValues.lastName || '',
          email: updates.email || user.email || latestValues.email || '',
          phone: updates.phone || (updates as any).personalMobileNumber || latestValues.phone || '',
        },
        { keepDefaultValues: true }
      );
    }
  }, [user, methods, isActive]);

  useEffect(() => {
    prefill();
  }, [prefill]);
}

function extractUserProfileFields(userData: any): Partial<SellerOnboardingValues> {
  let sanitizedDateOfBirth = userData.dateOfBirth ?? '';
  if (sanitizedDateOfBirth) {
    const dobDate = new Date(sanitizedDateOfBirth);
    if (!isNaN(dobDate.getTime())) {
      const year = dobDate.getFullYear();
      if (year < 1945 || sanitizedDateOfBirth.startsWith('1932-08-10')) {
        sanitizedDateOfBirth = '';
      }
    }
  }

  return {
    firstName: userData.firstName ?? '',
    lastName: userData.lastName ?? '',
    email: userData.email ?? '',
    phone: userData.phone ?? userData.personalMobileNumber ?? '',
    alternatePhone: userData.alternatePhone ?? '',
    preferredLanguage: userData.preferredLanguage ?? '',
    gender: userData.gender ?? '',
    dateOfBirth: sanitizedDateOfBirth,
    addressLine1: userData.addressLine1 ?? '',
    addressLine2: userData.addressLine2 ?? '',
    city: userData.city ?? '',
    district: userData.district ?? '',
    taluk: userData.taluk ?? '',
    state: userData.state ?? '',
    pincode: userData.pincode ?? '',
    country: userData.country ?? 'India',
  };
}
