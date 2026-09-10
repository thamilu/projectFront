import { cache } from 'react';
import { Suspense, type ReactElement } from 'react';
import type { Session } from 'next-auth';
import { siteConfig } from '@/core/config/site';
import {
  CustomerQuickStats,
  CustomerQuickStatsSkeleton,
  CustomerSectionFallback,
} from '@/features/customer';
import { extractCustomerData, USER_ROLES } from '@/types/auth';
import type { CustomerSessionData } from '@/types/auth';
import { getVisibleSections } from '@/features/home/config/home-sections.config';
import { HomeSection } from './HomeSection';
import { HomePageJsonLd } from './HomePageJsonLd';
import { logger } from '@/core/telemetry';
import { withErrorHandling } from '@/shared/utils';
import { featureFlags } from '@/core/feature-flags';
import { getServerSession } from '@/core/auth/server-session';

const getCachedSession = cache(async (): Promise<Session | null> => {
  return withErrorHandling<Session | null>(() => getServerSession(), 'getCachedSession', null);
});

async function CustomerStatsSection(): Promise<ReactElement | null> {
  const session = await getCachedSession();
  if (!session) return null;

  let customerData: CustomerSessionData | null = null;
  try {
    customerData = extractCustomerData(session, USER_ROLES.CUSTOMER);
  } catch (error) {
    logger.error('Failed to extract customer data in HomePage', {
      error,
      sessionId: session.user?.id ?? 'unknown',
      hasSession: !!session,
    });
    return <CustomerSectionFallback />;
  }

  if (!customerData) return null;

  return (
    <HomeSection
      index={0}
      id="customer-stats"
      priority="immediate"
      ariaLabel="Your account statistics"
      ErrorFallback={CustomerSectionFallback}
      Skeleton={CustomerQuickStatsSkeleton}
      Component={CustomerQuickStats}
      componentProps={{
        userId: customerData.userId,
        userName: customerData.userName,
      }}
    />
  );
}

/**
 * Home page — Server Component, streams sections progressively via Suspense.
 * Auth-dependent UI is deferred so the shell and public sections render immediately.
 */
export async function HomePage(): Promise<ReactElement> {
  const startTime = Date.now();
  const visibleSections = getVisibleSections();
  const showCustomerDashboard = featureFlags.CUSTOMER_DASHBOARD;

  logger.info('HomePage rendered', {
    sectionsCount: visibleSections.length,
    renderDuration: Date.now() - startTime,
    timestamp: new Date().toISOString(),
  });

  return (
    <>
      <HomePageJsonLd />

      <div data-testid="home-page">
        <h1 id="page-title" className="sr-only">
          {siteConfig.name}
        </h1>

        {showCustomerDashboard && (
          <Suspense fallback={<CustomerQuickStatsSkeleton />}>
            <CustomerStatsSection />
          </Suspense>
        )}

        {visibleSections.map((sectionConfig, index) => {
          const sectionIndex = showCustomerDashboard ? index + 1 : index;
          return (
            <HomeSection
              key={sectionConfig.id}
              index={sectionIndex}
              id={sectionConfig.id}
              priority={sectionConfig.priority}
              ariaLabel={sectionConfig.ariaLabel}
              ErrorFallback={sectionConfig.ErrorFallback}
              errorFallbackProps={sectionConfig.errorFallbackProps}
              Skeleton={sectionConfig.Skeleton}
              Component={sectionConfig.Component}
              componentProps={sectionConfig.componentProps}
            />
          );
        })}
      </div>
    </>
  );
}
