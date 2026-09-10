'use client';

import * as React from 'react';
import { ShoppingBag } from 'lucide-react';

/**
 * Premium brand identity header for the login card.
 * Centers the brand mark and text for a world-class user-onboarding experience.
 */
export function LoginLogo() {
  return (
    <div className="mb-8 flex flex-col items-center gap-3">
      <div className="bg-primary/10 flex h-14 w-14 items-center justify-center rounded-2xl shadow-inner dark:bg-emerald-500/10">
        <ShoppingBag className="text-primary h-7 w-7 dark:text-emerald-400" aria-hidden="true" />
      </div>
      <span className="text-foreground text-lg font-bold tracking-wider uppercase">eShop</span>
    </div>
  );
}
