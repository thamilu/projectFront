import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/atoms/card';
import { cn } from '@/shared/utils';

interface PremiumCardProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  gradientClassName?: string;
  headerAction?: React.ReactNode;
}

/**
 * A premium-styled card with a gradient accent bar, backdrop blur, and refined shadows.
 * Implements the E-Shop design language for high-importance interfaces.
 */
export function PremiumCard({
  children,
  title,
  description,
  icon,
  className,
  headerClassName,
  contentClassName,
  gradientClassName,
  headerAction,
}: PremiumCardProps) {
  return (
    <Card className={cn(
      "border-none shadow-2xl bg-background/50 backdrop-blur-md overflow-hidden animate-in fade-in zoom-in duration-500",
      className
    )}>
      {/* Accent Bar */}
      <div className={cn("h-2 bg-linear-to-r from-primary to-primary/40", gradientClassName)} />
      
      {(title || description || icon) && (
        <CardHeader className={cn("pb-4", headerClassName)}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {icon && (
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary shadow-inner">
                  {icon}
                </div>
              )}
              <div className="space-y-1">
                {title && <CardTitle className="text-2xl font-bold tracking-tight">{title}</CardTitle>}
                {description && <CardDescription className="text-base leading-relaxed">{description}</CardDescription>}
              </div>
            </div>
            {headerAction && (
              <div className="flex-shrink-0">
                {headerAction}
              </div>
            )}
          </div>
        </CardHeader>
      )}
      
      <CardContent className={cn("pt-4", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}
