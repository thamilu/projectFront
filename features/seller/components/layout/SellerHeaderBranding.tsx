'use client';

import React, { memo, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/shared/ui/atoms/button';

/**
 * Props for the SellerHeaderBranding component.
 */
interface SellerHeaderBrandingProps {
  isOnboarding?: boolean;
  isWizardFlow?: boolean;
  onExitClick?: () => void;
}

/**
 * SellerHeaderBranding - Presentational component for the logo and the exit navigation actions.
 * Decoupled from onboarding state/Zustand store.
 */
export const SellerHeaderBranding = memo<SellerHeaderBrandingProps>(
  function SellerHeaderBranding({
    isOnboarding = false,
    isWizardFlow = false,
    onExitClick,
  }): React.JSX.Element {
    const handleBackToShopping = useCallback((e: React.MouseEvent) => {
      e.preventDefault();
      onExitClick?.();
    }, [onExitClick]);

    return (
      <div className="flex items-center gap-3 md:gap-4 shrink-0">
        {/* Brand Identity & Logo */}
        <div className="flex items-center gap-2">
          <Link
            href="/"
            aria-label="eShop home"
            onClick={isOnboarding ? (e) => { e.preventDefault(); onExitClick?.(); } : undefined}
            className="bg-gradient-to-r from-indigo-700 to-indigo-600 bg-clip-text text-xl sm:text-2xl font-extrabold tracking-tight text-transparent hover:opacity-90 transition-opacity duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:rounded-sm"
          >
            eShop
          </Link>
          <div className="h-4 w-px bg-border/80" aria-hidden="true" />
          <span className="text-xs font-bold text-muted-foreground tracking-wider uppercase whitespace-nowrap">
            Seller Center
          </span>
        </div>

        {/* Back to Marketplace Action (Landing Onboarding only) */}
        {isOnboarding && !isWizardFlow && (
          <>
            <div className="h-4 w-px bg-border/80" aria-hidden="true" />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToShopping}
              className="group text-muted-foreground hover:text-foreground h-9 px-3 flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              aria-label="Exit — Back to Marketplace"
            >
              <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" aria-hidden="true" />
              <span className="hidden md:inline">Back to Marketplace</span>
              <span className="md:hidden">Exit</span>
            </Button>
          </>
        )}
      </div>
    );
  }
);

SellerHeaderBranding.displayName = 'SellerHeaderBranding';
