'use client';

import { useSession } from 'next-auth/react';
import { LoadingPage } from '@/components/ui/loading';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { status } = useSession();

  // While NextAuth is loading the session, show the loading page
  if (status === 'loading') {
    return <LoadingPage />;
  }

  // If unauthenticated, return null and let middleware/client handle redirects
  if (status === 'unauthenticated') {
    return null;
  }

  return <div>{children}</div>;
}
