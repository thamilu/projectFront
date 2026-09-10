import React, { type ComponentType, type ReactNode } from 'react';

// Represent a provider as a Component or a [Component, props] tuple.
export type ProviderElement =
  | ComponentType<{ children: ReactNode }>
  | [ComponentType<any>, Record<string, any>];

interface ComposeProvidersProps {
  providers: ProviderElement[];
  children: ReactNode;
}

/**
 * ComposeProviders
 * Reduces an array of providers into a flat, readable component hierarchy.
 * Helps prevent Provider Hell (deep nesting of JSX tags).
 */
export function ComposeProviders({ providers, children }: ComposeProvidersProps) {
  return (
    <>
      {providers.reduceRight((acc, provider) => {
        if (Array.isArray(provider)) {
          const [ProviderComponent, props] = provider;
          return <ProviderComponent {...props}>{acc}</ProviderComponent>;
        }
        const ProviderComponent = provider;
        return <ProviderComponent>{acc}</ProviderComponent>;
      }, children)}
    </>
  );
}
