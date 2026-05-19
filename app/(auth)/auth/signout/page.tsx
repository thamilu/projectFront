'use client';

import { useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { APP_ROUTES } from '@/shared/constants/routes/app-routes';

export default function SignOutPage() {
  useEffect(() => {
    signOut({ callbackUrl: APP_ROUTES.AUTH_LOGIN });
  }, []);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground">Signing you out...</p>
      </div>
    </div>
  );
}
