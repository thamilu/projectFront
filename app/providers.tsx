/**
 * Providers Component
 */

'use client';

import { useState, useEffect, type ReactNode, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from '@/core/providers/theme-provider';
import NextAuthProvider from '@/core/providers/NextAuthProvider';
import { ToastProvider } from '@/core/providers/toast-provider';
import { Toaster } from 'sonner';
import { AnalyticsProvider } from '@/core/providers/analytics-provider';
import { ErrorBoundary } from '@/shared/ui/feedback/error-boundary';
import { NetworkStatus } from '@/shared/ui/common/network-status';
import { ScreenReaderAnnouncer } from '@/shared/ui/common/screen-reader-announcer';
import { useAppIntegrations } from '@/shared/hooks';

import { I18nProvider } from '@/core/i18n';
import { FeatureFlagProvider } from '@/core/feature-flags';

interface ProvidersProps {
  children: ReactNode;
}

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: (failureCount, error) => {
          if (error instanceof Error && 'status' in error) {
            const status = (error as { status: number }).status;
            if (status >= 400 && status < 500) return false;
          }
          return failureCount < 2;
        },
        refetchOnWindowFocus: false,
        structuralSharing: true,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === 'undefined') return makeQueryClient();
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

function LegacyIntegrations({ children }: { children: ReactNode }) {
  const { trackPurchase } = useAppIntegrations();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).trackPurchase = trackPurchase;
    }
  }, [trackPurchase]);

  return <>{children}</>;
}

export function Providers({ children }: ProvidersProps) {
  const [qc] = useState(() => getQueryClient());

  return (
    <ErrorBoundary>
      <QueryClientProvider client={qc}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="eshop-theme"
        >
          <NextAuthProvider>
            <LegacyIntegrations>
              <ToastProvider />
              <Suspense fallback={null}>
                <AnalyticsProvider>
                  <ScreenReaderAnnouncer />
                  <NetworkStatus />
                  <FeatureFlagProvider>
                    <I18nProvider>
                      {children}
                    </I18nProvider>
                  </FeatureFlagProvider>
                  <Toaster position="top-right" richColors closeButton />
                  {process.env.NODE_ENV === 'development' && (
                    <ReactQueryDevtools initialIsOpen={false} />
                  )}
                </AnalyticsProvider>
              </Suspense>
            </LegacyIntegrations>
          </NextAuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
