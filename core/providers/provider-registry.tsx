'use client';

import React, { type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import type { Session } from 'next-auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/core/providers/theme-provider';
import NextAuthProvider from '@/core/providers/NextAuthProvider';
import { AuthStateProvider } from '@/domains/auth/hooks/use-auth';
import { AppIntegrationsInitializer } from './app-integrations-initializer';
import { CartSyncListener } from './cart-sync-listener';
import { AnalyticsProvider } from '@/core/providers/analytics-provider';
import { I18nProvider } from '@/core/i18n';
import { FeatureFlagProvider } from '@/core/feature-flags';
import { TooltipProvider } from '@/shared/ui/atoms/tooltip';
import { ProviderErrorBoundary } from './provider-error-boundary';
import { type ProviderElement } from './compose-providers';
import { THEME_STORAGE_KEY } from '@/shared/theme/theme-bootstrap';

// Lazy load Accessibility and Network components non-blockingly
const ScreenReaderAnnouncer = dynamic(
  () =>
    import('@/shared/ui/common/screen-reader-announcer').then((mod) => ({
      default: mod.ScreenReaderAnnouncer,
    })),
  { ssr: false }
);

const NetworkStatus = dynamic(
  () => import('@/shared/ui/common/network-status').then((mod) => ({ default: mod.NetworkStatus })),
  { ssr: false }
);

/**
 * AccessibilityAndNetworkWrapper
 * Combines ScreenReaderAnnouncer and NetworkStatus as sibling context hooks.
 */
function AccessibilityAndNetworkWrapper({ children }: { children: ReactNode }) {
  return (
    <>
      <ScreenReaderAnnouncer />
      <NetworkStatus />
      {children}
    </>
  );
}

/**
 * AnalyticsErrorBoundaryWrapper
 * Isolates AnalyticsProvider failure from crashing the entire app.
 */
function AnalyticsErrorBoundaryWrapper({ children }: { children: ReactNode }) {
  return (
    <ProviderErrorBoundary providerName="AnalyticsProvider">
      <AnalyticsProvider>{children}</AnalyticsProvider>
    </ProviderErrorBoundary>
  );
}

/**
 * FeatureFlagErrorBoundaryWrapper
 * Isolates FeatureFlagProvider failure from crashing the entire app.
 */
function FeatureFlagErrorBoundaryWrapper({ children }: { children: ReactNode }) {
  return (
    <ProviderErrorBoundary providerName="FeatureFlagProvider">
      <FeatureFlagProvider>{children}</FeatureFlagProvider>
    </ProviderErrorBoundary>
  );
}

/**
 * getAppProviders
 * Declares the structured hierarchy list of React Context Providers.
 * Order: Outermost (top) to Innermost (bottom).
 */
export function getAppProviders(
  queryClient: QueryClient,
  session: Session | null
): ProviderElement[] {
  return [
    // 1. API Cache Store (Outermost)
    [QueryClientProvider, { client: queryClient }],

    // 2. Dark/Light Theme Manager (Theme transitions: see docs/architecture/theme-system.md)
    [
      ThemeProvider,
      {
        attribute: 'class',
        defaultTheme: 'system',
        enableSystem: true,
        // Shared with the blocking bootstrap script in the root layout.
        // Both must read/write the same key or the pre-paint theme
        // resolution silently stops working.
        storageKey: THEME_STORAGE_KEY,
      },
    ],

    // 3. Authentication Provider (NextAuth) — seeded with the server-fetched
    // session (see app/layout.tsx) so useSession() resolves synchronously on
    // both server and client, instead of updating client-side after mount.
    [NextAuthProvider, { session }],

    // 3b. Domain auth state (useAuth()) — computed once here, shared via
    // context by every consumer. Must be inside NextAuthProvider, since it
    // depends on useSession().
    AuthStateProvider,

    // 4. Client-side Legacy Integrations Window Binding
    AppIntegrationsInitializer,

    // 5. Cross-device Cart Sync (single app-wide WebSocket subscription —
    // see cart-sync-listener.tsx for why this must not live inside useCart()
    // itself). Depends on useSession(), so must stay inside NextAuthProvider.
    CartSyncListener,

    // 6. Analytics Integration (Isolated)
    AnalyticsErrorBoundaryWrapper,

    // 7. Dynamic Accessibility Announcer & Network Status
    AccessibilityAndNetworkWrapper,

    // 8. Feature Flag Engine (Isolated)
    FeatureFlagErrorBoundaryWrapper,

    // 9. Multi-lingual Translation Provider
    I18nProvider,

    // 10. Radix Tooltip Primitives (Innermost)
    TooltipProvider,
  ];
}
