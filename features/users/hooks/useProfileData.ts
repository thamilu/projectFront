'use client';

/**
 * @module useProfileData
 * @description
 * Clean custom hook orchestrating profile data lifecycle. Delegates caching, normalizers,
 * and API layers to dedicated modules.
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import type { UseFormReset } from 'react-hook-form';
import { useSession } from 'next-auth/react';

import type { ProfileValues } from '@/shared/schemas/user.schema';
import { useIsomorphicLayoutEffect } from '@/shared/hooks/useIsomorphicLayoutEffect';
import { ROLES } from '../utils/profile.constants';
import { globalTelemetry } from '../utils/profile-telemetry';
import { getProfileCache, buildProfileCacheKey } from '../utils/profile-cache';
import { fetchProfileDataDeduped, isAbortError, toError } from '../api/profile-api';
import {
  normalizeProfileData,
  buildBaseProfile,
  extractAccountMeta,
  type SessionUser,
  type AccountMeta,
} from '../utils/profile-normalizer';

// Export type-safe primitives for backward compatibility
export type ProfileLoadStatus = 'idle' | 'loading' | 'success' | 'error';

export interface UseProfileDataOptions {
  readonly userId?: string | null;
  readonly isSellerRole?: boolean;
  readonly throwOnError?: boolean;
  readonly onError?: (err: Error) => void;
}

export interface UseProfileDataReturn {
  readonly isLoading: boolean;
  readonly hasSellerProfile: boolean;
  readonly error: Error | null;
  readonly hasLoadedOnce: boolean;
  readonly status: ProfileLoadStatus;
  /** Non-form-field account metadata (createdAt, emailVerified, sellerStatus) — null until the first successful fetch resolves. */
  readonly accountMeta: AccountMeta | null;
}

export function useProfileData(
  reset: UseFormReset<ProfileValues>,
  options: UseProfileDataOptions = {}
): UseProfileDataReturn {
  const { userId, isSellerRole, throwOnError = false, onError } = options;

  const { data: session } = useSession();

  const [status, setStatus] = useState<ProfileLoadStatus>('idle');
  const [hasSellerProfile, setHasSellerProfile] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [accountMeta, setAccountMeta] = useState<AccountMeta | null>(null);

  const sessionUserId = session?.user?.id;
  const sessionUserEmail = session?.user?.email;
  const sessionUserName = session?.user?.name;
  const sessionUserFirstName = (session?.user as { firstName?: string } | undefined)?.firstName;
  const sessionUserLastName = (session?.user as { lastName?: string } | undefined)?.lastName;

  const stableSessionUser = useMemo<SessionUser | undefined>(
    () =>
      sessionUserId
        ? {
            id: sessionUserId,
            name: sessionUserName,
            email: sessionUserEmail,
            firstName: sessionUserFirstName,
            lastName: sessionUserLastName,
          }
        : undefined,
    [sessionUserId, sessionUserEmail, sessionUserName, sessionUserFirstName, sessionUserLastName]
  );

  const resetRef = useRef(reset);
  const onErrorRef = useRef(onError);
  const sessionUserRef = useRef(stableSessionUser);

  useIsomorphicLayoutEffect(() => {
    resetRef.current = reset;
  }, [reset]);
  useIsomorphicLayoutEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);
  useIsomorphicLayoutEffect(() => {
    sessionUserRef.current = stableSessionUser;
  }, [stableSessionUser]);

  const effectiveUserId = useMemo(
    () => userId ?? sessionUserId ?? undefined,
    [userId, sessionUserId]
  );

  const sessionRoles = useMemo(() => {
    const s = session as { roles?: string[] } | undefined;
    const u = session?.user as { roles?: string[] } | undefined;
    return s?.roles ?? u?.roles ?? [];
  }, [session]);

  const effectiveIsSeller = useMemo(
    () => isSellerRole ?? sessionRoles.includes(ROLES.SELLER),
    [isSellerRole, sessionRoles]
  );

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const { signal } = controller;
    const cleanup = (): void => {
      controller.abort();
    };

    if (!effectiveUserId) {
      setStatus('idle');
      return cleanup;
    }

    const capturedUserId = effectiveUserId;
    const capturedIsSeller = effectiveIsSeller;
    const cache = getProfileCache();
    const cacheKey = buildProfileCacheKey(capturedUserId, capturedIsSeller);

    const cached = cache?.get(cacheKey) ?? null;
    if (cached) {
      globalTelemetry.onCacheHit?.(capturedUserId);
      setHasSellerProfile(cached.hasSellerProfile);
      setAccountMeta(extractAccountMeta(cached.data));
      resetRef.current(normalizeProfileData(cached.data, sessionUserRef.current));
      setStatus('success');
      return cleanup;
    }

    globalTelemetry.onCacheMiss?.(capturedUserId);

    setStatus('loading');
    setError(null);

    (async () => {
      try {
        const result = await fetchProfileDataDeduped(capturedUserId, capturedIsSeller, signal);

        if (signal.aborted) return;

        cache?.set(cacheKey, {
          data: result.data,
          hasSellerProfile: result.sellerFound,
          timestamp: Date.now(),
        });

        setHasSellerProfile(result.sellerFound);
        setAccountMeta(extractAccountMeta(result.data));
        resetRef.current(normalizeProfileData(result.data, sessionUserRef.current));
        setStatus('success');
      } catch (err: unknown) {
        if (signal.aborted || isAbortError(err)) return;

        const profileError = toError(err, 'Failed to load profile data');
        setError(profileError);
        setStatus('error');

        onErrorRef.current?.(profileError);
        resetRef.current(buildBaseProfile(sessionUserRef.current));
      }
    })();

    return cleanup;
  }, [effectiveUserId, effectiveIsSeller]);

  if (throwOnError && error) throw error;

  return {
    isLoading: status === 'loading',
    hasSellerProfile,
    error,
    hasLoadedOnce: status === 'success' || status === 'error',
    status,
    accountMeta,
  };
}

// Re-export telemetry helpers and Cache Service APIs for backward compatibility
export {
  configureProfileDataTelemetry,
  resetProfileDataTelemetry,
  type ProfileDataTelemetry,
} from '../utils/profile-telemetry';

export { profileCacheService } from '../api/profile-api';
