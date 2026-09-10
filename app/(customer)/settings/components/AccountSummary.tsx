'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/shared/ui/atoms/card';
import { Button } from '@/shared/ui/atoms/button';
import { Badge } from '@/shared/ui/atoms/badge';
import { ShieldCheck, ArrowRight, Calendar, User } from 'lucide-react';
import { APP_ROUTES } from '@/shared/routes';
import type { UserAccountSummary } from './types';

interface AccountSummaryProps {
  user: UserAccountSummary;
}

export function AccountSummary({ user }: AccountSummaryProps) {
  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  return (
    <Card className="overflow-hidden border border-border/60 bg-gradient-to-r from-card via-card to-muted/20 shadow-xs">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Identity Info */}
          <div className="flex items-center gap-3.5">
            {/* Avatar with status indicator */}
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold text-base shadow-2xs">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="h-full w-full rounded-xl object-cover"
                />
              ) : (
                <span>{initials}</span>
              )}
              <span
                className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-background"
                title="Active account"
              />
            </div>

            {/* Name, Email, Role */}
            <div className="space-y-0.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground truncate">
                  {user.name || user.username || 'Valued Customer'}
                </h1>
                <Badge variant="secondary" className="text-[11px] font-medium px-2 py-0">
                  {user.role || 'Customer'}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1 truncate">
                  {user.email}
                  {user.isEmailVerified ? (
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" title="Email verified" />
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400 font-medium">(Unverified)</span>
                  )}
                </span>

                {user.memberSince && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-muted-foreground/80">
                    <Calendar className="h-3 w-3" />
                    Member since {user.memberSince}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Manage Profile Link */}
          <div className="shrink-0 pt-2 sm:pt-0 border-t border-border/40 sm:border-t-0 flex items-center justify-end">
            <Button asChild variant="outline" size="sm" className="gap-1.5 h-9 font-medium shadow-2xs">
              <Link href={APP_ROUTES.ACCOUNT.PROFILE}>
                <User className="h-3.5 w-3.5" />
                Manage Profile
                <ArrowRight className="h-3.5 w-3.5 ml-0.5" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
