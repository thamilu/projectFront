'use client';

import { usePathname } from 'next/navigation';
import { SellerHeader, SellerSidebar, SellerGuard } from '@/features/seller';
import { APP_ROUTES } from '@/shared/constants/routes/app-routes';

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log('[SellerLayout] Rendering layout');
  const pathname = usePathname();
  const isOnboarding = pathname === APP_ROUTES.SELLER.REGISTER;

  return (
    <div className="min-h-screen bg-muted/40">
      <SellerHeader />
      <div className="flex pt-16">
        {!isOnboarding && <SellerSidebar />}
        <main 
          className={`flex-1 p-6 md:p-8 transition-all duration-300 ${
            isOnboarding ? 'ml-0' : 'ml-0 md:ml-64'
          }`}
        >
          <SellerGuard>
            {children}
          </SellerGuard>
        </main>
      </div>
    </div>
  );
}
