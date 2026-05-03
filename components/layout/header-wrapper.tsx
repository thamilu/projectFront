'use client';

import PromotionalBanner from './promotional-banner';

import Header from './header';
import { APP_ROUTES } from '@/constants/routes/app-routes';

import { usePathname } from 'next/navigation';

export default function HeaderWrapper() {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith(APP_ROUTES.SELLER.BASE);

  if (isDashboard) {
    return null;
  }

  return (
    <>
      <PromotionalBanner />
      <Header />
    </>
  );
}
