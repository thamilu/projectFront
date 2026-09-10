// ============================================================
// features/auth/components/ui/login-button.tsx
// Login trigger component consuming useAuth hook.
// Handles AuthResult — no raw error propagation to the DOM:
// AuthError.message is always a curated literal set by the service
// layer (see AR.fail() call sites in auth-service.ts, both of which are
// reached unconditionally regardless of the `provider` argument — there
// is no provider-specific branch that could bypass this curation), never
// the raw caught error, so surfacing it directly here is safe by
// construction.
// ============================================================

'use client';

import { useCallback } from 'react';
import { Button, type ButtonProps } from '@/shared/ui/atoms/button';
import { LogIn } from 'lucide-react';

import { cn } from '@/shared/utils';
import { APP_ROUTES } from '@/shared/routes';
import { useAuth } from '@/domains/auth/hooks/use-auth';
import { sanitizeCallbackUrl } from '@/domains/auth/utils/sanitize-callback-url';
import type { AuthProvider } from '@/domains/auth/services/auth.constants';

// =============================================================================
// Types
// =============================================================================

/**
 * Props for the LoginButton component
 */
export interface LoginButtonProps {
  /**
   * URL to redirect to after successful authentication.
   * Must be a same-origin relative path for security.
   * @default '/dashboard' — the role-based redirect hub, which sends the
   *   user to their actual role-specific dashboard (or home for customers).
   * @example '/profile', '/orders', '/dashboard'
   */
  redirectTo?: string;

  /**
   * Additional CSS classes to apply to the button
   */
  className?: string;

  /**
   * Button variant from shadcn/ui design system
   * @default 'default'
   */
  variant?: ButtonProps['variant'];

  /**
   * Button size. 'icon' is intentionally excluded — this button always
   * renders visible text (children || 'Sign In'), so an icon-only size
   * was never a coherent configuration for it.
   * @default 'default'
   */
  size?: Exclude<ButtonProps['size'], 'icon'>;

  /**
   * Whether button should span full width of container
   * @default false
   */
  fullWidth?: boolean;

  /**
   * Whether to show the login icon
   * @default true
   */
  showIcon?: boolean;

  /**
   * Custom button text. If not provided, defaults to "Sign In"
   */
  children?: React.ReactNode;

  /**
   * OAuth provider override (defaults to Keycloak)
   */
  provider?: AuthProvider;
}

// No dedicated /customer/dashboard page exists — APP_ROUTES.DASHBOARD is
// the real role-based redirect hub (app/(customer)/dashboard/page.tsx),
// which sends the freshly-authenticated user wherever their role belongs.
const DEFAULT_CALLBACK_URL = APP_ROUTES.DASHBOARD;

// =============================================================================
// Component
// =============================================================================

/**
 * Enterprise-grade OAuth login button for Keycloak authentication.
 *
 * Initiates OAuth 2.0 flow via authService with proper CSRF protection
 * (handled by NextAuth's own signIn — see sanitize-callback-url.ts for
 * why this component doesn't generate its own state/nonce), loading
 * states, and error handling.
 */
const LOGIN_ERROR_MESSAGE_ID = 'login-button-error-message';

export function LoginButton({
  redirectTo,
  className,
  variant = 'default',
  size = 'default',
  fullWidth = false,
  showIcon = true,
  children,
  provider,
}: LoginButtonProps) {
  const { login, isLoggingIn, loginError, clearLoginError } = useAuth();

  // Validated once per redirectTo change — same shared validator used by
  // the login page, register gateway, and ModernAuthUI (sanitize-callback-url.ts),
  // so there is exactly one place that decides what a "safe" redirect looks like.
  const safeCallbackUrl = sanitizeCallbackUrl(redirectTo, DEFAULT_CALLBACK_URL);

  const handleLogin = useCallback(async () => {
    // Belt-and-suspenders: the Button atom's own `loading` state already
    // disables the native element, which should already prevent this
    // handler from firing on a double-click. Kept as an explicit guard
    // anyway since this initiates an auth flow specifically — cheap
    // insurance that survives even if Button's disabled-while-loading
    // behavior ever changes.
    if (isLoggingIn) return;
    clearLoginError();
    await login(safeCallbackUrl, provider);
  }, [isLoggingIn, safeCallbackUrl, login, provider, clearLoginError]);

  const buttonElement = (
    <Button
      type="button"
      onClick={handleLogin}
      loading={isLoggingIn}
      loadingText="Signing in..."
      fullWidth={fullWidth}
      variant={variant}
      size={size}
      className={cn('transition-all duration-200', className)}
      leftIcon={showIcon ? <LogIn aria-hidden="true" /> : undefined}
      aria-describedby={loginError ? LOGIN_ERROR_MESSAGE_ID : undefined}
    >
      {children || 'Sign In'}
    </Button>
  );

  // Wrapper is always rendered (not swapped in only on error) so the DOM
  // shape — and therefore this component's width behavior in whatever
  // flex/grid context it sits in (e.g. a header toolbar, its real usage in
  // user-nav.tsx) — never shifts at the exact moment an error appears.
  // Width follows the `fullWidth` prop, same as the Button itself, rather
  // than being unconditionally w-full.
  return (
    <div className={cn('flex flex-col items-start gap-2', fullWidth && 'w-full')}>
      {buttonElement}
      {/* Accessible error display — the sole error channel (no duplicate
          toast): a persistent, always-visible role="alert" outlives a
          toast's auto-dismiss timer and avoids two live regions announcing
          the same message. Retrying is just clicking the button again. */}
      {loginError && (
        <p
          id={LOGIN_ERROR_MESSAGE_ID}
          role="alert"
          aria-live="assertive"
          className="text-destructive text-sm font-medium"
        >
          {loginError.message}
        </p>
      )}
    </div>
  );
}
