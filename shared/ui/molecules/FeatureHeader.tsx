import React from 'react';
import { cn } from '@/shared/utils';
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
    <div
      className={cn(
        'mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-center',
        className
      )}
    >
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="bg-primary/10 text-primary rounded-xl p-2">
              <Icon className="h-5 w-5" />
            </div>
          )}
          <h1 className="text-4xl leading-none font-black tracking-tighter text-white uppercase italic md:text-5xl">
            {title}
          </h1>
        </div>
        {subtitle && (
          <p className="text-muted-foreground pl-1 text-sm font-medium tracking-[0.25em] uppercase">
            {subtitle}
          </p>
        )}
      </div>

      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}
