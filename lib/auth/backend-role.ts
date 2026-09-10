import { z } from 'zod';
import { env } from '@/env';
import { logger } from '@/core/telemetry/logger';
import { BACKEND_CONFIG } from './config';
import type { BackendRoleFetchResult, ExtendedJWT } from './types';
import { BackendRoleErrorCode } from './types';
import { measurementStart, elapsedMs } from './utils';

// Runtime-validated at this trust boundary (the backend is a separate
// deployable that can change shape independently of this frontend) — a
// TypeScript interface alone only documents the expected shape, it doesn't
// verify what actually came back over the wire. Permissive by design: only
// `role`'s type is constrained, since that's the only field this module
// reads; unknown extra fields are ignored rather than rejected.
//
// `role` is checked at both `data.role` and top-level `role` because the
// backend's response envelope has been observed in both shapes (unclear
// whether this reflects a real versioned-API difference or accumulated
// inconsistency). Resolve with the backend team and collapse to one shape
// if this is ever confirmed unintentional.
const BackendUserProfileResponseSchema = z.object({
  data: z.object({ role: z.string().optional() }).optional(),
  role: z.string().optional(),
});

// ─── Backend Role Fetch with Retry ───────────────────────────────────────────

/**
 * Fetches user role with resilient retries on network failures or temporary blips.
 */
export async function fetchUserRoleWithRetry(
  accessToken: string,
  retries = BACKEND_CONFIG.MAX_RETRIES
): Promise<BackendRoleFetchResult> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await fetchUserRoleFromBackend(accessToken);

      // If we got a valid role, or if there is no error (successful fetch that returned no role), return it.
      if (result.role !== null || !result.error) {
        return result;
      }

      if (attempt < retries) {
        logger.warn('[Auth] Retrying backend role fetch', {
          attempt: attempt + 1,
          error: result.error,
        });
        await new Promise((resolve) =>
          setTimeout(resolve, BACKEND_CONFIG.BASE_DELAY_MS * (attempt + 1))
        );
      } else {
        return result;
      }
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : String(err);

      if (attempt === retries) {
        // fetchUserRoleFromBackend() has its own internal try/catch and
        // should never itself throw — this branch only exists as a defensive
        // backstop against a future regression there. backendRoleError ends
        // up on the JWT/session exposed to the client (see ExtendedJWT), so
        // even this backstop path must return a curated message, not the
        // raw exception, matching every other error path in this file.
        logger.error('[Auth] Unexpected exception in backend role fetch retry loop', {
          attempt: attempt + 1,
          error: rawMessage,
        });
        return { role: null, error: BackendRoleErrorCode.UNEXPECTED_ERROR };
      }

      logger.warn('[Auth] Retrying backend role fetch after exception', {
        attempt: attempt + 1,
        error: rawMessage,
      });
      await new Promise((resolve) =>
        setTimeout(resolve, BACKEND_CONFIG.BASE_DELAY_MS * (attempt + 1))
      );
    }
  }
  // Unreachable given the current loop bounds (every path above returns
  // before falling through) — kept as a defensive backstop in case the
  // loop structure ever changes, not a real, exercised code path today.
  return { role: null, error: BackendRoleErrorCode.UNEXPECTED_ERROR };
}

/**
 * Fetches user role from Spring Boot backend database.
 * Acts as source of truth to bypass Keycloak's SSO session role cache.
 *
 * @param accessToken - Valid Keycloak access token for Bearer auth
 * @returns Role string (uppercase) or null with optional error
 */
export async function fetchUserRoleFromBackend(
  accessToken: string
): Promise<BackendRoleFetchResult> {
  const startTime = measurementStart();
  const url = `${env.SPRING_BOOT_API_URL}/api/v1/users/me`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), BACKEND_CONFIG.TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      logger.warn('[Auth] Backend role fetch failed', {
        status: response.status,
        statusText: response.statusText,
      });
      return { role: null, error: BackendRoleErrorCode.FETCH_FAILED };
    }

    const parsed = BackendUserProfileResponseSchema.safeParse(await response.json());
    if (!parsed.success) {
      logger.error('[Auth] Malformed response from backend role endpoint', {
        issues: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      });
      return { role: null, error: BackendRoleErrorCode.FETCH_FAILED };
    }

    const role = parsed.data.data?.role ?? parsed.data.role;

    logger.debug('[Auth] Backend role fetched', {
      durationMs: elapsedMs(startTime),
      hasRole: !!role,
    });

    return { role: role ? String(role).toUpperCase() : null };
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      logger.warn('[Auth] Backend role fetch timeout');
    } else {
      logger.error('[Auth] Backend role fetch exception', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
    return { role: null, error: BackendRoleErrorCode.NETWORK_ERROR };
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Role Merging ─────────────────────────────────────────────────────────────

/**
 * Merges backend role into token roles array (deduplicates & replaces
 * application roles while preserving Keycloak infrastructure roles).
 */
export function mergeBackendRole(
  token: ExtendedJWT,
  backendResult: BackendRoleFetchResult
): ExtendedJWT {
  if (backendResult.role) {
    // Preserve Keycloak infrastructure roles (e.g. offline_access, uma_authorization)
    // and replace standard application-level roles with Backend Role
    const infraRoles = token.roles.filter(
      (r) => r.startsWith('offline_access') || r === 'uma_authorization'
    );
    return {
      ...token,
      roles: Array.from(new Set([...infraRoles, backendResult.role])),
      backendRoleError: undefined,
    };
  }

  if (backendResult.error) {
    logger.warn('[Auth] Proceeding with Keycloak roles only — backend unavailable', {
      error: backendResult.error,
    });
    return { ...token, backendRoleError: backendResult.error };
  }

  return token;
}
