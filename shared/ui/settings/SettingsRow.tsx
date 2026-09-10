'use client';

import React from 'react';
import { type LucideIcon } from 'lucide-react';
import { cn } from '@/shared/utils';

export interface SettingsRowProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: React.ReactNode;
  icon?: LucideIcon;
  badge?: React.ReactNode;
  control?: React.ReactNode;
  disabled?: boolean;
  highlight?: boolean;
  htmlFor?: string;
  children?: React.ReactNode;
}

/**
 * Enterprise SettingsRow Primitive
 *
 * Implements the standard settings row pattern:
 * ┌─────────────────────────────────────────────────────────────┐
 * │ [Icon] Title [Badge]                       [Control/Switch] │
 * │        Supporting description text                          │
 * └─────────────────────────────────────────────────────────────┘
 */
export const SettingsRow = React.forwardRef<HTMLDivElement, SettingsRowProps>(
  function SettingsRow(
    {
      title,
      description,
      icon: Icon,
      badge,
      control,
      disabled = false,
      highlight = false,
      htmlFor,
      children,
      className,
      ...props
    },
    ref
  ) {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:py-3.5 sm:px-4 rounded-lg',
          'border border-border/30 bg-muted/15 hover:bg-muted/25 transition-colors duration-150',
          highlight && 'border-primary/40 bg-primary/[0.03] dark:bg-primary/[0.06]',
          disabled && 'opacity-60 pointer-events-none',
          className
        )}
        {...props}
      >
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {Icon && (
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background border border-border/60 text-muted-foreground shadow-2xs mt-0.5"
              aria-hidden="true"
            >
              <Icon className="h-4 w-4" />
            </div>
          )}

          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {htmlFor ? (
                <label
                  htmlFor={htmlFor}
                  className="font-medium text-sm text-foreground cursor-pointer select-none"
                >
                  {title}
                </label>
              ) : (
                <span className="font-medium text-sm text-foreground">{title}</span>
              )}
              {badge}
            </div>

            {description && (
              <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
            )}

            {children}
          </div>
        </div>

        {control && (
          <div className="shrink-0 flex items-center justify-end gap-2 pt-2 sm:pt-0 border-t border-border/20 sm:border-t-0">
            {control}
          </div>
        )}
      </div>
    );
  }
);

SettingsRow.displayName = 'SettingsRow';
