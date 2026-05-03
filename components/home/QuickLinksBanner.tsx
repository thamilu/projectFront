'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Tag,
  TrendingUp,
  Clock,
  Sparkles,
  Menu,
  Gift,
  HelpCircle,
  Store,
  CreditCard,
  Percent,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { APP_ROUTES } from '@/constants/routes/app-routes';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

import { useSession } from 'next-auth/react';
import { useMemo } from 'react';

const QUICK_LINKS = [
  { href: '/deals', label: "Today's Deals", shortLabel: 'Deals', icon: Tag },
  { href: '/trending', label: 'Trending Now', shortLabel: 'Trending', icon: TrendingUp },
  { href: '/flash-sales', label: 'Flash Sales', shortLabel: 'Sales', icon: Clock },
  { href: '/new-arrivals', label: 'New Arrivals', shortLabel: 'New', icon: Sparkles },
  { href: '/gift-cards', label: 'Gift Cards', shortLabel: 'Gifts', icon: Gift },
  { href: '/clearance', label: 'Clearance', shortLabel: 'Clearance', icon: Percent },
] as const;

export function QuickLinksBanner() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isSeller = useMemo(() => {
    const roles = (session?.roles || []) as string[];
    return roles.map(r => r.toUpperCase()).includes('SELLER');
  }, [session]);

  const additionalLinks = useMemo(() => [
    { href: APP_ROUTES.HELP, label: 'Customer Service', icon: HelpCircle },
    {
      href: isSeller ? APP_ROUTES.SELLER.DASHBOARD : APP_ROUTES.SELLER.REGISTER,
      label: 'Sell on eShop',
      icon: Store
    },
    { href: '/gift-cards', label: 'Gift Cards', icon: CreditCard },
  ], [isSeller]);

  return (
    <section
      className="from-primary to-secondary bg-linear-to-r py-3 shadow-md"
      aria-label="Quick navigation"
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between gap-4">
          {/* Mobile Menu Button */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 shrink-0 rounded-full bg-white/20 text-white hover:bg-white/30 hover:text-white focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:outline-none lg:hidden"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-64 pb-[env(safe-area-inset-bottom)] pl-[max(1rem,env(safe-area-inset-left))]"
            >
              <SheetHeader>
                <SheetTitle>Quick Navigation</SheetTitle>
                <SheetDescription>Access all deals, promotions, and services</SheetDescription>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-1">
                <div className="mb-2">
                  <h3 className="text-muted-foreground mb-2 px-3 text-xs font-semibold">SHOP</h3>
                  {QUICK_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="hover:bg-accent flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors"
                    >
                      <link.icon className="h-4 w-4" aria-hidden="true" />
                      {link.label}
                    </Link>
                  ))}
                </div>
                <div>
                  <h3 className="text-muted-foreground mb-2 px-3 text-xs font-semibold">
                    SERVICES
                  </h3>
                  {additionalLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="hover:bg-accent flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors"
                    >
                      <link.icon className="h-4 w-4" aria-hidden="true" />
                      {link.label}
                    </Link>
                  ))}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
          {/* Desktop Quick Links */}
          <nav
            className="flex flex-1 items-center justify-center gap-1 lg:gap-2 xl:gap-4"
            aria-label="Quick links"
          >
            {QUICK_LINKS.map((link) => {
              const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-1.5',
                    'min-h-11 px-2 py-2 lg:px-3',
                    'text-xs font-semibold text-white lg:text-sm',
                    'rounded-md',
                    'hover:bg-white/10 active:bg-white/20',
                    'transition-colors motion-reduce:transition-none',
                    'focus-visible:outline-none',
                    'focus-visible:ring-2',
                    'focus-visible:ring-white',
                    'focus-visible:ring-offset-2',
                    'focus-visible:ring-offset-primary',
                    isActive && 'bg-white/20 ring-1 ring-white/40'
                  )}
                >
                  <link.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="hidden whitespace-nowrap sm:inline lg:inline">{link.label}</span>
                  <span className="whitespace-nowrap sm:hidden">{link.shortLabel}</span>
                </Link>
              );
            })}
          </nav>

          {/* Desktop Additional Links */}
          <div className="hidden shrink-0 items-center gap-3 xl:flex">
            {additionalLinks.slice(0, 2).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white"
              >
                <link.icon className="h-4 w-4" aria-hidden="true" />
                <span className="whitespace-nowrap">{link.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
