'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Settings as SettingsIcon, LogOut, Sparkles } from 'lucide-react';
import { useI18n } from '@/core/i18n';
import { cn } from '@/shared/utils';
import { Button } from '@/shared/ui/atoms/button';
import { Badge } from '@/shared/ui/atoms/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/atoms/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/shared/ui/atoms/sheet';
import { PRIMARY_NAV_LINKS, UTILITY_NAV_LINKS } from '@/domains/navigation/config/header-navigation.config';
import type { NavigationViewModel } from '@/domains/navigation/contracts/navigation.types';

interface HeaderMobileNavProps {
  navModel: NavigationViewModel;
  mounted: boolean;
  onLogin: () => void;
  onLogout: () => void;
}

export const HeaderMobileNav = React.memo(function HeaderMobileNav({
  navModel,
  mounted,
  onLogin,
  onLogout,
}: HeaderMobileNavProps) {
  const pathname = usePathname();
  const { t } = useI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        aria-label={t('header.aria.openMenu')}
      >
        <Menu className="h-5 w-5" />
      </Button>
    );
  }

  const { identity, customerSections, businessActions, settingsHref, isUserAuthenticated } = navModel;
  const initial = identity?.displayName ? identity.displayName.charAt(0).toUpperCase() : 'U';

  return (
    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-9 w-9 rounded-lg hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary"
          aria-label={t('header.aria.openMenu')}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 sm:w-80 p-0 flex flex-col justify-between">
        <div className="overflow-y-auto p-5 space-y-6">
          {/* Identity Block or Sign In Banner */}
          {isUserAuthenticated && identity ? (
            <div className="flex items-center gap-3 rounded-xl border border-border/80 bg-muted/40 p-3">
              <Avatar className="h-10 w-10 border border-border">
                {identity.avatarUrl && <AvatarImage src={identity.avatarUrl} alt={identity.displayName} />}
                <AvatarFallback className="bg-primary/10 font-bold text-primary">
                  {initial}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col space-y-0.5 overflow-hidden">
                <p className="truncate text-sm font-semibold text-foreground">{identity.displayName}</p>
                <p className="truncate text-xs text-muted-foreground">{identity.email}</p>
                <div className="pt-0.5">
                  <Badge variant={identity.roleBadgeVariant} className="px-1.5 py-0 text-[10px] uppercase">
                    {identity.roleLabel}
                  </Badge>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
              <p className="text-sm font-semibold text-foreground">Welcome to eShop</p>
              <p className="text-xs text-muted-foreground mt-0.5 mb-3">Sign in for personalized recommendations and orders</p>
              <Button
                size="sm"
                className="w-full text-xs font-semibold"
                onClick={() => {
                  handleLinkClick();
                  onLogin();
                }}
              >
                Sign In / Register
              </Button>
            </div>
          )}

          {/* Primary Navigation Links */}
          <div className="space-y-1">
            <div className="px-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Explore
            </div>
            {PRIMARY_NAV_LINKS.map((item) => {
              const isActive = item.href === '/' ? pathname === '/' : pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={handleLinkClick}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Customer Hub (if authenticated) */}
          {isUserAuthenticated && customerSections.length > 0 && (
            <div className="space-y-1 border-t border-border/60 pt-4">
              <div className="px-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                My Account
              </div>
              {customerSections.map((section) =>
                section.items.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={handleLinkClick}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    {item.Icon && <item.Icon className="h-4 w-4 text-muted-foreground" />}
                    <span>{item.label}</span>
                  </Link>
                ))
              )}
            </div>
          )}

          {/* Business Hub Actions */}
          {businessActions.length > 0 && (
            <div className="space-y-1 border-t border-border/60 pt-4">
              <div className="px-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Business & Partners
              </div>
              {businessActions.map((action) => (
                <Link
                  key={action.id}
                  href={action.href}
                  onClick={handleLinkClick}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
                >
                  <span className="flex items-center gap-3">
                    {action.Icon && <action.Icon className="h-4 w-4" />}
                    <span>{action.label}</span>
                  </span>
                  {action.statusBadge === 'active' && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <Sparkles className="h-3 w-3" />
                      Active
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}

          {/* Utility & Settings */}
          <div className="space-y-1 border-t border-border/60 pt-4">
            <div className="px-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Preferences & Help
            </div>
            <Link
              href={settingsHref}
              onClick={handleLinkClick}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <SettingsIcon className="h-4 w-4 text-muted-foreground" />
              <span>Settings</span>
            </Link>
            {UTILITY_NAV_LINKS.map((link) => (
              <Link
                key={link.id}
                href={link.href}
                onClick={handleLinkClick}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                {link.Icon && <link.Icon className="h-4 w-4 text-muted-foreground" />}
                <span>{link.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Footer with Sign Out */}
        {isUserAuthenticated && (
          <div className="border-t border-border/60 p-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                handleLinkClick();
                onLogout();
              }}
              className="w-full justify-center gap-2 text-xs font-medium text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
});
