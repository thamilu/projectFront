'use client';

import { useCallback } from 'react';
import { LogOut } from 'lucide-react';
import { Button, type ButtonProps } from '@/shared/ui/atoms/button';
import { useAuth } from '@/domains/auth/hooks/use-auth';

interface LogoutButtonProps {
  variant?: ButtonProps['variant'];
  /**
   * 'icon' is intentionally excluded — this button always renders visible
   * text (children || 'Sign Out'), matching LoginButtonProps['size'].
   */
  size?: Exclude<ButtonProps['size'], 'icon'>;
  showIcon?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const LOGOUT_ERROR_MESSAGE_ID = 'logout-button-error-message';

/**
 * Enterprise Logout Button
 *
 * Uses the consolidated useAuth hook for consistent logout behavior across
 * the application. isLoggingOut/logoutError are the hook's own tracked
 * state (use-auth.tsx), not reimplemented locally: logout() never throws
 * and always resets isLoggingOut via its own internal finally block, so a
 * failed or slow sign-out can't leave this button permanently stuck —
 * unlike a prior version of this component, which used local useState and
 * never reset it on failure.
 */
export function LogoutButton({
  variant = 'ghost',
  size = 'default',
  showIcon = true,
  className,
  children,
}: LogoutButtonProps) {
  const { logout, isLoggingOut, logoutError, clearLogoutError } = useAuth();

  const handleLogout = useCallback(async () => {
    // Belt-and-suspenders: the Button atom's own `loading` state already
    // disables the native element while true, same rationale as
    // LoginButton's equivalent guard.
    if (isLoggingOut) return;
    clearLogoutError();
    await logout();
  }, [isLoggingOut, logout, clearLogoutError]);

  const buttonElement = (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleLogout}
      loading={isLoggingOut}
      loadingText="Signing out..."
      className={className}
      leftIcon={showIcon ? <LogOut aria-hidden="true" /> : undefined}
      aria-describedby={logoutError ? LOGOUT_ERROR_MESSAGE_ID : undefined}
    >
      {children || 'Sign Out'}
    </Button>
  );

  // Wrapper is always rendered (not swapped in only on error) so the DOM
  // shape never shifts at the exact moment an error appears — same
  // reasoning as LoginButton.
  return (
    <div className="flex flex-col items-start gap-2">
      {buttonElement}
      {logoutError && (
        <p
          id={LOGOUT_ERROR_MESSAGE_ID}
          role="alert"
          aria-live="assertive"
          className="text-destructive text-sm font-medium"
        >
          {logoutError.message}
        </p>
      )}
    </div>
  );
}
