import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface FeatureHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * A standardized header for features, implementing the enterprise "Black Italic" typography
 * and refined spacing conventions.
 */
export function FeatureHeader({
  title,
  subtitle,
  icon: Icon,
  actions,
  className,
}: FeatureHeaderProps) {
  return (
    <div className={cn("flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10", className)}>
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
          )}
          <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter text-white uppercase leading-none">
            {title}
          </h1>
        </div>
        {subtitle && (
          <p className="text-muted-foreground text-sm font-medium uppercase tracking-[0.25em] pl-1">
            {subtitle}
          </p>
        )}
      </div>
      
      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}
