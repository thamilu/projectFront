/**
// ============================================================
// features/auth/components/ui/login-button.tsx
// Login trigger component consuming useAuth hook.
// Handles AuthResult — no raw error propagation to the DOM.
// ============================================================
 */

'use client';

import { useCallback, useMemo, useEffect } from 'react';
import { Button, type ButtonProps } from '@/shared/ui/atoms/button';
import { LogIn, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/shared/utils';
import { logger } from '@/core/telemetry/logger';
import { useAuth } from '../../hooks/use-auth';
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
   * @default '/dashboard'
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
   * Button size
   * @default 'default'
   */
  size?: ButtonProps['size'];

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

// =============================================================================
// Helpers
// =============================================================================

/**
 * Validates callback URL to prevent open redirect attacks.
 * Only allows same-origin relative paths starting with /
 *
 * Security: OWASP A01:2021 - Broken Access Control
 *
 * @param url - The callback URL to validate
 * @returns Validated safe URL or default dashboard
 */
function validateCallbackUrl(url: string | undefined): string {
  const DEFAULT_URL = '/customer/dashboard';

  if (!url) return DEFAULT_URL;

  try {
    // Only allow relative paths starting with /
    if (!url.startsWith('/')) {
      if (process.env.NODE_ENV !== 'production') {
        logger.warn('[LoginButton] Invalid callback URL (must start with /)', { url });
      }
      return DEFAULT_URL;
    }

    // Prevent protocol-relative URLs (//evil.com)
    if (url.startsWith('//')) {
      if (process.env.NODE_ENV !== 'production') {
        logger.warn('[LoginButton] Blocked protocol-relative URL', { url });
      }
      return DEFAULT_URL;
    }

    // Additional validation: prevent javascript: or data: schemes
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('javascript:') || lowerUrl.includes('data:')) {
      if (process.env.NODE_ENV !== 'production') {
        logger.warn('[LoginButton] Blocked dangerous URL scheme', { url });
      }
      return DEFAULT_URL;
    }

    return url;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      logger.error('[LoginButton] URL validation error', { error: String(error) });
    }
    return DEFAULT_URL;
  }
}

// =============================================================================
// Component
// =============================================================================

/**
 * Enterprise-grade OAuth login button for Keycloak authentication.
 *
 * Initiates OAuth 2.0 flow via authService with proper CSRF protection,
 * loading states, error handling, and security validations.
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

  // Validate and memoize callback URL for security
  const safeCallbackUrl = useMemo(() => validateCallbackUrl(callbackUrl), [callbackUrl]);

  /**
   * Handles OAuth login initiation.
   *
   * CSRF protection and callback-URL preservation are both handled by
   * NextAuth itself (signIn's own CSRF token cookie, and callbackUrl carried
   * through its signed /api/auth/callback/keycloak flow) — this used to also
   * generate its own state/nonce and stash them under 'oauth_state'/
   * 'oauth_nonce' in sessionStorage, but nothing ever read those keys back
   * (leftover from a pre-NextAuth implementation), so they were dead writes
   * masquerading as protection. Likewise the redirect target doesn't need
   * separate storage: safeCallbackUrl is passed straight to login() below,
   * which forwards it through NextAuth's own callbackUrl mechanism.
   */
  const handleLogin = useCallback(async () => {
    if (isLoggingIn) return; // Prevent double-clicks
    clearLoginError();
    await login(safeCallbackUrl, provider);
  }, [isLoggingIn, safeCallbackUrl, login, provider, clearLoginError]);

  // Show sonner toast if error occurs
  useEffect(() => {
    if (loginError) {
      toast.error('Unable to connect to authentication server', {
        description: loginError.message,
        action: {
          label: 'Retry',
          onClick: () => {
            handleLogin();
          },
        },
      });
    }
  }, [loginError, handleLogin]);

  /**
   * Keyboard handler for accessibility
   * Ensures Enter and Space keys trigger login
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleLogin();
      }
    },
    [handleLogin]
  );

  return (
    <div className="flex w-full flex-col items-start gap-2">
      <Button
        type="button"
        onClick={handleLogin}
        onKeyDown={handleKeyDown}
        disabled={isLoggingIn}
        variant={variant}
        size={size}
        className={cn(fullWidth && 'w-full', 'transition-all duration-200', className)}
        aria-busy={isLoggingIn}
        aria-label={
          isLoggingIn
            ? 'Signing in, please wait'
            : children
              ? 'Sign in with Keycloak'
              : 'Sign in with Keycloak SSO'
        }
      >
        {isLoggingIn ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            <span>Connecting...</span>
            {/* Live region for screen readers */}
            <span className="sr-only" role="status" aria-live="polite">
              Connecting to authentication server
            </span>
          </>
        ) : (
          <>
            {showIcon && <LogIn className="mr-2 h-4 w-4" aria-hidden="true" />}
            <span>{children || 'Sign In'}</span>
          </>
        )}
      </Button>

      {/* Accessible error display */}
      {loginError && (
        <p role="alert" aria-live="assertive" className="text-destructive mt-1 text-sm font-medium">
          {loginError.message}
        </p>
      )}
    </div>
  );
}
