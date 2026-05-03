'use client';

import { logger } from '@/lib/observability/logger';
import { APP_ROUTES } from '@/constants/routes/app-routes';
import { safeFetch } from '@/lib/utils/fetch-utils';

type LogoutResponse = {
  keycloakLogoutUrl?: string;
  redirectTo?: string;
};

export async function logoutAndRedirect(options?: { redirectTo?: string }): Promise<void> {
  const fallbackRedirectTo = options?.redirectTo ?? APP_ROUTES.AUTH_LOGIN;

  try {
    // Ensure the next login shows the account chooser / login screen.
    // We can't rely on query params because Keycloak post-logout redirect URI
    // matching is often strict and may reject URIs with queries.
    try {
      sessionStorage.setItem('force_login', '1');
    } catch {}

    const params = new URLSearchParams({ redirectTo: fallbackRedirectTo });
    const resp = await safeFetch<LogoutResponse>(`/api/auth/logout?${params.toString()}`, {
      method: 'POST',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
      },
      credentials: 'include',
    });

    const data = (resp || {}) as LogoutResponse;

    const useKeycloakLogout = process.env.NEXT_PUBLIC_USE_KEYCLOAK_LOGOUT !== 'false';
    const target =
      (useKeycloakLogout ? data.keycloakLogoutUrl : undefined) ??
      data.redirectTo ??
      fallbackRedirectTo;
    window.location.assign(target);
  } catch (error) {
    logger.error('[auth] Logout failed, falling back to local redirect', { error });
    window.location.assign(fallbackRedirectTo);
  }
}
