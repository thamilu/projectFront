/**
 * Providers Component
 */

'use client';

import { useMemo, Suspense, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import type { Session } from 'next-auth';
import { ErrorBoundary } from '@/shared/ui/feedback/error-boundary';
import { getQueryClient } from '@/core/providers/query-client';
import { ComposeProviders } from '@/core/providers/compose-providers';
import { getAppProviders } from '@/core/providers/provider-registry';
import { useProviderTelemetry } from '@/core/providers/provider-telemetry';
import { ToastSetup } from '@/core/providers/toast-setup';
import { ProviderLoadingFallback } from '@/core/providers/provider-loading-fallback';
import { ThemeShortcutListener } from '@/core/providers/theme-shortcut-listener';

const ReactQueryDevtools = dynamic(
  () =>
    import('@tanstack/react-query-devtools').then((mod) => ({
      default: mod.ReactQueryDevtools,
    })),
  { ssr: false }
);

interface ProvidersProps {
  children: ReactNode;
  /** Server-fetched session (see app/layout.tsx) — seeds NextAuthProvider. */
  session: Session | null;
}

export function Providers({ children, session }: ProvidersProps) {
  // Memoize QueryClient to keep the reference stable
  const qc = useMemo(() => getQueryClient(), []);

  // Log and trace client-side initialization health
  useProviderTelemetry();

  // Memoize the provider list to prevent unnecessary unmount/remount cycles
  const providersConfig = useMemo(() => getAppProviders(qc, session), [qc, session]);

  return (
    <ErrorBoundary name="GlobalProvidersErrorBoundary">
      {/* Global toast notification system (renders overlay outside providers but inside boundary) */}
      <ToastSetup />

      {/* Composed application-level context providers */}
      <ComposeProviders providers={providersConfig}>
        {/* Global theme shortcut listener (Ctrl+Shift+L) */}
        <ThemeShortcutListener />

        {/* Support loading state boundaries for dynamic nested components */}
        <Suspense fallback={<ProviderLoadingFallback />}>{children}</Suspense>

        {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
      </ComposeProviders>
    </ErrorBoundary>
  );
}
