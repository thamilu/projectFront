'use client';

import React, { memo } from 'react';
import { ChevronDown, Loader2, Check } from 'lucide-react';
import { cn } from '@/shared/utils';
import { Button } from '@/shared/ui/atoms/button';
import { ThemeToggle } from '@/shared/ui/layout/theme-toggle';
import { UserNav } from './user-nav';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/shared/ui/atoms/dropdown-menu';
import { LOCALE_CONFIG, LOCALE_FALLBACK } from '@/core/i18n/locales';
import { HEADER_ACTION_BUTTON_CLASS } from '@/shared/ui/styles/header-action-button';

/**
 * Props for the generic SellerHeaderActions component.
 */
interface SellerHeaderActionsProps {
  locale: string;
  onLocaleChange: (localeCode: string) => void;
  isLocalePending?: boolean;
}

/**
 * SellerHeaderActions - Generic header actions component (locale switcher, theme selector, and user settings navigation).
 * Decoupled from onboarding store state for high reusability across headers.
 */
export const SellerHeaderActions = memo<SellerHeaderActionsProps>(
  function SellerHeaderActions({
    locale,
    onLocaleChange,
    isLocalePending = false,
  }): React.JSX.Element {
    const localeConfig = LOCALE_CONFIG[locale] ?? LOCALE_FALLBACK;
    const currentLocaleName = localeConfig.display;

    return (
      <>
        {/* Discoverable Language Dropdown Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled={isLocalePending}
              className={cn(
                HEADER_ACTION_BUTTON_CLASS,
                'border-slate-200 dark:border-slate-800 bg-transparent text-slate-700 dark:text-slate-350 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-xs font-semibold'
              )}
              aria-label={`${currentLocaleName} — language selector`}
              aria-busy={isLocalePending ? true : undefined}
            >
              {isLocalePending ? (
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" aria-hidden="true" />
              ) : (
                <span className="text-sm mr-1">🌐</span>
              )}
              <span>{isLocalePending ? 'Switching...' : currentLocaleName}</span>
              <ChevronDown className="h-3 w-3 opacity-55 ml-0.5" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {Object.entries(LOCALE_CONFIG).map(([code, config]) => (
              <DropdownMenuItem
                key={code}
                onClick={() => locale !== code && onLocaleChange(code)}
                aria-current={locale === code ? 'true' : undefined}
                className="flex items-center gap-2 cursor-pointer"
              >
                <span>{config.display}</span>
                {locale === code && (
                  <>
                    <Check className="ml-auto h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">(currently selected)</span>
                  </>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <ThemeToggle />
        <UserNav />
      </>
    );
  }
);

SellerHeaderActions.displayName = 'SellerHeaderActions';
