import type { ComponentType } from 'react';
import { Suspense } from 'react';
import { SectionReveal } from './SectionReveal';
import { ErrorBoundary } from '@/shared/ui/error-boundary';
import type { SectionPriority } from '@/types/home';

interface HomeSectionProps<TComponentProps = unknown, TErrorProps = unknown> {
  readonly index: number;
  readonly id: string;
  readonly priority?: SectionPriority | 'immediate';
  readonly ariaLabel: string;
  readonly Component: ComponentType<TComponentProps>;
  readonly componentProps?: TComponentProps;
  readonly Skeleton: ComponentType;
  readonly ErrorFallback: ComponentType<TErrorProps>;
  readonly errorFallbackProps?: TErrorProps;
}

/**
 * Unified home page section component.
 * Uses server Suspense for streaming — avoids client ResilientSection hydration overhead.
 *
 * Each section is isolated behind its own ErrorBoundary: a render error in one
 * section (e.g. CategorySection) degrades to that section's own ErrorFallback
 * instead of taking down the rest of the homepage. No `onError` callback is
 * passed down here deliberately — HomeSection is a Server Component, and a
 * plain closure can't cross the server/client boundary into the ErrorBoundary
 * Client Component; ErrorBoundary already logs the caught error itself.
 */
export function HomeSection<TComponentProps = unknown, TErrorProps = unknown>({
  index,
  id,
  priority = 'low',
  ariaLabel,
  Component,
  componentProps,
  Skeleton,
  ErrorFallback,
  errorFallbackProps,
}: HomeSectionProps<TComponentProps, TErrorProps>) {
  return (
    <SectionReveal index={index} priority={priority}>
      <section id={id} aria-label={ariaLabel} data-testid={`section-${id}`}>
        <ErrorBoundary
          fallback={
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            <ErrorFallback {...((errorFallbackProps ?? {}) as any)} />
          }
        >
          <Suspense fallback={<Skeleton />}>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <Component {...((componentProps ?? {}) as any)} />
          </Suspense>
        </ErrorBoundary>
      </section>
    </SectionReveal>
  );
}
