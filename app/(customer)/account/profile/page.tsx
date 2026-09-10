/**
 * User Profile Settings Page
 *
 * Enterprise-grade profile page with comprehensive security, accessibility,
 * monitoring, and UX optimizations. Supports dual-address architecture
 * and conditional seller fields.
 *
 * @module app/account/profile
 */

import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { env } from '@/env';
import { getServerAccessToken } from '@/core/auth/server-session';
import { serverBackendFetch } from '@/core/client/server-fetch';
import { API_ENDPOINTS } from '@/shared/constants/api/endpoints';
import { logger } from '@/core/telemetry/logger';
import { ProfileForm, ProfileSkeleton } from '@/features/users';
import { PageContainer, PageViewTracker } from '@/shared/ui/layout';
import { Breadcrumb } from '@/shared/ui/molecules';
import { APP_ROUTES } from '@/shared/routes';
import type { components } from '@/shared/types/generated/api';

type UserResponse = components['schemas']['UserResponse'];

/**
 * Fetches `emailVerified`/`createdAt` from the backend's real UserResponse
 * — these fields do NOT exist on the NextAuth session (buildSessionUser in
 * lib/auth/handlers.ts never sets them; verified directly against that
 * function). Only called when email-verification enforcement is actually
 * enabled, so the common case (flag off) never pays for this extra
 * backend round-trip on every profile page load.
 */
async function getVerifiedAccountFields(): Promise<Pick<
  UserResponse,
  'emailVerified' | 'createdAt'
> | null> {
  try {
    const token = await getServerAccessToken();
    if (!token) return null;
    const { data } = await serverBackendFetch<UserResponse>(API_ENDPOINTS.USERS.PROFILE, token);
    return { emailVerified: data.emailVerified, createdAt: data.createdAt };
  } catch (error) {
    logger.error('[ProfilePage] Failed to fetch account verification status', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Personalize page metadata dynamically based on the active user session.
 * Fallbacks to basic metadata if the session is absent or loading.
 */
export async function generateMetadata(): Promise<Metadata> {
  const session = await auth();

  if (!session?.user) {
    return {
      title: 'Login Required',
      description: 'Please log in to view your profile settings.',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return {
    // No PII (real name) in the title — it lands in the browser tab,
    // history, bookmarks, and OS-level session-restore/recent-tabs
    // surfaces, which would contradict this same metadata's noindex/
    // nofollow/noarchive privacy intent below.
    title: 'Profile Settings',
    description: 'Manage your personal information, address book, and security settings.',
    /*
     * No `openGraph`. It restated the `title` and `description` above — which
     * Next derives automatically — and hardcoded `siteName: 'eShop'` and
     * `locale: 'en_US'`, neither read from config and the latter contradicting
     * the app's configured `en-IN`.
     *
     * On a page that is explicitly noindex/nofollow/noarchive for privacy, no
     * crawler or unfurler will ever consume this data, so the block was pure
     * drift risk for no benefit. Removing it also restores the inherited share
     * image, keeping this route consistent with every other.
     */
    robots: {
      index: false,
      follow: false,
      noarchive: true,
      nocache: true,
    },
    alternates: {
      canonical: '/account/profile',
    },
  };
}

export default async function ProfilePage() {
  /**
   * 1. Authentication Guard
   * Ensure user is signed in, redirecting guests to SSO Keycloak login.
   */
  const session = await auth();

  if (!session?.user) {
    redirect(`${APP_ROUTES.AUTH_LOGIN}?callbackUrl=/account/profile`);
  }

  const { user } = session;

  /**
   * 2. Optional Email Verification Restriction
   * Note: there is no account-suspension/ban field on the backend User
   * entity at all (confirmed against shared/types/generated/api.ts — only
   * seller and delivery-agent sub-profiles have a `status` field), and no
   * /account/suspended or /account/banned page exists. A prior version of
   * this check referenced session.user.status, which the session never
   * actually sets — it silently always evaluated to 'active' and provided
   * no real protection. Removed rather than left as non-functional
   * security theater; revisit if/when the backend adds real account-status
   * support.
   */
  const verifiedAccountFields = env.REQUIRE_EMAIL_VERIFICATION
    ? await getVerifiedAccountFields()
    : null;

  if (env.REQUIRE_EMAIL_VERIFICATION && !verifiedAccountFields?.emailVerified) {
    redirect(`/account/verify-email?returnTo=${encodeURIComponent('/account/profile')}`);
  }

  return (
    <>
      {/* 3. Page View Telemetry Tracking */}
      <PageViewTracker
        pageType="profile"
        userId={user.id}
        metadata={{
          isSeller: user.roles?.includes('SELLER'),
          accountAge: verifiedAccountFields?.createdAt,
        }}
      />

      <PageContainer size="xl" className="pb-16">
        <div className="space-y-4">
          {/* 4. Accessible Breadcrumb Navigation */}
          <Breadcrumb items={[{ label: 'Account', href: '/account' }, { label: 'Profile' }]} />

          {/*
            5. Plain <div>, NOT <main>: the root layout owns the document's only
            `<main id="main-content">`. `tabIndex={-1}` and the focus ring are
            retained so this region can still receive programmatic focus.
          */}
          <div
            tabIndex={-1}
            className="focus:ring-primary rounded-lg focus:ring-2 focus:ring-offset-2 focus:outline-none"
          >
            <div className="mb-6 space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Account Profile
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage your personal identity, contact details, and default addresses.
              </p>
            </div>

            {/* 6. Robust Suspense Boundary */}
            <Suspense fallback={<ProfileSkeleton variant="full" />}>
              <ProfileForm userId={user.id} />
            </Suspense>
          </div>
        </div>
      </PageContainer>
    </>
  );
}

// 7. Dynamic Static Optimization
// `revalidate = 0` is redundant alongside `dynamic = 'force-dynamic'` —
// the latter already fully disables the route segment/data cache; kept
// as a single directive for clarity.
export const dynamic = 'force-dynamic';
