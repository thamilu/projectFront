/**
// ============================================================
// features/auth/components/ui/login-button.tsx
// Login trigger component consuming useAuth hook.
// Handles AuthResult — no raw error propagation to the DOM:
// AuthError.message is always a curated literal set by the service
// layer (see AR.fail() call sites in auth-service.ts), never the raw
// caught error, so surfacing it directly here is safe by construction.
// ============================================================
 */

'use client';

import { useCallback } from 'react';
import { Button, type ButtonProps } from '@/shared/ui/atoms/button';
import { LogIn } from 'lucide-react';

import { cn } from '@/shared/utils';
import { useAuth } from '../../hooks/use-auth';
import { sanitizeCallbackUrl } from '../../utils/sanitize-callback-url';
import type { AuthProvider } from '../../services/auth.constants';

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
   * @default '/customer/dashboard'
   * @example '/profile', '/orders', '/dashboard'
   */
  callbackUrl?: string;

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

const DEFAULT_CALLBACK_URL = '/customer/dashboard';

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
export function LoginButton({
  callbackUrl,
  className,
  variant = 'default',
  size = 'default',
  fullWidth = false,
  showIcon = true,
  children,
  provider,
}: LoginButtonProps) {
  const { login, isLoggingIn, loginError, clearLoginError } = useAuth();

  // Validated once per callbackUrl change — same shared validator used by
  // the login page, register gateway, and ModernAuthUI (sanitize-callback-url.ts),
  // so there is exactly one place that decides what a "safe" redirect looks like.
  const safeCallbackUrl = sanitizeCallbackUrl(callbackUrl, DEFAULT_CALLBACK_URL);

  const handleLogin = useCallback(async () => {
    if (isLoggingIn) return; // Prevent double-clicks
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
    >
      {children || 'Sign In'}
    </Button>
  );

  if (!loginError) {
    return buttonElement;
  }

  return (
    <div className="flex w-full flex-col items-start gap-2">
      {buttonElement}
      {/* Accessible error display — the sole error channel (no duplicate
          toast): a persistent, always-visible role="alert" outlives a
          toast's auto-dismiss timer and avoids two live regions announcing
          the same message. Retrying is just clicking the button again. */}
      <p role="alert" aria-live="assertive" className="text-destructive mt-1 text-sm font-medium">
        {loginError.message}
      </p>
    </div>
  );
}
