'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Palette, Sun, Moon, Laptop, Check } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/shared/ui/atoms/radio-group';
import { SettingsSection } from '@/shared/ui/settings';
import { cn } from '@/shared/utils';

export function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = theme || 'system';

  const shortcutBadge = (
    <div className="flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground">
      <span>Shortcut:</span>
      <kbd className="rounded bg-background px-1.5 py-0.5 font-mono text-[11px] font-semibold text-foreground shadow-2xs">
        Ctrl + Shift + L
      </kbd>
    </div>
  );

  return (
    <SettingsSection
      id="appearance"
      title="Appearance"
      description="Customize the visual theme and contrast mode of eShop across your devices"
      icon={Palette}
      headerAction={shortcutBadge}
    >
      <div className="space-y-3">
        {mounted ? (
          <RadioGroup
            value={currentTheme}
            onValueChange={(val) => setTheme(val)}
            className="grid grid-cols-1 gap-3.5 sm:grid-cols-3"
            aria-label="Theme preference"
          >
            {/* Light Option */}
            <label
              htmlFor="theme-option-light"
              className={cn(
                'group relative flex cursor-pointer flex-col justify-between rounded-xl border p-4 transition-all duration-150',
                'hover:border-primary/50 hover:bg-muted/30 focus-within:ring-2 focus-within:ring-primary',
                currentTheme === 'light'
                  ? 'border-primary bg-primary/[0.04] shadow-xs ring-1 ring-primary/20 dark:bg-primary/[0.08]'
                  : 'border-border/60 bg-card'
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                  <Sun className="h-5 w-5" />
                </div>
                <RadioGroupItem
                  value="light"
                  id="theme-option-light"
                  aria-label="Light theme"
                  className="sr-only"
                />
                {currentTheme === 'light' && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xs">
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </div>
              <div className="mt-4">
                <p className="font-semibold text-foreground text-sm">Light</p>
                <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                  Clean interface with bright, high-clarity surfaces
                </p>
              </div>
            </label>

            {/* Dark Option */}
            <label
              htmlFor="theme-option-dark"
              className={cn(
                'group relative flex cursor-pointer flex-col justify-between rounded-xl border p-4 transition-all duration-150',
                'hover:border-primary/50 hover:bg-muted/30 focus-within:ring-2 focus-within:ring-primary',
                currentTheme === 'dark'
                  ? 'border-primary bg-primary/[0.04] shadow-xs ring-1 ring-primary/20 dark:bg-primary/[0.08]'
                  : 'border-border/60 bg-card'
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                  <Moon className="h-5 w-5" />
                </div>
                <RadioGroupItem
                  value="dark"
                  id="theme-option-dark"
                  aria-label="Dark theme"
                  className="sr-only"
                />
                {currentTheme === 'dark' && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xs">
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </div>
              <div className="mt-4">
                <p className="font-semibold text-foreground text-sm">Dark</p>
                <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                  Deep contrast palette optimized for low-light environments
                </p>
              </div>
            </label>

            {/* System Option */}
            <label
              htmlFor="theme-option-system"
              className={cn(
                'group relative flex cursor-pointer flex-col justify-between rounded-xl border p-4 transition-all duration-150',
                'hover:border-primary/50 hover:bg-muted/30 focus-within:ring-2 focus-within:ring-primary',
                currentTheme === 'system'
                  ? 'border-primary bg-primary/[0.04] shadow-xs ring-1 ring-primary/20 dark:bg-primary/[0.08]'
                  : 'border-border/60 bg-card'
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                  <Laptop className="h-5 w-5" />
                </div>
                <RadioGroupItem
                  value="system"
                  id="theme-option-system"
                  aria-label="System theme"
                  className="sr-only"
                />
                {currentTheme === 'system' && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xs">
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </div>
              <div className="mt-4">
                <p className="font-semibold text-foreground text-sm">System</p>
                <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                  Automatically syncs with your operating system preferences
                </p>
              </div>
            </label>
          </RadioGroup>
        ) : (
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
            <div className="h-28 animate-pulse rounded-xl bg-muted/40" />
            <div className="h-28 animate-pulse rounded-xl bg-muted/40" />
            <div className="h-28 animate-pulse rounded-xl bg-muted/40" />
          </div>
        )}
      </div>
    </SettingsSection>
  );
}
