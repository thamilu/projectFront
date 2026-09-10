'use client';

import { useEffect, type ReactNode } from 'react';
import { useAppIntegrations } from '@/shared/hooks';
import '@/core/integrations/legacy-bridge.types';

interface AppIntegrationsInitializerProps {
  children: ReactNode;
}

/**
 * AppIntegrationsInitializer
 * Safely registers legacy client-side integration bindings on window.
 * Removes bindings on unmount to prevent memory leaks.
 */
export function AppIntegrationsInitializer({ children }: AppIntegrationsInitializerProps) {
  const { trackPurchase } = useAppIntegrations();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Mount on standard __legacy namespace
    window.__legacy = window.__legacy || {};
    window.__legacy.trackPurchase = trackPurchase;

    // Retain legacy root-level property for backwards compatibility with third-party pixels
    (window as any).trackPurchase = trackPurchase;

    return () => {
      if (window.__legacy) {
        delete window.__legacy.trackPurchase;
      }
      delete (window as any).trackPurchase;
    };
  }, [trackPurchase]);

  return <>{children}</>;
}
