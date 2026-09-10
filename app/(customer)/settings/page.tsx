'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth';
import { APP_ROUTES } from '@/shared/routes';

// Components
import { SettingsSubNav } from './components/SettingsSubNav';
import { AppearanceSection } from './components/AppearanceSection';
import { NotificationsSection } from './components/NotificationsSection';
import { SecuritySection } from './components/SecuritySection';
import { RegionalSection } from './components/RegionalSection';
import { PrivacySection } from './components/PrivacySection';
import { DangerZoneSection } from './components/DangerZoneSection';
import type { SettingsSectionId } from './components/types';

export default function SettingsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<SettingsSectionId>('appearance');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(APP_ROUTES.AUTH_LOGIN);
    }
  }, [isLoading, isAuthenticated, router]);

  // Formulate normalized account summary view model
  const accountSummary = useMemo(() => {
    const rawUser = user as unknown as Record<string, unknown> | undefined;
    const username = (rawUser?.preferred_username as string) || (rawUser?.sub as string) || (rawUser?.email as string) || 'customer';
    return { username };
  }, [user]);

  const handleSelectSection = useCallback((section: SettingsSectionId) => {
    setActiveSection(section);
    // Scroll content pane to top when switching sections
    const contentEl = document.getElementById('settings-content');
    if (contentEl) {
      contentEl.scrollTo({ top: 0, behavior: 'smooth' });
    }
    // Also scroll the window to bring content into view on mobile
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8 md:px-6 space-y-6">
        <div className="h-24 w-full animate-pulse rounded-xl bg-muted/40" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
          <div className="hidden lg:block h-64 animate-pulse rounded-xl bg-muted/30" />
          <div className="space-y-4">
            <div className="h-48 animate-pulse rounded-xl bg-muted/30" />
            <div className="h-48 animate-pulse rounded-xl bg-muted/30" />
            <div className="h-48 animate-pulse rounded-xl bg-muted/30" />
          </div>
        </div>
      </div>
    );
  }

  /** Render only the active section */
  const renderActiveSection = () => {
    switch (activeSection) {
      case 'appearance':
        return <AppearanceSection />;
      case 'notifications':
        return <NotificationsSection />;
      case 'security':
        return <SecuritySection />;
      case 'regional':
        return <RegionalSection />;
      case 'privacy':
        return <PrivacySection />;
      case 'danger-zone':
        return <DangerZoneSection username={accountSummary.username} />;
      default:
        return <AppearanceSection />;
    }
  };

  return (
    <div className="min-h-[calc(100vh-var(--header-height,4rem))] bg-gradient-to-b from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-6 md:px-6 space-y-6">
        {/* Page Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your interface theme, notifications, security credentials, and account preferences.
          </p>
        </div>

        {/* Dual Layout: Left Sidebar Pane + Right Content Pane */}
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Dedicated Settings Sub-Navigation Sidebar Pane */}
          <SettingsSubNav
            activeSection={activeSection}
            onSelectSection={handleSelectSection}
          />

          {/* Settings Content Landmark Pane — shows only active section */}
          <div
            id="settings-content"
            tabIndex={-1}
            className="flex-1 w-full min-w-0 focus:outline-none"
            aria-label="Settings configuration"
          >
            <div
              key={activeSection}
              className="animate-in fade-in duration-200"
            >
              {renderActiveSection()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
