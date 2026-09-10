/**
 * Auth route-group layout.
 *
 * Wraps sign-in, registration and sign-out.
 *
 * Deliberately has no footer: these are focused, single-task pages where a
 * grid of shop and policy links is a distraction from the one action the user
 * came to complete.
 *
 * `noindex` because an auth screen carries no content worth ranking, and an
 * indexed `/login` competes with the homepage for brand queries while exposing
 * callback-URL parameters to crawlers.
 *
 * @module app/(auth)/layout
 */

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

/**
 * Force per-request rendering for the whole auth route group.
 *
 * login/page.tsx and register/page.tsx both read `useSearchParams()` inside
 * their own top-level `<Suspense>` boundary. If Next statically optimizes
 * these routes, the *build-time* prerender has no search params to read, so
 * the static shell bakes in the Suspense fallback (LoginLoadingState) —
 * while a real per-request dev/prod render resolves the params immediately
 * and produces the actual LoginLayout content instead. Whichever version the
 * client hydrates against can then disagree with whatever the server just
 * sent, surfacing as a `<div>` vs `<Suspense>` hydration mismatch. The root
 * layout's CSP nonce (see core/security/csp.ts) has the same static-vs-request
 * split and shows up the same way (`nonce=""` vs a real value). Forcing
 * dynamic rendering here collapses both to one consistent code path. Auth
 * entry pages have no benefit from static caching anyway.
 */
export const dynamic = 'force-dynamic';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <div className="flex flex-1 flex-col">{children}</div>;
}
