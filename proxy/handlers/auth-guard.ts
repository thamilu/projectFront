import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { APP_ROUTES } from '@/shared/routes';
import { PROTECTED_ROUTE_PREFIXES } from '@/shared/routes';

/**
 * Validates path authorization.
 * Redirects unauthenticated requests trying to access protected route prefixes.
 * Properly handles callbackUrl encoding.
 */
export function applyAuthGuard(
  pathname: string,
  isAuth: boolean,
  req: NextRequest
): NextResponse | null {
  const isRegisterPage = pathname === '/seller/register';
  const isWizard = req.nextUrl.searchParams.get('flow') === 'wizard';
  
  const isProtected = PROTECTED_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix)) && 
                      !(isRegisterPage && !isWizard);

  if (!isProtected || isAuth) return null;

  const loginUrl = new URL(APP_ROUTES.AUTH_LOGIN, req.url);
  const safeCallback = pathname.startsWith('/') ? pathname : '/';
  // If they tried to access wizard, make sure callback preserves the query param
  const callbackPath = isRegisterPage && isWizard ? '/seller/register?flow=wizard' : safeCallback;
  loginUrl.searchParams.set('callbackUrl', callbackPath);

  return NextResponse.redirect(loginUrl);
}
