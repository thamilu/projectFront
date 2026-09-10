import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Session } from 'next-auth';
import { RBAC_RULES } from '@/proxy/config/rbac.config';

/**
 * Evaluates role-based access control (RBAC) rules on incoming requests.
 * Loops through registered config prefixes.
 * Returns NextResponse redirect on authorization failures or onboarding bypasses.
 */
export function applyRbac(
  pathname: string,
  session: Session | null,
  req: NextRequest
): NextResponse | null {
  const roles = (session?.roles ?? session?.user?.roles ?? []).map((r) => r.toUpperCase());

  for (const rule of RBAC_RULES) {
    if (!pathname.startsWith(rule.prefix)) continue;

    const hasRole = roles.includes(rule.requiredRole.toUpperCase());
    const isOnboardPath = rule.onboardPath ? pathname.startsWith(rule.onboardPath) : false;

    // Already enrolled — redirect away from onboarding
    if (isOnboardPath && hasRole && rule.alreadyEnrolledRedirect) {
      return NextResponse.redirect(new URL(rule.alreadyEnrolledRedirect, req.url));
    }

    // Not enrolled — redirect to onboarding or login page
    if (!isOnboardPath && !hasRole) {
      return NextResponse.redirect(new URL(rule.redirectTo, req.url));
    }
  }

  return null;
}
