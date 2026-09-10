/**
 * Seller Onboarding Page
 *
 * Public/authenticated page where customers register to become sellers.
 * - Redirects existing sellers to dashboard
 * - Handles two-page flow: Landing Page vs. Registration Wizard
 * - Streams content with Suspense
 * - Fully accessible and keyboard-navigable
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { auth } from '@/auth';

import { SellerRoleUpgradeForm } from '@/features/seller/components/SellerRoleUpgradeForm';
import { getSellerOnboardingStatus } from '@/features/seller/services/seller-status.service';
import { TrustIndicators } from '@/features/seller/components/TrustIndicators';
import { FormSkeleton } from '@/features/seller/components/FormSkeleton';
import { APP_ROUTES } from '@/shared/routes';
import { en } from '@/core/i18n/locales/en';
import { hi } from '@/core/i18n/locales/hi';

import { SubscriptionPlans } from '@/features/seller/components/registration/SubscriptionPlans';
import { SupportFaq } from '@/features/seller/components/registration/SupportFaq';
import { HowItWorks } from '@/features/seller/components/registration/HowItWorks';
import { SellerBenefitsSection } from '@/features/seller/components/SellerBenefitsSection';
import { OnboardingLandingCTA } from '@/features/seller/components/registration/OnboardingLandingCTA';
import { ResumeDraftBanner } from '@/features/seller/components/registration/ResumeDraftBanner';
import {
  LANDING_METRICS,
  HAS_LANDING_METRICS,
} from '@/features/seller/config/landing-metrics.config';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  /*
   * Title only. The (seller) layout's template appends " | Seller Dashboard",
   * so hardcoding "| eShop" here rendered the tab as
   * "Become a Seller | eShop | Seller Dashboard".
   */
  title: 'Become a Seller',
  description: 'Start selling your products to customers worldwide',
  /*
   * No `openGraph` block. A page-level openGraph object replaces the inherited
   * one wholesale — including the generated share image from
   * app/opengraph-image.tsx, which would leave every shared link to this page
   * with a blank preview. og:title and og:description are derived from the
   * `title` and `description` above.
   */
};

interface SellerRoleUpgradeFormWrapperProps {
  isAuthenticated: boolean;
}

/**
 * Async component wrapper to isolate status fetching and allow progressive page streaming
 */
async function SellerRoleUpgradeFormWrapper({ isAuthenticated }: SellerRoleUpgradeFormWrapperProps) {
  const initialStatus = await getSellerOnboardingStatus(isAuthenticated);
  return <SellerRoleUpgradeForm initialStatus={initialStatus} />;
}

export interface SellerOnboardingPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SellerOnboardingPage({ searchParams }: SellerOnboardingPageProps) {
  const session = await auth();
  const params = await searchParams;

  const isAuthenticated = !!session;
  const roles: string[] = session?.roles ?? [];
  const isSeller = roles.includes('SELLER');

  // Defense-in-depth: middleware handles this first
  if (isSeller) {
    redirect(APP_ROUTES.SELLER.DASHBOARD);
  }

  // Load onboarding status from backend if authenticated to catch stale/un-synced sessions
  if (isAuthenticated) {
    const status = await getSellerOnboardingStatus(true);
    if (status === 'SUCCESS') {
      redirect(APP_ROUTES.SELLER.DASHBOARD);
    }
    // Detect query param to display either the Landing Page or Wizard Page
    const isWizardFlow = params.flow === 'wizard';
    if (status === 'PENDING' && !isWizardFlow) {
      redirect('/seller/register?flow=wizard');
    }
  }

  // Load translations based on locale cookie
  const cookieStore = await cookies();
  const locale = cookieStore.get('eshop_locale')?.value === 'hi' ? 'hi' : 'en';
  const dict = locale === 'hi' ? hi : en;

  // Detect query param to display either the Landing Page or Wizard Page
  const isWizardFlow = params.flow === 'wizard';

  if (isWizardFlow) {
    return (
      <>
        {/*
          No <SkipLink> and no <main> here. The root layout (app/layout.tsx)
          already renders the document's single `<main id="main-content">` plus
          its skip link, and the header renders another. Repeating them here
          produced three nested <main> elements sharing one id and three skip
          links aimed at it — verified in the served HTML. `min-h-dvh` rather
          than `min-h-screen` for the same reason the root layout uses it:
          `100vh` overflows on mobile Safari where the toolbar is transient.
        */}
        <div className="min-h-dvh bg-slate-50 dark:bg-slate-950 py-8 lg:py-12">
          <div className="container mx-auto px-4 max-w-7xl">
            {/* Registration Form with Suspense streaming boundary */}
            <section aria-labelledby="registration-form-title" className="relative">
              <h2 id="registration-form-title" className="sr-only">
                {dict.sellerOnboarding.registrationFormTitle}
              </h2>
              <Suspense fallback={<FormSkeleton />}>
                <SellerRoleUpgradeFormWrapper isAuthenticated={isAuthenticated} />
              </Suspense>
            </section>
          </div>
        </div>
      </>
    );
  }

  // Define CTA link based on authentication state
  const ctaLink = isAuthenticated
    ? '/seller/register?flow=wizard'
    : `/api/auth/signin?callbackUrl=${encodeURIComponent('/seller/register?flow=wizard')}`;

  /**
   * Trust-indicator copy comes from the shared dictionary.
   *
   * A 34-line inline `trustTranslations` object previously duplicated these
   * exact strings for en and hi, justified in a comment as a "safeguard against
   * Next.js Turbopack dev caching issues". The duplication was byte-identical to
   * `dict.sellerOnboarding.trust`, and `dict` is already used two lines above
   * for the page title — so the dictionary was demonstrably working. Two copies
   * of the same user-facing strings only guarantees they diverge on the next
   * copy edit.
   */
  const trust = dict.sellerOnboarding.trust;

  const trustItems = [
    {
      id: 'verified',
      iconPath: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
      // Semantic tokens, not raw palette: these already carry verified
      // contrast in both themes, where `green-600`/`green-400` were unchecked.
      bgColor: 'bg-success/10',
      textColor: 'text-success',
      title: trust.verified.title,
      description: trust.verified.description,
    },
    {
      id: 'setup',
      iconPath: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      bgColor: 'bg-info/10',
      textColor: 'text-info',
      title: trust.setup.title,
      description: trust.setup.description,
    },
    {
      id: 'costs',
      iconPath: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      bgColor: 'bg-warning/10',
      textColor: 'text-warning',
      title: trust.costs.title,
      description: trust.costs.description,
    },
  ];

  return (
    <>
      {/* See the wizard branch above for why there is no <main>/<SkipLink> here. */}
      <div className="min-h-dvh bg-gradient-to-b from-white to-gray-50 py-6 lg:py-12 dark:from-gray-950 dark:to-gray-900">
        <div className="container mx-auto px-4 max-w-5xl space-y-8">
          {/* Resume draft notification if available */}
          <ResumeDraftBanner />

          {/* Page Title & Intro */}
          <div className="text-center space-y-6">
            <h1 className="text-slate-900 dark:text-white text-4xl sm:text-5xl font-extrabold tracking-tight max-w-3xl mx-auto leading-tight">
              {dict.sellerOnboarding.title}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto">
              {dict.sellerOnboarding.description}
            </p>
            
            <div className="pt-3 flex flex-col items-center gap-3">
              <OnboardingLandingCTA
                ctaLink={ctaLink}
                position="top"
                ariaLabel="Start selling free — register as a seller now"
                className="bg-primary hover:bg-primary/95 text-white h-14 px-8 rounded-2xl flex items-center justify-center font-bold text-sm tracking-widest uppercase transition-all shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
              >
                Start Selling Free
              </OnboardingLandingCTA>
              
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  ✓ Register Free — No Payment Required
                </span>
                <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
                <span className="flex items-center gap-1">
                  ⚡ Setup takes approximately 5 minutes
                </span>
              </div>
            </div>
          </div>

          {/*
            Headline metrics — rendered only when this deployment has actually
            configured them. Four hardcoded figures previously sat here
            ("10,000+ Active Sellers", "Trusted across India", "24 Hours",
            "0% Commissions"), asserted as fact on every deployment including
            local development, with nothing in the codebase substantiating any
            of them. Quantified claims made to prospective merchants are
            advertising representations and must be substantiable; see
            features/seller/config/landing-metrics.config.ts. An unconfigured
            deployment now shows nothing rather than an invented number.

            `text-primary` rather than the previous `text-indigo-600`: the CTA
            immediately above uses `bg-primary`, so the page was rendering two
            different blues as if both were the brand colour.
          */}
          {HAS_LANDING_METRICS && (
            <div className="grid grid-cols-2 gap-4 border-y border-slate-100 py-8 md:grid-cols-4 dark:border-slate-800">
              {LANDING_METRICS.map((metric) => (
                <div key={metric.id} className="space-y-1 text-center">
                  <p className="text-primary text-2xl font-extrabold tabular-nums sm:text-3xl">
                    {metric.value}
                  </p>
                  <p className="text-foreground text-xs font-bold">{metric.label}</p>
                  {metric.caption && (
                    <p className="text-muted-foreground text-[10px]">{metric.caption}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Trust indicators section */}
          <div className="pt-2">
            <h2 className="text-slate-900 dark:text-white text-lg font-bold text-center mb-6 uppercase tracking-wider">
              Why Partner with eShop?
            </h2>
            <TrustIndicators items={trustItems} registrationFormTitle={dict.sellerOnboarding.registrationFormTitle} />
          </div>

          {/* Seller Benefits section */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-8">
            <SellerBenefitsSection />
          </div>

          {/* How It Works section */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-8">
            <HowItWorks />
          </div>

          {/* FAQ section */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-8 max-w-2xl mx-auto space-y-6">
            <div className="text-center">
              <h2 className="text-slate-900 dark:text-white text-xl font-bold tracking-tight">
                Frequently Asked Questions
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                Everything you need to know about the onboarding and registration process.
              </p>
            </div>
            <SupportFaq />
          </div>

          {/* Subscription Plans & Platform Features Section */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-8">
            <SubscriptionPlans ctaLink={ctaLink} />
          </div>

          {/* Bottom Final CTA */}
          <div className="text-center border-t border-slate-100 dark:border-slate-800 pt-8 pb-3 space-y-4">
            <h3 className="text-slate-900 dark:text-white text-lg font-bold">
              Ready to launch your online storefront?
            </h3>
            <div className="flex flex-col items-center gap-3">
              <OnboardingLandingCTA
                ctaLink={ctaLink}
                position="bottom"
                ariaLabel="Start selling free — register as a seller now"
                className="bg-primary hover:bg-primary/95 text-white h-12 px-8 rounded-xl flex items-center justify-center font-bold text-xs tracking-wider uppercase transition-all shadow-md hover:scale-[1.01] active:scale-[0.99]"
              >
                Start Selling Free
              </OnboardingLandingCTA>
              <div className="flex flex-wrap items-center justify-center gap-x-3 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                <span>✓ Register Free — No Payment Required</span>
                <span>•</span>
                <span>⚡ Setup takes approximately 5 minutes</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
