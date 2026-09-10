'use client';

import React from 'react';
import { type LucideIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/atoms/card';
import { cn } from '@/shared/utils';

export interface SettingsSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  id?: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  badge?: React.ReactNode;
  headerAction?: React.ReactNode;
  variant?: 'default' | 'destructive' | 'subtle';
  children: React.ReactNode;
  contentClassName?: string;
}

/**
 * Enterprise SettingsSection Primitive
 *
 * Provides standardized containment, subtle border hierarchy, WCAG anchor
 * scroll offsets, and semantic heading accessibility across all settings domains.
 */
export const SettingsSection = React.forwardRef<HTMLDivElement, SettingsSectionProps>(
  function SettingsSection(
    {
      id,
      title,
      description,
      icon: Icon,
      badge,
      headerAction,
      variant = 'default',
      children,
      className,
      contentClassName,
      ...props
    },
    ref
  ) {
    const headingId = id ? `${id}-heading` : undefined;

    const variantStyles = {
      default: 'border border-border/60 bg-card/90 shadow-xs hover:border-border/90',
      destructive:
        'border border-destructive/30 bg-destructive/[0.03] dark:bg-destructive/[0.06] shadow-xs',
      subtle: 'border border-border/40 bg-muted/20 shadow-none',
    };

    const titleColor = {
      default: 'text-foreground',
      destructive: 'text-destructive',
      subtle: 'text-foreground',
    };

    const iconColor = {
      default: 'text-primary',
      destructive: 'text-destructive',
      subtle: 'text-muted-foreground',
    };

    return (
      <section
        id={id}
        ref={ref}
        aria-labelledby={headingId}
        className={cn('scroll-mt-[calc(var(--header-height,4rem)+1.5rem)]', className)}
        {...props}
      >
        <Card
          className={cn(
            'overflow-hidden rounded-xl transition-all duration-200',
            variantStyles[variant]
          )}
        >
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <CardTitle
                  id={headingId}
                  className={cn(
                    'flex items-center gap-2.5 text-lg font-semibold tracking-tight',
                    titleColor[variant]
                  )}
                >
                  {Icon && (
                    <span
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60',
                        iconColor[variant]
                      )}
                      aria-hidden="true"
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                  )}
                  <span>{title}</span>
                  {badge}
                </CardTitle>
                {description && (
                  <CardDescription className="text-xs text-muted-foreground sm:text-sm leading-relaxed">
                    {description}
                  </CardDescription>
                )}
              </div>
              {headerAction && <div className="shrink-0 self-start sm:self-auto">{headerAction}</div>}
            </div>
          </CardHeader>

          <CardContent className={cn('pt-0 space-y-4', contentClassName)}>{children}</CardContent>
        </Card>
      </section>
    );
  }
);

SettingsSection.displayName = 'SettingsSection';
