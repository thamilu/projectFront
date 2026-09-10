'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { APP_ROUTES } from '@/shared/routes';

export default function AccountOrdersPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace(APP_ROUTES.ORDERS);
  }, [router]);
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">Redirecting to orders…</p>
    </div>
  );
}
