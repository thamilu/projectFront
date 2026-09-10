'use client';

/**
 * SellerGuard - Centralized route protection component for sellers.
 * Pure presentational / session-sync recovery component.
 * Real edge-level redirects are executed by the edge middleware.
 */

import { memo, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/domains/auth/hooks/use-auth';
import { useSellerGuard } from '@/features/seller/hooks/useSellerGuard';
import { useI18n } from '@/core/i18n';

interface SellerGuardProps {
  children: React.ReactNode;
}

export const SellerGuard = memo(function SellerGuard({ children }: SellerGuardProps) {
  const { t } = useI18n();
  const { user, isLoading: isAuthLoading, isAuthenticated } = useAuth();
  const pathname = usePathname();

  const roles = useMemo(() => (user?.roles ?? []).map((r) => r.toUpperCase()), [user?.roles]);

  const isOnboardPath = pathname?.startsWith('/seller/register') ?? false;

  useSellerGuard({
    isAuthLoading,
    isAuthenticated,
    roles,
    isOnboardPath,
    pathname,
  });

  if (isOnboardPath) {
    return <>{children}</>;
  }

  if (isAuthLoading) {
    return (
      <div
        role="status"
        aria-label={t('sellerGuard.loading.ariaLabel')}
        aria-live="polite"
        className="flex min-h-96 flex-col items-center justify-center gap-4"
        data-testid="seller-guard-loading"
      >
        <Loader2 className="text-primary h-10 w-10 animate-spin" aria-hidden="true" />
        <p className="text-muted-foreground animate-pulse font-medium">
          {t('sellerGuard.loading.message')}
        </p>
      </div>
    );
  }

  return <div data-testid="seller-guard-authorized">{children}</div>;
});

SellerGuard.displayName = 'SellerGuard';
