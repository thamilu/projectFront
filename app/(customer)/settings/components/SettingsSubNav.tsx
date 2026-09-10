'use client';

import React from 'react';
import { Palette, Bell, Lock, Globe, Shield, AlertTriangle } from 'lucide-react';
import { cn } from '@/shared/utils';
import type { SettingsSectionId } from './types';

export interface SettingsNavItem {
  id: SettingsSectionId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  isDestructive?: boolean;
}

export const SETTINGS_NAV_ITEMS: SettingsNavItem[] = [
  {
    id: 'appearance',
    label: 'Theme & Display',
    icon: Palette,
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
  },
  {
    id: 'security',
    label: 'Security & Access',
    icon: Lock,
  },
  {
    id: 'regional',
    label: 'Language & Region',
    icon: Globe,
  },
  {
    id: 'privacy',
    label: 'Privacy & Governance',
    icon: Shield,
  },
  {
    id: 'danger-zone',
    label: 'Danger Zone',
    icon: AlertTriangle,
    isDestructive: true,
  },
];

interface SettingsSubNavProps {
  activeSection: SettingsSectionId;
  onSelectSection: (section: SettingsSectionId) => void;
  className?: string;
}

export function SettingsSubNav({
  activeSection,
  onSelectSection,
  className,
}: SettingsSubNavProps) {
  return (
    <div className={cn('w-full md:w-64 md:shrink-0 md:sticky md:top-[calc(var(--header-height,4rem)+1.5rem)] md:self-start', className)}>
      {/* Mobile Segmented Horizontal Navigation (Phones <768px) */}
      <nav
        aria-label="Settings navigation mobile"
        className="flex md:hidden w-full overflow-x-auto no-scrollbar py-2 -mx-4 px-4 bg-background/95 border-b border-border/40"
      >
        <div className="flex items-center gap-1.5 min-w-max">
          {SETTINGS_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectSection(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium min-h-[40px] transition-colors',
                  isActive
                    ? item.isDestructive
                      ? 'bg-destructive text-destructive-foreground font-semibold shadow-xs'
                      : 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Desktop / Tablet Vertical Sidebar Side Pane (>=768px) */}
      <aside className="hidden md:block w-full">
        <nav
          aria-label="Settings navigation"
          className="space-y-1 py-1"
        >
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
            Settings Navigation
          </div>

          <div className="space-y-0.5">
            {SETTINGS_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectSection(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'w-full group flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 text-left',
                    isActive
                      ? item.isDestructive
                        ? 'bg-destructive/10 text-destructive font-semibold border-l-2 border-destructive shadow-2xs'
                        : 'bg-primary/10 text-primary font-semibold border-l-2 border-primary shadow-2xs'
                      : item.isDestructive
                        ? 'text-muted-foreground hover:bg-destructive/5 hover:text-destructive'
                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={cn(
                        'h-4 w-4 shrink-0 transition-colors',
                        isActive
                          ? item.isDestructive
                            ? 'text-destructive'
                            : 'text-primary'
                          : 'text-muted-foreground group-hover:text-foreground'
                      )}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className="rounded-full bg-primary/15 text-primary text-[10px] font-semibold px-1.5 py-0.5">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </aside>
    </div>
  );
}
