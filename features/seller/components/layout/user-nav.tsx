// ============================================================
// features/seller/components/layout/user-nav.tsx
//
// Ultra Enterprise Grade UserNav Component
// Implements: keyboard shortcuts, logout loading/error states,
// ARIA accessibility, analytics telemetry, full memoization.
// ============================================================

'use client';

import { memo, useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { LogOut, Settings, User, Loader2, AlertCircle, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/atoms/avatar';
import { Button } from '@/shared/ui/atoms/button';
import { Skeleton } from '@/shared/ui/atoms/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/shared/ui/atoms/dropdown-menu';
import { useAuth } from '@/domains/auth/hooks/use-auth';
import { APP_ROUTES } from '@/shared/routes';
import { trackEvent } from '@/core/providers/analytics-provider';
import { logger } from '@/core/telemetry/logger';
import { deriveInitials, isValidAvatarUrl, hashUserId } from '@/shared/utils';
import { useUserNavShortcuts } from '../../hooks/use-user-nav-shortcuts';

// ─── Constants ───────────────────────────────────────────────

const LOGOUT_TIMEOUT_MS = 10000;

// ─── Sub-components ──────────────────────────────────────────

interface LogoutErrorBannerProps {
  message: string;
}

/**
 * Inline error banner rendered beneath the logout item when
 * the logout operation fails.
 */
const LogoutErrorBanner = memo(function LogoutErrorBanner({
  message,
}: LogoutErrorBannerProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-destructive"
    >
      <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
});

/**
 * Skeleton loader for the UserNav component to prevent layout shift during authentication loading.
 */
export const UserNavSkeleton = memo(function UserNavSkeleton() {
  return (
    <Skeleton
      rounded="full"
      className="h-8 w-8 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    />
  );
});

// ─── Main Component ──────────────────────────────────────────

/**
 * UserNav
 *
 * Dropdown navigation component for the authenticated seller.
 *
 * Features:
 * - Avatar with name-derived initials fallback (Unicode/Emoji safe)
 * - Profile & Settings navigation links with dynamic route awareness (aria-current)
 * - Logout with 10s timeout, failure recovery, and success notifications
 * - Functional keyboard shortcuts: Shift+Meta+P, Meta+S, Shift+Meta+L
 * - Analytics telemetry with pseudonymized user ID tracking
 * - Full ARIA labelling and screen-reader polite status announcements
 * - Mobile bottom sheet responsive overlay with swipe indicator
 * - Memoised to prevent unnecessary re-renders
 *
 * @example
 * ```tsx
 * <UserNav />
 * ```
 */
export const UserNav = memo(function UserNav(): React.ReactElement | null {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, logout, isLoggingOut, logoutError } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLocalTimeout, setIsLocalTimeout] = useState(false);

  // ── Derived state ─────────────────────────────────────────

  const initials = useMemo(() => deriveInitials(user?.name), [user?.name]);

  const imageSrc = useMemo(
    () => (isValidAvatarUrl(user?.image) ? user?.image ?? undefined : undefined),
    [user?.image]
  );

  const isLoggingOutActive = isLoggingOut && !isLocalTimeout;

  const errorToShow = isLocalTimeout
    ? 'Sign out timed out. Please check your connection and try again.'
    : logoutError
      ? 'Sign out failed. Please try again.'
      : null;

  // Platform-aware keyboard shortcut symbols
  const isMac = typeof window !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.platform);
  const profileShortcut = isMac ? '⇧⌘P' : 'Shift+Ctrl+P';
  const settingsShortcut = isMac ? '⌘S' : 'Ctrl+S';
  const logoutShortcut = isMac ? '⇧⌘L' : 'Shift+Ctrl+L';

  // ── Handlers ─────────────────────────────────────────────

  const handleLogout = useCallback(async () => {
    setIsLocalTimeout(false);
    try {
      trackEvent('user_nav_logout_clicked', { userId: hashUserId(user?.id) });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Logout timed out')), LOGOUT_TIMEOUT_MS)
      );
      await Promise.race([logout(), timeoutPromise]);
      logger.info('UserNav: logout completed successfully');
      toast.success('Successfully logged out.');
      setIsOpen(false);
    } catch (err) {
      if (err instanceof Error && err.message === 'Logout timed out') {
        setIsLocalTimeout(true);
      }
      logger.error('UserNav: logout failed unexpectedly', {
        error: err instanceof Error ? err : new Error(String(err)),
      });
    }
  }, [logout, user?.id]);

  const handleProfileClick = useCallback(() => {
    trackEvent('user_nav_profile_clicked', { userId: hashUserId(user?.id) });
    setIsOpen(false);
  }, [user?.id]);

  const handleSettingsClick = useCallback(() => {
    trackEvent('user_nav_settings_clicked', { userId: hashUserId(user?.id) });
    setIsOpen(false);
  }, [user?.id]);

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (open) {
      trackEvent('user_nav_dropdown_opened');
    }
  }, []);

  // ── Keyboard shortcuts ────────────────────────────────────

  const handleShortcutProfile = useCallback(() => {
    trackEvent('user_nav_shortcut_profile');
    router.push(APP_ROUTES.SELLER.PROFILE);
  }, [router]);

  const handleShortcutSettings = useCallback(() => {
    trackEvent('user_nav_shortcut_settings');
    router.push(APP_ROUTES.SELLER.SETTINGS);
  }, [router]);

  const handleShortcutLogout = useCallback(() => {
    trackEvent('user_nav_shortcut_logout');
    void handleLogout();
  }, [handleLogout]);

  useUserNavShortcuts({
    onProfile: handleShortcutProfile,
    onSettings: handleShortcutSettings,
    onLogout: handleShortcutLogout,
    enabled: !!user,
  });

  // ── Guard: loading / unauthenticated ──────────────────────

  if (isLoading) {
    return <UserNavSkeleton />;
  }

  if (!user) {
    return null;
  }

  // ── Render ────────────────────────────────────────────────

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      {/* ── Trigger ── */}
      <DropdownMenuTrigger asChild>
        <Button
          id="user-nav-trigger"
          variant="ghost"
          className="relative flex items-center h-10 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          aria-label={`User menu for ${user.name ?? 'your account'}`}
          aria-expanded={isOpen}
          aria-haspopup="menu"
        >
          <div className="relative h-7 w-7 shrink-0">
            <Avatar className="h-7 w-7">
              <AvatarImage
                src={imageSrc}
                alt={user.name ? `${user.name}'s avatar` : 'User avatar'}
                fetchPriority="high"
              />
              <AvatarFallback aria-hidden="true" className="text-[10px] font-bold">{initials}</AvatarFallback>
            </Avatar>
            {/* Online status indicator */}
            <span className="absolute bottom-[-1px] right-[-1px] block h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-background dark:border-slate-900" />
          </div>
          <ChevronDown className="h-3 w-3 text-muted-foreground opacity-60 ml-1.5" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>

      {/* ── Content ── */}
      <DropdownMenuContent
        className="min-w-[14rem] max-w-xs max-sm:!fixed max-sm:!bottom-0 max-sm:!left-0 max-sm:!right-0 max-sm:!top-auto max-sm:!translate-y-0 max-sm:!w-full max-sm:!max-w-none max-sm:!rounded-t-2xl max-sm:!rounded-b-none max-sm:shadow-xl max-sm:border max-sm:border-border max-sm:p-4"
        align="end"
        role="menu"
        aria-label="User account menu"
      >
        {/* Drag handle line at top for mobile bottom sheet appearance */}
        <div className="mx-auto my-1.5 h-1.5 w-12 rounded-full bg-muted sm:hidden" />

        {/* User identity header */}
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm leading-tight font-medium truncate" aria-label="Display name">
              {user.name}
            </p>
            <p
              className="text-muted-foreground text-xs leading-tight truncate"
              aria-label="Email address"
            >
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Navigation group */}
        <DropdownMenuGroup>
          <DropdownMenuItem asChild className="py-3 sm:py-1.5">
            <Link
              id="user-nav-profile-link"
              href={APP_ROUTES.SELLER.PROFILE}
              aria-label={`Go to your profile (${profileShortcut})`}
              aria-current={pathname === APP_ROUTES.SELLER.PROFILE ? 'page' : undefined}
              onClick={handleProfileClick}
            >
              <User className="mr-2 h-4 w-4" aria-hidden="true" />
              <span>Profile</span>
              <DropdownMenuShortcut aria-hidden="true">{profileShortcut}</DropdownMenuShortcut>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild className="py-3 sm:py-1.5">
            <Link
              id="user-nav-settings-link"
              href={APP_ROUTES.SELLER.SETTINGS}
              aria-label={`Go to settings (${settingsShortcut})`}
              aria-current={pathname === APP_ROUTES.SELLER.SETTINGS ? 'page' : undefined}
              onClick={handleSettingsClick}
            >
              <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
              <span>Settings</span>
              <DropdownMenuShortcut aria-hidden="true">{settingsShortcut}</DropdownMenuShortcut>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Logout */}
        <DropdownMenuItem
          id="user-nav-logout-btn"
          onClick={handleLogout}
          disabled={isLoggingOutActive}
          aria-label={isLoggingOutActive ? 'Signing out…' : `Sign out (${logoutShortcut})`}
          aria-busy={isLoggingOutActive}
          className="focus:text-destructive py-3 sm:py-1.5"
        >
          {isLoggingOutActive ? (
            <Loader2
              className="mr-2 h-4 w-4 animate-spin text-muted-foreground"
              aria-hidden="true"
            />
          ) : (
            <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
          )}
          <span>{isLoggingOutActive ? 'Signing out…' : 'Log out'}</span>
          {!isLoggingOutActive && (
            <DropdownMenuShortcut aria-hidden="true">{logoutShortcut}</DropdownMenuShortcut>
          )}
        </DropdownMenuItem>

        {/* Screen Reader live announcements for state transitions */}
        <span className="sr-only" aria-live="polite" aria-atomic="true">
          {isLoggingOutActive ? 'Signing out, please wait.' : ''}
        </span>

        {/* Logout error feedback */}
        {errorToShow && (
          <LogoutErrorBanner message={errorToShow} />
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

