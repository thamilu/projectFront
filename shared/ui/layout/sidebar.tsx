"use client";

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';

import { UserRole } from '@/domains/auth/contracts/auth.types';
import { Home, LayoutDashboard, Users, Package, ShoppingCart, Settings, Truck, Clock } from 'lucide-react';
import { APP_ROUTES } from '@/shared/constants/routes/app-routes';

function classNames(...args: Array<string | false | null | undefined>) {
  return args.filter(Boolean).join(' ');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const NAV_CONFIG: Record<string, { label: string; links: { href: string; label: string; Icon?: any }[] }> = {

  [UserRole.SELLER]: {
    label: 'Seller',
    links: [
      { href: APP_ROUTES.SELLER.DASHBOARD, label: 'Dashboard', Icon: LayoutDashboard },
      { href: APP_ROUTES.SELLER.PRODUCTS, label: 'Products', Icon: Package },
      { href: '/seller/inventory', label: 'Inventory', Icon: Package },
      { href: APP_ROUTES.SELLER.ORDERS, label: 'Orders', Icon: ShoppingCart },
    ],
  },
  [UserRole.DELIVERY_AGENT]: {
    label: 'Delivery',
    links: [
      { href: APP_ROUTES.DELIVERY.DASHBOARD, label: 'Dashboard', Icon: Truck },
      { href: '/delivery/assigned', label: 'Assigned', Icon: Truck },
      { href: '/delivery/history', label: 'History', Icon: Clock },
    ],
  },
  [UserRole.CUSTOMER]: {
    label: 'Shopping',
    links: [
      { href: APP_ROUTES.PRODUCTS, label: 'Browse', Icon: Package },
      { href: APP_ROUTES.CART, label: 'Cart', Icon: ShoppingCart },
      { href: APP_ROUTES.ORDERS, label: 'Orders', Icon: ShoppingCart },
    ],
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function NavLink({ href, children, Icon, pathname }: { href: string; children: React.ReactNode; Icon?: any; pathname: string }) {
  const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={classNames(
        'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
        isActive ? 'bg-accent text-accent-foreground font-medium' : 'hover:bg-accent hover:text-accent-foreground'
      )}
    >
      {Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />}
      {children}
    </Link>
  );
}

export default function Sidebar() {
  const { data: session, status } = useSession(); // Use next-auth session directly
  const pathname = usePathname() || '';

  // Roles from session are more reliable in this context
  const roles = (session?.roles || []) as string[];
  const hasRoles = roles.length > 0;
  const isLoading = status === 'loading';

  // If auth is still resolving, show skeleton to avoid layout shift
  if (isLoading) {
    return (
      <aside className="hidden lg:flex lg:flex-col w-60 border-r bg-background">
        <nav aria-label="Main sidebar navigation" className="p-4 space-y-2">
          <div className="h-9 w-full rounded-md bg-muted/50 animate-pulse" />
          <div className="h-9 w-full rounded-md bg-muted/50 animate-pulse" />
          <div className="h-9 w-full rounded-md bg-muted/50 animate-pulse" />
          <div className="h-9 w-full rounded-md bg-muted/50 animate-pulse" />
        </nav>
      </aside>
    );
  }

  return (
    <aside className="hidden lg:flex lg:flex-col w-60 border-r bg-background">
      <nav aria-label="Main sidebar navigation" className="flex-1 overflow-y-auto p-4 space-y-4 text-sm">
        <div>
          <NavLink href="/" pathname={pathname} Icon={Home}>
            Home
          </NavLink>
        </div>

        {/* Render sections based on roles. Customer links render if no roles or if Customer present */}
        {hasRoles ? (
          Object.values(UserRole).map((role) => {
            // only render sections the user has
            if (!roles.includes(role)) return null;
            const cfg = NAV_CONFIG[role];
            if (!cfg) return null;

            return (
              <section key={role} aria-labelledby={`${role}-nav`}>
                <h2 id={`${role}-nav`} className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {cfg.label}
                </h2>
                <div className="space-y-1">
                  {cfg.links.map((link) => (
                    <NavLink key={link.href} href={link.href} pathname={pathname} Icon={link.Icon}>
                      {link.label}
                    </NavLink>
                  ))}
                </div>
              </section>
            );
          })
        ) : (
          // default customer navigation when unauthenticated or no roles
          <section aria-labelledby="shopping-nav">
            <h2 id="shopping-nav" className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Shopping</h2>
            <div className="space-y-1">
              {NAV_CONFIG[UserRole.CUSTOMER].links.map((link) => (
                <NavLink key={link.href} href={link.href} pathname={pathname} Icon={link.Icon}>
                  {link.label}
                </NavLink>
              ))}
            </div>
          </section>
        )}
      </nav>
    </aside>
  );
}
