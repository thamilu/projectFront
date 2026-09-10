'use client';

import { useMemo } from 'react';
import { NEXT_AUTH_ERROR_MESSAGES, DEFAULT_AUTH_ERROR_MESSAGE } from '@/lib/auth/constants';
import type { NextAuthErrorCode } from '@/lib/auth/constants';

/**
 * Hook to translate authentication error codes into user-friendly localized messages.
 * Uses memoization to avoid redundant lookups.
 */
export function useErrorMessage(errorCode: string | null): string | null {
  return useMemo(() => {
    if (!errorCode) return null;
    return NEXT_AUTH_ERROR_MESSAGES[errorCode as NextAuthErrorCode] || DEFAULT_AUTH_ERROR_MESSAGE;
  }, [errorCode]);
}
