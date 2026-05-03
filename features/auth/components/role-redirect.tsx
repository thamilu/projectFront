'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { APP_ROUTES } from '@/constants/routes/app-routes';

/**
 * Role-based redirect component
 * Redirects users to appropriate dashboard based on their role after login
 * Only runs once on mount to avoid redirect loops
 */
export function RoleBasedRedirect() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const hasRedirected = useRef(false);
  
  useEffect(() => {
    // Only run redirect logic if we're on the home page AND authenticated
    // AND we haven't already redirected
    if (hasRedirected.current || pathname !== '/' || status !== 'authenticated' || !session) {
      return;
    }
    
    const roles = (session.roles || []).map((r: string) => r.toUpperCase());
    
    // Check if there's a callback URL from the search params
    const callbackUrl = searchParams?.get('callbackUrl');
    
    // If there's a specific callback URL and it's not the root, use it
    if (callbackUrl && callbackUrl !== '/' && !callbackUrl.includes('/auth/signin')) {
      hasRedirected.current = true;
      router.push(callbackUrl);
      return;
    }
    
    // Role-based redirect - only from home page
    // SELLER / DELIVERY_AGENT → their own operational dashboards
    // CUSTOMER → stays on home page (product catalog + stores) for best shopping UX
    if (roles.includes('ADMIN')) {
      hasRedirected.current = true;
      router.push(APP_ROUTES.DASHBOARD); // /dashboard (admin)
    } else if (roles.includes('SELLER')) {
      hasRedirected.current = true;
      router.push(APP_ROUTES.SELLER.DASHBOARD);
    } else if (roles.includes('DELIVERY_AGENT')) {
      hasRedirected.current = true;
      router.push(APP_ROUTES.DELIVERY.DASHBOARD);
    }
    // CUSTOMER: no redirect — home page IS the product catalog landing page
  }, [session, status, router, searchParams, pathname]);
  
  return null; // This component doesn't render anything
}
