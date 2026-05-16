'use client';

import { Bell, Search, Menu } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UserNav } from './user-nav';
import { ThemeToggle } from '@/components/theme-toggle';

export function SellerHeader() {
  return (
    <header className="bg-background fixed top-0 right-0 left-0 z-50 border-b">
      <div className="flex h-16 items-center gap-4 px-4">
        {/* Mobile Menu Toggle - visible on small screens */}
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Toggle menu">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>

        <Link
          href="/"
          aria-label="eShop home"
           className="hidden tracking-tight md:block from-primary via-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 bg-linear-to-r bg-clip-text text-2xl font-extrabold text-transparent transition-all"
        >
          eShop
        </Link>

        {/* Search */}
        <div className="mx-auto hidden max-w-xl flex-1 md:block">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
            <Input
              type="search"
              placeholder="Search products, orders, inventory..."
              className="bg-background w-full pl-8 md:w-75 lg:w-96"
            />
          </div>
        </div>

        <div className="ml-auto flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-600" />
            <span className="sr-only">Notifications</span>
          </Button>
          <ThemeToggle />
          <UserNav />
        </div>
      </div>
    </header>
  );
}
