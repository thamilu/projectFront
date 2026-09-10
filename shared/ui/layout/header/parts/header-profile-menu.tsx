'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { LogOut, Settings as SettingsIcon, Loader2, Sparkles, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/atoms/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/atoms/avatar';
import { Button } from '@/shared/ui/atoms/button';
import type { NavigationViewModel } from '@/domains/navigation/contracts/navigation.types';

interface HeaderProfileMenuProps {
  navModel: NavigationViewModel;
  mounted: boolean;
  isPending?: boolean;
  onLogin: () => void;
  onLogout: () => void;
}

export const HeaderProfileMenu = React.memo(function HeaderProfileMenu({
  navModel,
  mounted,
  isPending = false,
  onLogin,
  onLogout,
}: HeaderProfileMenuProps) {
  const activeBusinessActions = useMemo(
    () => navModel.businessActions.filter((a) => a.statusBadge === 'active'),
    [navModel.businessActions]
  );

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" aria-label="Loading account menu" disabled className="h-9 w-9">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </Button>
    );
  }

  if (!navModel.isUserAuthenticated || !navModel.identity) {
    return (
      <Button
        variant="default"
        size="sm"
        onClick={onLogin}
        disabled={isPending}
        className="h-9 px-3.5 text-xs font-semibold shadow-xs"
      >
        {isPending ? (
          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
        ) : null}
        Sign In
      </Button>
    );
  }

  const { displayName, email, avatarUrl, roleLabel } = navModel.identity;
  const initial = displayName ? displayName.charAt(0).toUpperCase() : 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-9 items-center gap-1.5 rounded-full px-1.5 hover:bg-muted/80 focus-visible:ring-2 focus-visible:ring-primary"
          aria-label={`Open account menu for ${displayName}`}
        >
          <Avatar className="h-7 w-7 border border-border">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
            <AvatarFallback className="bg-primary/10 font-bold text-primary text-xs">
              {initial}
            </AvatarFallback>
          </Avatar>
          <span className="hidden xl:inline text-xs font-medium text-foreground max-w-20 truncate">
            {displayName.split(' ')[0]}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-56 p-1.5 rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl z-50 opacity-100"
      >
        {/* User Identity Header */}
        <DropdownMenuLabel className="p-2.5 font-normal">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border border-border">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
              <AvatarFallback className="bg-primary/10 font-bold text-primary text-xs">
                {initial}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col space-y-0.5 overflow-hidden min-w-0">
              <p className="truncate text-xs font-bold text-foreground">{displayName}</p>
              {email && <p className="truncate text-[11px] text-muted-foreground">{email}</p>}
              <div className="pt-0.5">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  {roleLabel}
                </span>
              </div>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="my-1" />

        {/* Personal Account Actions */}
        <div className="space-y-0.5">
          {navModel.customerSections.map((section) =>
            section.items.map((item) => (
              <DropdownMenuItem key={item.id} asChild>
                <Link
                  href={item.href}
                  className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted focus:bg-muted transition-colors"
                >
                  {item.Icon && <item.Icon className="h-3.5 w-3.5 text-muted-foreground" />}
                  <span>{item.label}</span>
                </Link>
              </DropdownMenuItem>
            ))
          )}

          {/* Preferences Section: Settings */}
          <DropdownMenuItem asChild>
            <Link
              href={navModel.settingsHref}
              className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted focus:bg-muted transition-colors"
            >
              <SettingsIcon className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
        </div>

        {/* Active Business Hubs (Visible only for active sellers / delivery partners) */}
        {activeBusinessActions.length > 0 && (
          <>
            <DropdownMenuSeparator className="my-1" />
            <div className="space-y-0.5">
              <div className="px-2.5 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Business
              </div>
              {activeBusinessActions.map((action) => (
                <DropdownMenuItem key={action.id} asChild>
                  <Link
                    href={action.href}
                    className="flex cursor-pointer items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/5 focus:bg-primary/5 transition-colors"
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      {action.Icon && <action.Icon className="h-3.5 w-3.5 shrink-0" />}
                      <span className="truncate">{action.label}</span>
                    </span>
                    <span className="flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                      <Sparkles className="h-3 w-3" />
                      Active
                    </span>
                  </Link>
                </DropdownMenuItem>
              ))}
            </div>
          </>
        )}

        <DropdownMenuSeparator className="my-1" />

        {/* Authentication Action: Sign Out */}
        <DropdownMenuItem
          onClick={onLogout}
          disabled={isPending}
          className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 focus:bg-destructive/10 transition-colors"
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <LogOut className="h-3.5 w-3.5" />
          )}
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
