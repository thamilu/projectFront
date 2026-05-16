'use client';

import dynamic from 'next/dynamic';

const RoleBasedRedirectInner = dynamic(
  () => import('./role-redirect').then((mod) => mod.RoleBasedRedirect),
  { ssr: false }
);

export function RoleBasedRedirect() {
  return <RoleBasedRedirectInner />;
}
