'use client';

import Header from './header';
import { HeaderErrorBoundary } from './header-boundary';
import { APP_ROUTES } from '@/shared/routes';
import { usePathname } from 'next/navigation';

export default function HeaderWrapper() {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith(APP_ROUTES.SELLER.BASE);

  if (isDashboard) {
    return null;
  }

  return (
    <HeaderErrorBoundary>
      <Header />
    </HeaderErrorBoundary>
  );
}
