'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { APP_ROUTES } from '@/constants/routes/app-routes';
import { Loader2 } from 'lucide-react';

/**
 * /seller/products/add — Redirects to the canonical product creation page.
 * Exists so that APP_ROUTES.SELLER.ADD_PRODUCT resolves correctly.
 */
export default function SellerAddProductRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace(APP_ROUTES.SELLER.PRODUCTS_CREATE);
  }, [router]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}
