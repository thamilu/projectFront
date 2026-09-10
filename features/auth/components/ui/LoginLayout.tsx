'use client';

import * as React from 'react';

interface LoginLayoutProps {
  children: React.ReactNode;
}

/**
 * Premium layout wrapper for keycloak sign-in screen.
 * Features fluid centering, responsive safe-area padding, mesh gradient background orbs,
 * and high-contrast dark/light mode compatibility.
 */
export function LoginLayout({ children }: LoginLayoutProps) {
  return (
    <div
      className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-zinc-50 px-4 py-12 transition-colors duration-300 sm:px-6 lg:px-8 dark:bg-zinc-950"
      style={{
        paddingBottom: 'max(3rem, env(safe-area-inset-bottom))',
        paddingTop: 'max(3rem, env(safe-area-inset-top))',
      }}
    >
      {/* Mesh Gradient / Background Orbs */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-[40%] -left-[20%] h-[80%] w-[80%] rounded-full bg-emerald-500/5 blur-[120px] filter dark:bg-emerald-500/10" />
        <div className="absolute -right-[20%] -bottom-[40%] h-[80%] w-[80%] rounded-full bg-teal-500/5 blur-[120px] filter dark:bg-teal-500/10" />
      </div>

      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  );
}
