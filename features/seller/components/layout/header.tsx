'use client';

import React, { useCallback, useTransition, memo } from 'react';
import { Search, Menu, Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/shared/ui/atoms/input';
import { Button } from '@/shared/ui/atoms/button';
import { useI18n, Locale } from '@/core/i18n';
import { cn } from '@/shared/utils';
import { useOnboardingStore } from '../../store/onboarding-store';
import { trackEvent } from '@/core/providers/analytics-provider';

// Local Feature Imports
import { useSellerHeaderSearch } from '../../hooks/useSellerHeaderSearch';
import { SellerHeaderBranding } from './SellerHeaderBranding';
import { SellerHeaderProgress } from './SellerHeaderProgress';
import { SellerHeaderActions } from './SellerHeaderActions';
import { OnboardingHeaderActions } from './OnboardingHeaderActions';
import { SellerHeaderExitDialog } from './SellerHeaderExitDialog';
import { MobileSearchDialog } from './mobile-search-dialog';
import { NotificationPopover } from './notification-popover';

interface SellerHeaderProps {
  onMenuClick?: () => void;
  isSidebarOpen?: boolean;
  isOnboarding?: boolean;
  isWizardFlow?: boolean;
}

type HeaderMode = 'default' | 'onboarding' | 'wizard';

/**
 * SellerHeader - Global navigation header component for the seller dashboard context.
 * Refactored to meet Ultra Enterprise Grade specifications.
 * Performs strictly as a layout orchestrator. Contains zero Zustand store bindings.
 */
export const SellerHeader = memo(function SellerHeader({
  onMenuClick,
  isSidebarOpen = false,
  isOnboarding = false,
  isWizardFlow: isWizardFlowProp,
}: SellerHeaderProps): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isWizardFlow = isWizardFlowProp ?? (searchParams?.get('flow') === 'wizard');
  const { locale, setLocale } = useI18n();
  const [isLocalePending, startLocaleTransition] = useTransition();

  // Granular store selectors to minimize re-renders in generic header context
  const isFormDirty = useOnboardingStore((s) => s.isFormDirty);
  const currentStep = useOnboardingStore((s) => s.currentStep);
  const setConfirmExitOpen = useOnboardingStore((s) => s.setConfirmExitOpen);

  const handleExitClick = useCallback(() => {
    try {
      // currentStep is 0-indexed internally; analytics uses 1-indexed step numbers
      trackEvent('seller_onboarding_exit_clicked', { step: currentStep + 1 });
    } catch {
      // Analytics failures must never block navigation
    }

    if (isFormDirty) {
      setConfirmExitOpen(true);
    } else {
      router.push('/');
    }
  }, [isFormDirty, currentStep, setConfirmExitOpen, router]);

  // Strategy pattern: derive headerMode and height token once
  const headerMode: HeaderMode = !isOnboarding
    ? 'default'
    : isWizardFlow
      ? 'wizard'
      : 'onboarding';

  const headerHeight = 'h-14';

  const [isMobileSearchOpen, setIsMobileSearchOpen] = React.useState(false);

  // Hooked-in search logic
  const handleMobileSearchClose = useCallback(() => {
    setIsMobileSearchOpen(false);
  }, []);

  const {
    searchQuery,
    setSearchQuery,
    isPending: isSearchPending,
    searchInputRef,
    shortcutKey,
    handleSearchSubmit,
    handleMobileSearchChange,
  } = useSellerHeaderSearch(handleMobileSearchClose);

  const handleLocaleChange = useCallback((localeCode: string) => {
    startLocaleTransition(() => {
      setLocale(localeCode as Locale);
      router.refresh();
    });
  }, [setLocale, router]);

  return (
    <header
      aria-label="Seller dashboard navigation"
      className={cn(
        'bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/85 sticky top-0 right-0 left-0 z-50 border-b border-border/80 shadow-xs transition-all duration-200',
        headerHeight
      )}
    >
      <div
        className={cn(
          'flex items-center gap-4 px-4 sm:px-6 lg:px-8 transition-all duration-200 w-full max-w-7xl mx-auto',
          headerHeight
        )}
      >
        {/* Mobile Menu Toggle - Hidden during onboarding */}
        {headerMode === 'default' && (
          <Button
            variant="ghost"
            size="icon"
            className={cn('md:hidden h-11 w-11 rounded-full', isSidebarOpen ? 'bg-muted' : '')}
            aria-label="Toggle menu"
            aria-expanded={isSidebarOpen}
            aria-controls="seller-sidebar"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        )}

        {/* Logo and Branding Section */}
        <SellerHeaderBranding
          isOnboarding={isOnboarding}
          isWizardFlow={isWizardFlow}
          onExitClick={handleExitClick}
        />

        {/* Desktop Search Form - Hidden during onboarding */}
        {headerMode === 'default' ? (
          <form
            onSubmit={handleSearchSubmit}
            role="search"
            aria-label="Seller dashboard search"
            className="mx-auto hidden max-w-sm flex-1 md:block"
          >
            <div className="relative">
              {isSearchPending ? (
                <Loader2 className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4 animate-spin" />
              ) : (
                <Search className="text-muted-foreground pointer-events-none absolute top-2.5 left-2.5 h-4 w-4" />
              )}
              <Input
                ref={searchInputRef}
                type="search"
                maxLength={200}
                placeholder={`Search products, orders, inventory... (${shortcutKey || '⌘K'})`}
                className="bg-background w-full pr-4 pl-8 md:w-64 lg:w-72"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={isSearchPending}
                aria-label="Search"
              />
            </div>
            {/* ARIA live region for screen readers announcement */}
            <div aria-live="polite" aria-atomic="true" className="sr-only">
              {isSearchPending ? 'Searching, please wait...' : ''}
            </div>
          </form>
        ) : (
          /* Wizard step progress - in center */
          <SellerHeaderProgress isWizardFlow={isWizardFlow} />
        )}

        <div className="ml-auto flex items-center space-x-2 md:space-x-4">
          {/* Mobile Search Dialog - Hidden during onboarding */}
          {headerMode === 'default' && (
            <>
              <MobileSearchDialog
                isOpen={isMobileSearchOpen}
                onOpenChange={setIsMobileSearchOpen}
                searchQuery={searchQuery}
                onSearchChange={handleMobileSearchChange}
                onSubmit={(query) => handleSearchSubmit(query)}
                isPending={isSearchPending}
              />
              <NotificationPopover />
            </>
          )}

          {isOnboarding ? (
            <OnboardingHeaderActions
              isWizardFlow={isWizardFlow}
              locale={locale}
              onLocaleChange={handleLocaleChange}
              isLocalePending={isLocalePending}
            />
          ) : (
            <SellerHeaderActions
              locale={locale}
              onLocaleChange={handleLocaleChange}
              isLocalePending={isLocalePending}
            />
          )}
        </div>
      </div>

      {/* Exit Confirmation Dialog */}
      <SellerHeaderExitDialog />
    </header>
  );
});

SellerHeader.displayName = 'SellerHeader';
