import React from 'react';
import { cn } from '@/shared/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

export function PageHeader({
  title,
  description,
  className,
  align = 'center',
}: PageHeaderProps): React.JSX.Element {
  return (
    <header
      className={cn(
        'mb-8 space-y-2',
        {
          'text-left': align === 'left',
          'text-center': align === 'center',
          'text-right': align === 'right',
        },
        className
      )}
    >
      <h1 className="text-foreground text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
      {description && (
        <p className="text-muted-foreground mx-auto max-w-2xl text-xl">{description}</p>
      )}
    </header>
  );
}
