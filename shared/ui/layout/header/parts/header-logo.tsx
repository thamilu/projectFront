'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';

export const HeaderLogo = React.memo(function HeaderLogo() {
  return (
    <Link
      href="/"
      aria-label="eShop home"
      className="group flex items-center gap-2 rounded-lg px-1 py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-opacity hover:opacity-90"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs transition-transform group-hover:scale-105">
        <ShoppingBag className="h-4 w-4" />
      </div>
      <span className="text-lg font-black tracking-tight text-foreground">
        e<span className="text-primary">Shop</span>
      </span>
    </Link>
  );
});
