import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/shared/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Premium Breadcrumb navigation component.
 * Features elegant hover transitions and WCAG-compliant active state semantics.
 */
export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        'mb-4 flex items-center',
        className
      )}
    >
      <ol className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-xs sm:text-sm">
        <li className="flex items-center">
          <Link
            href="/"
            className="hover:text-primary focus-visible:outline-primary flex items-center gap-1.5 rounded-xs transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2"
            aria-label="Home"
          >
            <Home className="h-4 w-4" />
            <span className="sr-only">Home</span>
          </Link>
        </li>

        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            <ChevronRight
              className="text-muted-foreground/60 h-4 w-4 shrink-0"
              aria-hidden="true"
            />
            {item.href ? (
              <Link
                href={item.href}
                className="hover:text-primary focus-visible:outline-primary rounded-xs transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-foreground font-semibold" aria-current="page">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export { BreadcrumbSkeleton } from '@/shared/ui/skeletons/breadcrumb-skeleton';
export type { BreadcrumbSkeletonProps } from '@/shared/ui/skeletons/breadcrumb-skeleton';
