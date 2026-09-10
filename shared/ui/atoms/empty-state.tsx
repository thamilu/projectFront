'use client';

import * as React from 'react';
import { cn } from '@/shared/utils';
import { Button } from './button';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const EmptyStateComponent = React.forwardRef<HTMLDivElement, EmptyStateProps>(function EmptyState(
  { icon, title, description, action, className, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn(
        'border-border bg-card text-card-foreground flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center',
        className
      )}
      {...props}
    >
      {icon && <div className="text-muted-foreground mb-4">{icon}</div>}
      <h3 className="mb-2 text-lg font-semibold tracking-tight">{title}</h3>
      {description && (
        <p className="text-muted-foreground mb-4 max-w-sm text-sm leading-relaxed">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} variant="outline" size="sm">
          {action.label}
        </Button>
      )}
    </div>
  );
});

EmptyStateComponent.displayName = 'EmptyState';

export const EmptyState = React.memo(EmptyStateComponent);
EmptyState.displayName = 'EmptyState';
